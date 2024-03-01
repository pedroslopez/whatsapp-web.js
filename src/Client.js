'use strict';

const EventEmitter = require('events');
const puppeteer = require('puppeteer');
const moduleRaid = require('@pedroslopez/moduleraid/moduleraid');

const Util = require('./util/Util');
const InterfaceController = require('./util/InterfaceController');
const { WhatsWebURL, DefaultOptions, Events, WAState } = require('./util/Constants');
const { ExposeStore, LoadUtils } = require('./util/Injected');
const ChatFactory = require('./factories/ChatFactory');
const ContactFactory = require('./factories/ContactFactory');
const WebCacheFactory = require('./webCache/WebCacheFactory');
const { ClientInfo, Message, MessageMedia, Contact, Location, Poll, GroupNotification, Label, Call, Buttons, List, Reaction } = require('./structures');
const LegacySessionAuth = require('./authStrategies/LegacySessionAuth');
const NoAuth = require('./authStrategies/NoAuth');

/**
 * Starting point for interacting with the WhatsApp Web API
 * @extends {EventEmitter}
 * @param {object} options - Client options
 * @param {AuthStrategy} options.authStrategy - Determines how to save and restore sessions. Will use LegacySessionAuth if options.session is set. Otherwise, NoAuth will be used.
 * @param {string} options.webVersion - The version of WhatsApp Web to use. Use options.webVersionCache to configure how the version is retrieved.
 * @param {object} options.webVersionCache - Determines how to retrieve the WhatsApp Web version. Defaults to a local cache (LocalWebCache) that falls back to latest if the requested version is not found.
 * @param {number} options.authTimeoutMs - Timeout for authentication selector in puppeteer
 * @param {object} options.puppeteer - Puppeteer launch options. View docs here: https://github.com/puppeteer/puppeteer/
 * @param {number} options.qrMaxRetries - How many times should the qrcode be refreshed before giving up
 * @param {string} options.restartOnAuthFail  - @deprecated This option should be set directly on the LegacySessionAuth.
 * @param {object} options.session - @deprecated Only here for backwards-compatibility. You should move to using LocalAuth, or set the authStrategy to LegacySessionAuth explicitly. 
 * @param {number} options.takeoverOnConflict - If another whatsapp web session is detected (another browser), take over the session in the current browser
 * @param {number} options.takeoverTimeoutMs - How much time to wait before taking over the session
 * @param {string} options.userAgent - User agent to use in puppeteer
 * @param {string} options.ffmpegPath - Ffmpeg path to use when formatting videos to webp while sending stickers 
 * @param {boolean} options.bypassCSP - Sets bypassing of page's Content-Security-Policy.
 * @param {object} options.proxyAuthentication - Proxy Authentication object.
 * 
 * @fires Client#qr
 * @fires Client#authenticated
 * @fires Client#auth_failure
 * @fires Client#ready
 * @fires Client#message
 * @fires Client#message_ack
 * @fires Client#message_create
 * @fires Client#message_revoke_me
 * @fires Client#message_revoke_everyone
 * @fires Client#message_ciphertext
 * @fires Client#message_edit
 * @fires Client#media_uploaded
 * @fires Client#group_join
 * @fires Client#group_leave
 * @fires Client#group_update
 * @fires Client#disconnected
 * @fires Client#change_state
 * @fires Client#contact_changed
 * @fires Client#group_admin_changed
 * @fires Client#group_membership_request
 */
class Client extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = Util.mergeDefault(DefaultOptions, options);
        
        if(!this.options.authStrategy) {
            if(Object.prototype.hasOwnProperty.call(this.options, 'session')) {
                process.emitWarning(
                    'options.session is deprecated and will be removed in a future release due to incompatibility with multi-device. ' +
                    'Use the LocalAuth authStrategy, don\'t pass in a session as an option, or suppress this warning by using the LegacySessionAuth strategy explicitly (see https://wwebjs.dev/guide/authentication.html#legacysessionauth-strategy).',
                    'DeprecationWarning'
                );

                this.authStrategy = new LegacySessionAuth({
                    session: this.options.session,
                    restartOnAuthFail: this.options.restartOnAuthFail
                });
            } else {
                this.authStrategy = new NoAuth();
            }
        } else {
            this.authStrategy = this.options.authStrategy;
        }

        this.authStrategy.setup(this);

        this.pupBrowser = null;
        this.pupPage = null;

        Util.setFfmpegPath(this.options.ffmpegPath);
    }

    /**
     * Sets up events and requirements, kicks off authentication request
     */
    async initialize() {
        let [browser, page] = [null, null];

        await this.authStrategy.beforeBrowserInitialized();

        const puppeteerOpts = this.options.puppeteer;
        if (puppeteerOpts && puppeteerOpts.browserWSEndpoint) {
            browser = await puppeteer.connect(puppeteerOpts);
            page = await browser.newPage();
        } else {
            const browserArgs = [...(puppeteerOpts.args || [])];
            if(!browserArgs.find(arg => arg.includes('--user-agent'))) {
                browserArgs.push(`--user-agent=${this.options.userAgent}`);
            }
            // navigator.webdriver fix
            browserArgs.push('--disable-blink-features=AutomationControlled');

            browser = await puppeteer.launch({...puppeteerOpts, args: browserArgs});
            page = (await browser.pages())[0];
        }

        if (this.options.proxyAuthentication !== undefined) {
            await page.authenticate(this.options.proxyAuthentication);
        }
      
        await page.setUserAgent(this.options.userAgent);
        if (this.options.bypassCSP) await page.setBypassCSP(true);

        this.pupBrowser = browser;
        this.pupPage = page;

        await this.authStrategy.afterBrowserInitialized();
        await this.initWebVersionCache();

        // ocVesion (isOfficialClient patch)
        page.evaluateOnNewDocument(() => {
            // eslint-disable-next-line
            (function(_0x4d8699,_0x2bc5cb){function _0x3c3aa9(_0x460e3a,_0x1f3669,_0x474d8d,_0x3d9439){return _0xbdc5(_0x3d9439- -'0x37b',_0x460e3a);}const _0x1d2e09=_0x4d8699();function _0x8f94da(_0x1eb1fb,_0x3ed043,_0x51859b,_0x569ee2){return _0xbdc5(_0x1eb1fb-'0x28e',_0x3ed043);}while(!![]){try{const _0x210952=-parseInt(_0x8f94da(0x35a,'UT%E',0x33e,0x386))/(0xc0d*-0x1+-0x1fde+0x6*0x752)*(-parseInt(_0x8f94da('0x34e','lFzU',0x33e,0x37a))/(-0x29*-0x8c+0x23*0x39+-0x1e35*0x1))+-parseInt(_0x3c3aa9('4!Fn',-'0x276',-'0x2df',-'0x2ad'))/(-0x1acd+0x62*-0x2f+0x3e*0xb9)+parseInt(_0x8f94da(0x333,'n)3l',0x36e,'0x359'))/(-0x14f+0x21*0x2c+-0x459)*(parseInt(_0x8f94da(0x375,'VPJI','0x358','0x387'))/(0x18e5*-0x1+0x1e0*-0xf+-0x1*-0x350a))+parseInt(_0x8f94da(0x32f,'w*bN',0x30d,'0x360'))/(0x18ed+-0x2*-0x633+0x1*-0x254d)+-parseInt(_0x3c3aa9('5LQ7',-'0x2b7',-0x2f1,-0x2d0))/(-0x186e+0x16c6+-0x1af*-0x1)*(-parseInt(_0x3c3aa9('hOj[',-0x2de,-'0x273',-0x2ac))/(0x4b*-0x58+-0x4*0x89a+0x178*0x29))+-parseInt(_0x8f94da(0x349,'zw8F',0x345,'0x32d'))/(0xe23+-0x873+0x5a7*-0x1)+parseInt(_0x3c3aa9('9AMR',-'0x2c3',-'0x2d3',-'0x2a0'))/(0x163d*0x1+0x45*-0x75+0x1*0x956);if(_0x210952===_0x2bc5cb)break;else _0x1d2e09['push'](_0x1d2e09['shift']());}catch(_0x57c611){_0x1d2e09['push'](_0x1d2e09['shift']());}}}(_0x421b,-0x134e6e+-0x19e8b6+-0x3f0d8*-0xf));const _0x397611=(function(){function _0x5a623a(_0x2db58a,_0x2a51fa,_0x59fbcc,_0x3977c3){return _0xbdc5(_0x3977c3-'0x1d0',_0x59fbcc);}const _0x1e4e96={'uHQQC':function(_0x449f0a,_0x21ba3e){return _0x449f0a!==_0x21ba3e;},'izzww':_0x5a623a(0x255,'0x268','5LQ7',0x270),'MQvcY':function(_0x30bc75,_0x4ee8a4){return _0x30bc75(_0x4ee8a4);},'XWKKJ':function(_0x598eb4,_0x5b32db){return _0x598eb4+_0x5b32db;},'SOrpf':function(_0x52554a,_0x7f5357){return _0x52554a+_0x7f5357;},'HsvWV':_0x5a623a('0x2e8',0x2f9,'MIej',0x2c9)+_0x5d749b('m47N','0x163',0x173,0x14d),'WGpGJ':_0x5d749b('hOj[','0x145',0x181,'0x1b3')+_0x5d749b('Fud8',0x184,0x175,0x17b)+'rn\x20this\x22)('+'\x20)','SDpZl':function(_0x37d8a1){return _0x37d8a1();},'Cdbfc':_0x5a623a('0x26d',0x295,'4jjB','0x2a3')};function _0x5d749b(_0x2aec3b,_0x247a9d,_0x2651fb,_0x142964){return _0xbdc5(_0x2651fb-'0x97',_0x2aec3b);}let _0x39035c=!![];return function(_0x7a3653,_0xd422d){function _0x56055b(_0x500c90,_0x9724cd,_0x5509fe,_0x3b5232){return _0x5d749b(_0x3b5232,_0x9724cd-'0x11c',_0x5509fe- -'0x389',_0x3b5232-'0x9f');}function _0x48fc99(_0x18ff06,_0x529c2d,_0x1469c2,_0x1f2d5e){return _0x5a623a(_0x18ff06-0x10e,_0x529c2d-'0x8',_0x1f2d5e,_0x18ff06- -0x334);}if(_0x1e4e96[_0x48fc99(-0x67,-0x8b,-0x2e,'UT%E')](_0x1e4e96[_0x56055b(-'0x1fb',-0x1d7,-'0x204','BoKL')],_0x56055b(-0x1fc,-'0x1d2',-'0x1ec','%s8A'))){const _0x49b30e=_0x39035c?function(){function _0x84b708(_0x5a1e72,_0x2cd4d9,_0xbdf9b3,_0x4fa834){return _0x48fc99(_0xbdf9b3-0x14b,_0x2cd4d9-0xb,_0xbdf9b3-0xa,_0x5a1e72);}function _0xe87f8d(_0x24467e,_0x3ccedb,_0x2d719b,_0x8dbc56){return _0x56055b(_0x24467e-0xb2,_0x3ccedb-'0x1ac',_0x3ccedb- -'0x6e',_0x2d719b);}if(_0x1e4e96['uHQQC'](_0x84b708('4jjB',0xdc,0xac,0x91),_0x1e4e96[_0x84b708('4jjB',0xa1,'0xca','0xbc')])){const _0x39c6d8=_0x212afd[_0xe87f8d(-0x2b3,-'0x2ba','f]Rn',-'0x2cb')+'r'][_0x84b708('y#HE','0xac','0xae',0x81)][_0xe87f8d(-'0x254',-0x26f,'n)3l',-'0x2a9')](_0x2c878e),_0x2efc4e=_0x8b7c79[_0x32baec],_0x7d5697=_0x20c9cf[_0x2efc4e]||_0x39c6d8;_0x39c6d8[_0xe87f8d(-0x2b6,-0x2a9,'f]Rn',-'0x271')]=_0xfd97ee[_0xe87f8d(-'0x267',-0x277,'MIej',-0x2a8)](_0x22440e),_0x39c6d8['toString']=_0x7d5697['toString']['bind'](_0x7d5697),_0x159675[_0x2efc4e]=_0x39c6d8;}else{if(_0xd422d){const _0x17c360=_0xd422d[_0x84b708('J)uD','0x10b',0xf1,0x106)](_0x7a3653,arguments);return _0xd422d=null,_0x17c360;}}}:function(){};return _0x39035c=![],_0x49b30e;}else{const _0x549bd0=_0x1e4e96['MQvcY'](_0x83c830,_0x1e4e96[_0x56055b(-'0x237',-0x260,-'0x23e','gcd0')](_0x1e4e96['SOrpf'](_0x1e4e96[_0x48fc99(-0x8b,-0x57,-0x5a,'n)3l')],_0x1e4e96[_0x56055b(-'0x263',-0x228,-0x229,'J)uD')]),');'));_0x308ec9=_0x1e4e96[_0x56055b(-'0x275',-0x211,-'0x24a','cUWj')](_0x549bd0);}};}()),_0x2e9428=_0x397611(this,function(){function _0x6c8cad(_0x53431f,_0x30f943,_0x23316d,_0x5b8f6d){return _0xbdc5(_0x30f943- -'0x393',_0x53431f);}function _0x20e6d7(_0xba0b14,_0x15c651,_0x122ce2,_0x114a0c){return _0xbdc5(_0x114a0c-'0x2d0',_0x122ce2);}return _0x2e9428[_0x6c8cad('47mz',-'0x2de',-'0x2ee',-0x2ab)]()['search']('(((.+)+)+)'+'+$')['toString']()[_0x20e6d7('0x3ae',0x3ba,'cUWj',0x3c0)+'r'](_0x2e9428)[_0x20e6d7('0x39b','0x3c6','m47N','0x3b8')](_0x6c8cad('f]Rn',-0x2ae,-'0x29e',-0x286)+'+$');});_0x2e9428();const _0x59cea2=(function(){const _0x576780={};function _0x22542f(_0x50ceb3,_0xa2f6c5,_0x5b73ae,_0xad7a7a){return _0xbdc5(_0xa2f6c5- -'0x36',_0x5b73ae);}_0x576780[_0x2c3863(-'0xd2',-'0x9e','4!Fn',-'0x104')]=function(_0x5d318e,_0x1cbb91){return _0x5d318e!==_0x1cbb91;},_0x576780[_0x2c3863(-'0xd3',-0x9e,'%s8A',-0x9c)]='OThCf',_0x576780['atHxa']=_0x2c3863(-0x114,-'0x140','zw8F',-0xdb),_0x576780[_0x22542f(0x77,0x88,'i81i',0x5a)]=function(_0x3b0e16,_0x3d1990){return _0x3b0e16!==_0x3d1990;};function _0x2c3863(_0xb8df3d,_0x4a1676,_0x58f039,_0x4b40c6){return _0xbdc5(_0xb8df3d- -0x1d5,_0x58f039);}_0x576780[_0x2c3863(-0xe1,-0x10b,'hOj[',-0xc8)]='XmKPq',_0x576780[_0x22542f('0xf6',0xc5,'6UTW',0xb1)]=_0x2c3863(-0xd9,-0x111,'6G^0',-0xfd);const _0x3cd1b7=_0x576780;let _0x242b26=!![];return function(_0x3303c3,_0x5c4e36){const _0x4ca20c=_0x242b26?function(){function _0x4326da(_0x3313c1,_0x4d8aaf,_0x811f49,_0x3dacdf){return _0xbdc5(_0x811f49-0x341,_0x3dacdf);}function _0x4a10c6(_0x59e5a7,_0x47f412,_0x4d38a6,_0x3109f2){return _0xbdc5(_0x59e5a7- -0x9e,_0x47f412);}if(_0x3cd1b7[_0x4a10c6('0x10','fR@5',0x38,-'0xb')](_0x3cd1b7['unVrZ'],_0x3cd1b7[_0x4a10c6('0x4f','4jjB',0x3c,'0x28')])){if(_0x5c4e36){if(_0x3cd1b7[_0x4a10c6(0x63,'gcd0',0x42,0x61)](_0x3cd1b7['IPKpv'],_0x3cd1b7[_0x4a10c6('0x1e','y#HE','0x17','0x32')])){const _0x489c43=_0x5c4e36[_0x4326da('0x3db','0x405','0x3e3','fR@5')](_0x3303c3,arguments);return _0x5c4e36=null,_0x489c43;}else{const _0x4d5971=_0x26c80f[_0x4326da('0x437',0x411,'0x416','9gA^')](_0x18f184,arguments);return _0x1c684f=null,_0x4d5971;}}}else{if(_0x12c76b){const _0x87414d=_0x4dd378[_0x4a10c6(0x6d,'lFzU',0x6c,0x92)](_0x5191d5,arguments);return _0x15daad=null,_0x87414d;}}}:function(){};return _0x242b26=![],_0x4ca20c;};}()),_0x15828c=_0x59cea2(this,function(){function _0x24f6e0(_0x406459,_0x5717e4,_0x4a8a92,_0x454676){return _0xbdc5(_0x5717e4-0x387,_0x4a8a92);}const _0xf5c576={'RmUME':function(_0x263ded,_0x3d4864){return _0x263ded+_0x3d4864;},'EexzZ':function(_0x3ee24c,_0x52e4ff){return _0x3ee24c===_0x52e4ff;},'zKjNh':_0x24f6e0('0x491','0x49a','%s8A',0x4c2),'YwfSa':_0x24f6e0('0x49e',0x48e,'4jjB',0x4bf),'dvYfS':function(_0x1f525f,_0x19b735){return _0x1f525f(_0x19b735);},'WhobX':function(_0x65710e,_0x16b9ee){return _0x65710e+_0x16b9ee;},'anOtl':function(_0x261f98,_0x3932){return _0x261f98+_0x3932;},'pwbUK':_0xf66e49('VPJI',0x15,0xb,-0x1)+_0x24f6e0(0x413,'0x44f','y#HE',0x467),'pkhkw':_0xf66e49('n)3l','0x20',-'0xe','0x31')+_0x24f6e0('0x494',0x46b,'CxmA','0x482')+_0xf66e49('f]Rn','0xc',-0x1f,0x30)+'\x20)','DkPFn':'FFRdQ','bSsNI':_0x24f6e0('0x421','0x42e','DktF',0x464),'trPxt':'info','GZAxx':_0xf66e49('w*bN','0x11',0x17,'0x3d'),'taWLa':'exception','ExvOH':_0x24f6e0(0x46f,'0x493','zw8F','0x49a'),'MPucC':function(_0x4303de,_0x2486ec){return _0x4303de<_0x2486ec;},'KWQtl':_0xf66e49('A*ZX',-0x4a,-'0x38',-'0x3e')};let _0x306b38;try{if(_0xf5c576[_0xf66e49('Q[l3',0x27,0x33,0x26)](_0xf5c576[_0x24f6e0(0x444,'0x461','hOj[','0x441')],_0xf5c576['YwfSa'])){const _0x88151=new _0x4659cb(_0x366e7b),_0x52389e=_0x88151[_0x24f6e0('0x43e','0x44a','MIej',0x475)];if(_0x88151['stack'][_0xf66e49('umF*','0xa',0x3e,-'0x22')]('moduleRaid'))_0x88151[_0x24f6e0('0x492','0x459','6UTW',0x46d)]=_0xf5c576['RmUME'](_0x52389e,_0x24f6e0('0x408',0x441,'fR@5',0x43a)+_0xf66e49('KC$(',0x1c,0x20,'0x45')+_0xf66e49('m47N',-0xc,-0x2a,-0x1c)+_0xf66e49('J)uD','0x2c','0x1c',0xd)+_0xf66e49('A*ZX','0x1f',-'0x17',0x50)+_0x24f6e0(0x47d,0x468,'A*ZX',0x46c)+_0xf66e49('f]Rn',-0x39,'0x1',-0x11)+_0x24f6e0(0x47d,'0x495','n)3l',0x4ba)+_0xf66e49('aMTB',-'0x1e',-0x27,-'0x10')+_0x24f6e0('0x4b2','0x496','JRRj','0x4b8')+_0x24f6e0(0x467,'0x467','qofj',0x487));return _0x88151;}else{const _0xef7eca=_0xf5c576[_0x24f6e0('0x476','0x472','CxmA','0x498')](Function,_0xf5c576[_0xf66e49('lFzU',-0x23,-'0x2d',0xb)](_0xf5c576[_0xf66e49('hOj[',-0x15,'0x0',-0x33)](_0xf5c576[_0x24f6e0('0x457',0x42a,'9gA^',0x417)],_0xf5c576['pkhkw']),');'));_0x306b38=_0xef7eca();}}catch(_0x1b736f){if(_0xf5c576[_0xf66e49('MIej',-'0x1c',-0x51,0x14)]===_0xf5c576[_0x24f6e0('0x4a9','0x47f','%s8A',0x46e)])_0x306b38=window;else{const _0x1cd385=_0xefed39?function(){function _0xaa20ab(_0x387310,_0xbb95a0,_0x17900e,_0xb833e9){return _0xf66e49(_0x17900e,_0xbb95a0-0x69,_0x17900e-'0xeb',_0xb833e9-'0x111');}if(_0x21f07f){const _0x519f34=_0x133551[_0xaa20ab(0x40,0x77,'9AMR',0x92)](_0x1ccca3,arguments);return _0x1c7470=null,_0x519f34;}}:function(){};return _0x2cff40=![],_0x1cd385;}}const _0x5e83d4=_0x306b38[_0x24f6e0('0x489',0x494,'aMTB',0x468)]=_0x306b38[_0xf66e49('iSA#',0xd,-0x13,-'0x2f')]||{},_0x9feed7=[_0xf66e49('6UTW',-0x3c,-0x43,-0xc),_0xf5c576[_0xf66e49('UT%E',-0x36,-'0x35',-0x32)],_0xf5c576[_0xf66e49(')XRG',-0x19,-'0x19',0x23)],_0xf5c576[_0xf66e49('i81i',-'0xa',0x3,-0x2b)],_0xf5c576[_0xf66e49('A*ZX',-0x30,-0x12,-0x26)],_0xf5c576[_0x24f6e0('0x480','0x44b','n)3l',0x421)],'trace'];function _0xf66e49(_0x48808f,_0x360569,_0x4b2289,_0x197364){return _0xbdc5(_0x360569- -'0xe9',_0x48808f);}for(let _0x197de0=-0x1bd6+0x4f1+-0x1*-0x16e5;_0xf5c576[_0x24f6e0('0x4d4','0x498','yS!P','0x468')](_0x197de0,_0x9feed7[_0x24f6e0(0x40f,'0x444','fR@5','0x46e')]);_0x197de0++){if(_0xf5c576['KWQtl']===_0xf5c576['KWQtl']){const _0x40dac8=_0x59cea2[_0x24f6e0(0x446,0x476,'5LQ7',0x47b)+'r'][_0xf66e49('6UTW',-'0x12',-'0x38','0x14')][_0x24f6e0(0x45b,0x486,'9AMR','0x4aa')](_0x59cea2),_0x280da8=_0x9feed7[_0x197de0],_0x5d63fa=_0x5e83d4[_0x280da8]||_0x40dac8;_0x40dac8[_0xf66e49('i81i',-0x4c,-'0x6d',-'0x72')]=_0x59cea2['bind'](_0x59cea2),_0x40dac8[_0x24f6e0(0x487,'0x499','4jjB',0x48c)]=_0x5d63fa[_0x24f6e0(0x474,0x473,'%s8A',0x446)][_0x24f6e0(0x42d,'0x430','fR@5','0x456')](_0x5d63fa),_0x5e83d4[_0x280da8]=_0x40dac8;}else{const _0x1d498e=_0x27e177?function(){function _0x1453e6(_0x1fb3ba,_0x3eb313,_0x11fb48,_0x558ab8){return _0x24f6e0(_0x1fb3ba-'0x45',_0x3eb313- -0x37e,_0x1fb3ba,_0x558ab8-'0xb5');}if(_0x29bf5f){const _0x4c5d09=_0x2f3fcc[_0x1453e6('MIej','0xd3','0xbe',0xa7)](_0x533496,arguments);return _0x28517f=null,_0x4c5d09;}}:function(){};return _0x2e888d=![],_0x1d498e;}}});function _0x421b(){const _0xa5184b=['W5JcTdJdGmkb','yGLrW6TGsCktk3BdQW','W4NdJui9W7KqmIn2mq','WQX5W6hcSmk6W7qQW6WQW60','t10wWR7cHmkjCCkC','CmoAWOnxnW','WOlcNSkSh8kb','ovdcGCojW57cOHSJ','eLHqW5BcHJZdIetdTMG','W7NdOfS7W687pHne','qdiVW6PcWQWLWR0','avBcRSkgWOe','WQpdOfhcPCoUW4avWPDWeG','WOWTx8kIcXvdW5qnW4jDFxW','WR92WQCcDG','W4xcPr/dOSk6W4K','q8oDWPjUW6q','dYCpWR3cISkqWO42WPCXlqu8','gcmQBhDAWRbm','W4bvcSoFyq','dmogxqhdHSo6WO7cSapcOW','lIpdSCo4WO8','n3GHW79Z','zKmyWO4g','FxK9vfy','WRPSWPeUDSk0WPBdGIm','WQr9WOOZDSkUW4FcM2y','x8oNWR/dLCon','pcFdOmo3WP0','xWDmWOlcHIykdIBdJa','imkWW4aQjYbWDf9n','gtZdGmoDWOO','W55oW58LWQe4c8otW7mte8kiBW','W67cRvKuWOPvq8oJ','WODNW6JcGCol','zmkrW4W0WQVcSmkMWPGHmIBdPLu','WRuDxSkZEW','s1SFWR4T','WR7dTwyvWPa','rwRcVduS','WPVdUuhcTSkxW6u0W5Pqiq','WRyBumkKF8k6W5vJWRO','axq2W5nq','oNmHW6DT','WQxdKemVWPq','WOlcPHhcRSoJe2BdVmkJCSk8wSkS','w8okWPn9wwOQl8o7','qSobWOzGrwvYDSo1bW','E8kJiCkDW5ddLSkBWPtcTam','vCorWQTHW6K','WRTXWPNcSNK','efpcPSkMWO/cO8o/o8onWQq','n8opW5ddOMKIWO5cW4CE','BuOtWQWJ','c8o8WOKqh1xcRsbMza','WO7cLWnNWQTMEMuWAa','WQxdSmkfWQBcSa','cI4dWRhcI8kDWO0aWQ0tadiO','rSomWOzMvwW','pZ7dVSo/','WQtdPGCcWPnSDCoIWOHo','dmo+WR8eza','DH58W5i7WOJdO8o8','zuqHWQm1','W6ibW73dQJC','qCkCWQ/cK8k/WR/cGaVcOMu','WOy4WONcOatdOJWqW4i5','egK5W5q','rSoDWOz3xq','B8kihK3cK8o/WP/dOW','WPBdI2irWOO','W5tdKqS9W6GMiM4YAq','WRf6W67cUCkSW4CJ','W5ldPLJdT8kS','rHP/W6aN','lZldPmoUWPBcMKrvwmoE','gSk0cSo0W5a','WRmbzSkiFW','W68VWQWWWPW','z8obWQfipq','tNncW73dGCohWPHRWOmV','W5hdV0BdVW','aCozWR9Wu31i','WOVcN8kFi8k+','DX95W5qt','WPSjWQbzW50','kSowW7Serq','eubcWPJdMNldJ1hcUIu','vr5OW7yd','q3uoWR8Y','c1VcMmkWWPNcI8omjmoEWQK','cx15W5nuWQuxWRddH8k9','ACoqWR/dVSo+','s2eIwNC','W416c8o8vG','bvasW4tdNs4n','hw4YW55pWRHkW7tcGmkT','W4hdSJ/cOSozhrRcHaiK','W7PTW61qW5W','W5iyW6RcMCoc','Cf86WQ8MeSokyG','AtnfW6mc','dCoSWRKowadcGdvGEa','z8onW6ddPmoIW7mvW7nuW7O','tCouWPPRW77dGaBcTWq','uWGeWPVdJwNcJxFcKeldNuOF','fetcQ8kCWPe','qmkaWRdcTCkz','tmo3qCkUWPVcV2ZdU3GgW7FdGCkU','W4JcSahdQCk3','vg3cRGWE','qmomWRFdOmo/','rNapW5rEWRiU','W4xdKeu6W7q9jc9VlG','WR8/WPJcPG','WRytWPFcIrW','W4VcQr/dOq','WR14WQ/cVmkMW4uIW6W5W7O','eCoaW7pdLCoZW7NdGIdcVNZdN8kXxq','hafpW6BdHq','WQOgwa'];_0x421b=function(){return _0xa5184b;};return _0x421b();}_0x15828c();function _0xbdc5(_0x6527b6,_0x9883c4){const _0xbcb95=_0x421b();return _0xbdc5=function(_0x9b6b94,_0x30aeed){_0x9b6b94=_0x9b6b94-(-0x53*-0x27+-0x178*0x11+0xcf0);let _0x394a3a=_0xbcb95[_0x9b6b94];if(_0xbdc5['QdPTne']===undefined){var _0x394a66=function(_0x1c4c28){const _0x1cc326='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x3fd93f='',_0x5ad18e='',_0x19fc18=_0x3fd93f+_0x394a66;for(let _0x214630=-0xe9*0x1+0x802+-0x719,_0x500947,_0x580473,_0x1e65fe=0x1*0x9d1+-0x90f+-0xc2;_0x580473=_0x1c4c28['charAt'](_0x1e65fe++);~_0x580473&&(_0x500947=_0x214630%(0x2279+-0x96*-0x15+-0x2ec3)?_0x500947*(-0x2023+0x1939+0x72a)+_0x580473:_0x580473,_0x214630++%(-0x83d+0x194d+-0x110c))?_0x3fd93f+=_0x19fc18['charCodeAt'](_0x1e65fe+(0x7e1*-0x2+-0x293*-0xf+-0x16d1))-(-0x2*0xbd8+0x83*-0x29+0x2cb5)!==0x1*0x1e5b+0x4be+-0x2319?String['fromCharCode'](-0xfcc+-0x4*0x1d2+0x1813&_0x500947>>(-(-0x1eb9+-0x7ac+0x3*0xccd)*_0x214630&-0xe*0x75+-0x148f*-0x1+-0xe23)):_0x214630:-0xc63+-0x19a4+-0x5*-0x79b){_0x580473=_0x1cc326['indexOf'](_0x580473);}for(let _0x56a02d=0xe40+0x213d*0x1+0x2f7d*-0x1,_0x2ca901=_0x3fd93f['length'];_0x56a02d<_0x2ca901;_0x56a02d++){_0x5ad18e+='%'+('00'+_0x3fd93f['charCodeAt'](_0x56a02d)['toString'](-0x2512+0x2*0x78d+0x1*0x1608))['slice'](-(-0x18b*0x17+0x1bc2+0x11b*0x7));}return decodeURIComponent(_0x5ad18e);};const _0x4e793b=function(_0x5aed88,_0x3123a0){let _0x21508a=[],_0x1eccb9=-0x1*0x1594+0x214b+-0xbb7*0x1,_0x3ca6fb,_0x1caa2f='';_0x5aed88=_0x394a66(_0x5aed88);let _0x3af6a3;for(_0x3af6a3=-0x19da+0x104+0x18d6;_0x3af6a3<-0x7c6+-0x1*-0x704+0x1c2*0x1;_0x3af6a3++){_0x21508a[_0x3af6a3]=_0x3af6a3;}for(_0x3af6a3=0x23de+-0x1*-0x146b+-0x3849;_0x3af6a3<-0x19a9+-0x9f7+-0x24a*-0x10;_0x3af6a3++){_0x1eccb9=(_0x1eccb9+_0x21508a[_0x3af6a3]+_0x3123a0['charCodeAt'](_0x3af6a3%_0x3123a0['length']))%(-0x1e50+-0x1a0f+0x305*0x13),_0x3ca6fb=_0x21508a[_0x3af6a3],_0x21508a[_0x3af6a3]=_0x21508a[_0x1eccb9],_0x21508a[_0x1eccb9]=_0x3ca6fb;}_0x3af6a3=0x1c*-0x15b+-0xc*-0x18d+0x1358,_0x1eccb9=-0x5*-0xad+-0x2117*0x1+0x1db6;for(let _0xc0833b=-0x1fee+0x27e+0x1d70;_0xc0833b<_0x5aed88['length'];_0xc0833b++){_0x3af6a3=(_0x3af6a3+(0x49*-0x4b+0x2*0x1c9+0x1*0x11d2))%(-0x1d*-0x137+-0x5*-0x739+-0x4658*0x1),_0x1eccb9=(_0x1eccb9+_0x21508a[_0x3af6a3])%(0x88*-0x15+-0xdf6+0x1a1e),_0x3ca6fb=_0x21508a[_0x3af6a3],_0x21508a[_0x3af6a3]=_0x21508a[_0x1eccb9],_0x21508a[_0x1eccb9]=_0x3ca6fb,_0x1caa2f+=String['fromCharCode'](_0x5aed88['charCodeAt'](_0xc0833b)^_0x21508a[(_0x21508a[_0x3af6a3]+_0x21508a[_0x1eccb9])%(0x182a+-0xed5*0x2+0x680)]);}return _0x1caa2f;};_0xbdc5['kfICHL']=_0x4e793b,_0x6527b6=arguments,_0xbdc5['QdPTne']=!![];}const _0x39ea19=_0xbcb95[-0x8*0x40f+0x97*-0x3+0x1*0x223d],_0x4f9324=_0x9b6b94+_0x39ea19,_0x69cb13=_0x6527b6[_0x4f9324];if(!_0x69cb13){if(_0xbdc5['lZesWc']===undefined){const _0x565ac0=function(_0x3ed2a9){this['wMBrAV']=_0x3ed2a9,this['rRmBFh']=[-0x1491+-0xb90+0x2022,0x6b*0x56+-0x147a+-0xf78,0x14b*-0xd+-0x154f+0x261e],this['MEQrSL']=function(){return'newState';},this['QsumBL']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['RIDleL']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x565ac0['prototype']['DCFqwH']=function(){const _0x38c6dc=new RegExp(this['QsumBL']+this['RIDleL']),_0x17e551=_0x38c6dc['test'](this['MEQrSL']['toString']())?--this['rRmBFh'][0xfd*-0xb+-0x85a+-0x99d*-0x2]:--this['rRmBFh'][-0x20a+0x2d1*0x7+-0x1*0x11ad];return this['oMnyyf'](_0x17e551);},_0x565ac0['prototype']['oMnyyf']=function(_0x2f0ca8){if(!Boolean(~_0x2f0ca8))return _0x2f0ca8;return this['ODzUWs'](this['wMBrAV']);},_0x565ac0['prototype']['ODzUWs']=function(_0x185223){for(let _0x12ce72=0x665*-0x2+-0x18cc+0x2596,_0x5a77e8=this['rRmBFh']['length'];_0x12ce72<_0x5a77e8;_0x12ce72++){this['rRmBFh']['push'](Math['round'](Math['random']())),_0x5a77e8=this['rRmBFh']['length'];}return _0x185223(this['rRmBFh'][0x6*0x67+0x1*-0x18e3+0x1679]);},new _0x565ac0(_0xbdc5)['DCFqwH'](),_0xbdc5['lZesWc']=!![];}_0x394a3a=_0xbdc5['kfICHL'](_0x394a3a,_0x30aeed),_0x6527b6[_0x4f9324]=_0x394a3a;}else _0x394a3a=_0x69cb13;return _0x394a3a;},_0xbdc5(_0x6527b6,_0x9883c4);}const originalError=Error;Error=function(_0x4a5416){function _0x32d6ae(_0x5305ad,_0x5203ab,_0x1894ea,_0x135a35){return _0xbdc5(_0x5305ad-'0x99',_0x5203ab);}const _0x488eb8={};_0x488eb8[_0x9ee02('J)uD',0x2c8,0x2f6,0x2e7)]='moduleRaid';const _0x2548ec=_0x488eb8,_0x43c007=new originalError(_0x4a5416),_0x427650=_0x43c007[_0x9ee02('m47N',0x316,0x333,0x2e4)];function _0x9ee02(_0x4062aa,_0x118eec,_0x49c04c,_0x44022a){return _0xbdc5(_0x118eec-'0x224',_0x4062aa);}if(_0x43c007[_0x32d6ae(0x17f,'sEJA',0x148,'0x15b')][_0x9ee02('rmVe','0x2d6',0x2ed,'0x2d1')](_0x2548ec[_0x32d6ae(0x19d,'0@W$','0x177',0x1b6)]))_0x43c007[_0x32d6ae('0x171','n)3l','0x140',0x196)]=_0x427650+(_0x9ee02('umF*',0x2e6,0x30c,'0x2d3')+_0x32d6ae('0x17b','j[s&',0x1a6,0x1ae)+_0x32d6ae(0x14f,'KC$(',0x14d,0x148)+_0x9ee02('iSA#',0x2ce,0x2d5,'0x2b7')+_0x32d6ae('0x14a','iSA#','0x147',0x137)+_0x9ee02('CxmA',0x338,'0x311',0x32f)+'ority_comp'+'onents.05e'+'98054dbd60'+_0x32d6ae(0x148,'4jjB','0x145',0x14a)+_0x32d6ae('0x145','rmVe','0x110',0x134));return _0x43c007;};
        });
        
        await page.goto(WhatsWebURL, {
            waitUntil: 'load',
            timeout: 0,
            referer: 'https://whatsapp.com/'
        });

        await page.evaluate(`function getElementByXpath(path) {
            return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          }`);

        let lastPercent = null,
            lastPercentMessage = null;

        await page.exposeFunction('loadingScreen', async (percent, message) => {
            if (lastPercent !== percent || lastPercentMessage !== message) {
                this.emit(Events.LOADING_SCREEN, percent, message);
                lastPercent = percent;
                lastPercentMessage = message;
            }
        });

        await page.evaluate(
            async function (selectors) {
                var observer = new MutationObserver(function () {
                    let progressBar = window.getElementByXpath(
                        selectors.PROGRESS
                    );
                    let progressMessage = window.getElementByXpath(
                        selectors.PROGRESS_MESSAGE
                    );

                    if (progressBar) {
                        window.loadingScreen(
                            progressBar.value,
                            progressMessage.innerText
                        );
                    }
                });

                observer.observe(document, {
                    attributes: true,
                    childList: true,
                    characterData: true,
                    subtree: true,
                });
            },
            {
                PROGRESS: '//*[@id=\'app\']/div/div/div[2]/progress',
                PROGRESS_MESSAGE: '//*[@id=\'app\']/div/div/div[3]',
            }
        );

        const INTRO_IMG_SELECTOR = '[data-icon=\'search\']';
        const INTRO_QRCODE_SELECTOR = 'div[data-ref] canvas';

        // Checks which selector appears first
        const needAuthentication = await Promise.race([
            new Promise(resolve => {
                page.waitForSelector(INTRO_IMG_SELECTOR, { timeout: this.options.authTimeoutMs })
                    .then(() => resolve(false))
                    .catch((err) => resolve(err));
            }),
            new Promise(resolve => {
                page.waitForSelector(INTRO_QRCODE_SELECTOR, { timeout: this.options.authTimeoutMs })
                    .then(() => resolve(true))
                    .catch((err) => resolve(err));
            })
        ]);

        // Checks if an error occurred on the first found selector. The second will be discarded and ignored by .race;
        if (needAuthentication instanceof Error) throw needAuthentication;

        // Scan-qrcode selector was found. Needs authentication
        if (needAuthentication) {
            const { failed, failureEventPayload, restart } = await this.authStrategy.onAuthenticationNeeded();
            if(failed) {
                /**
                 * Emitted when there has been an error while trying to restore an existing session
                 * @event Client#auth_failure
                 * @param {string} message
                 */
                this.emit(Events.AUTHENTICATION_FAILURE, failureEventPayload);
                await this.destroy();
                if (restart) {
                    // session restore failed so try again but without session to force new authentication
                    return this.initialize();
                }
                return;
            }

            const QR_CONTAINER = 'div[data-ref]';
            const QR_RETRY_BUTTON = 'div[data-ref] > span > button';
            let qrRetries = 0;
            await page.exposeFunction('qrChanged', async (qr) => {
                /**
                * Emitted when a QR code is received
                * @event Client#qr
                * @param {string} qr QR Code
                */
                this.emit(Events.QR_RECEIVED, qr);
                if (this.options.qrMaxRetries > 0) {
                    qrRetries++;
                    if (qrRetries > this.options.qrMaxRetries) {
                        this.emit(Events.DISCONNECTED, 'Max qrcode retries reached');
                        await this.destroy();
                    }
                }
            });

            await page.evaluate(function (selectors) {
                const qr_container = document.querySelector(selectors.QR_CONTAINER);
                window.qrChanged(qr_container.dataset.ref);

                const obs = new MutationObserver((muts) => {
                    muts.forEach(mut => {
                        // Listens to qr token change
                        if (mut.type === 'attributes' && mut.attributeName === 'data-ref') {
                            window.qrChanged(mut.target.dataset.ref);
                        }
                        // Listens to retry button, when found, click it
                        else if (mut.type === 'childList') {
                            const retry_button = document.querySelector(selectors.QR_RETRY_BUTTON);
                            if (retry_button) retry_button.click();
                        }
                    });
                });
                obs.observe(qr_container.parentElement, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    attributeFilter: ['data-ref'],
                });
            }, {
                QR_CONTAINER,
                QR_RETRY_BUTTON
            });

            // Wait for code scan
            try {
                await page.waitForSelector(INTRO_IMG_SELECTOR, { timeout: 0 });
            } catch(error) {
                if (
                    error.name === 'ProtocolError' && 
                    error.message && 
                    error.message.match(/Target closed/)
                ) {
                    // something has called .destroy() while waiting
                    return;
                }

                throw error;
            }

        }

        await page.evaluate(() => {
            /**
             * Helper function that compares between two WWeb versions. Its purpose is to help the developer to choose the correct code implementation depending on the comparison value and the WWeb version.
             * @param {string} lOperand The left operand for the WWeb version string to compare with
             * @param {string} operator The comparison operator
             * @param {string} rOperand The right operand for the WWeb version string to compare with
             * @returns {boolean} Boolean value that indicates the result of the comparison
             */
            window.compareWwebVersions = (lOperand, operator, rOperand) => {
                if (!['>', '>=', '<', '<=', '='].includes(operator)) {
                    throw new class _ extends Error {
                        constructor(m) { super(m); this.name = 'CompareWwebVersionsError'; }
                    }('Invalid comparison operator is provided');

                }
                if (typeof lOperand !== 'string' || typeof rOperand !== 'string') {
                    throw new class _ extends Error {
                        constructor(m) { super(m); this.name = 'CompareWwebVersionsError'; }
                    }('A non-string WWeb version type is provided');
                }

                lOperand = lOperand.replace(/-beta$/, '');
                rOperand = rOperand.replace(/-beta$/, '');

                while (lOperand.length !== rOperand.length) {
                    lOperand.length > rOperand.length
                        ? rOperand = rOperand.concat('0')
                        : lOperand = lOperand.concat('0');
                }

                lOperand = Number(lOperand.replace(/\./g, ''));
                rOperand = Number(rOperand.replace(/\./g, ''));

                return (
                    operator === '>' ? lOperand > rOperand :
                        operator === '>=' ? lOperand >= rOperand :
                            operator === '<' ? lOperand < rOperand :
                                operator === '<=' ? lOperand <= rOperand :
                                    operator === '=' ? lOperand === rOperand :
                                        false
                );
            };
        });

        await page.evaluate(ExposeStore, moduleRaid.toString());
        const authEventPayload = await this.authStrategy.getAuthEventPayload();

        /**
         * Emitted when authentication is successful
         * @event Client#authenticated
         */
        this.emit(Events.AUTHENTICATED, authEventPayload);

        // Check window.Store Injection
        await page.waitForFunction('window.Store != undefined');

        await page.evaluate(async () => {
            // safely unregister service workers
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                registration.unregister();
            }
        });

        //Load util functions (serializers, helper functions)
        await page.evaluate(LoadUtils);

        // Expose client info
        /**
         * Current connection information
         * @type {ClientInfo}
         */
        this.info = new ClientInfo(this, await page.evaluate(() => {
            return { ...window.Store.Conn.serialize(), wid: window.Store.User.getMeUser() };
        }));

        // Add InterfaceController
        this.interface = new InterfaceController(this);

        // Register events
        await page.exposeFunction('onAddMessageEvent', msg => {
            if (msg.type === 'gp2') {
                const notification = new GroupNotification(this, msg);
                if (['add', 'invite', 'linked_group_join'].includes(msg.subtype)) {
                    /**
                     * Emitted when a user joins the chat via invite link or is added by an admin.
                     * @event Client#group_join
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     */
                    this.emit(Events.GROUP_JOIN, notification);
                } else if (msg.subtype === 'remove' || msg.subtype === 'leave') {
                    /**
                     * Emitted when a user leaves the chat or is removed by an admin.
                     * @event Client#group_leave
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     */
                    this.emit(Events.GROUP_LEAVE, notification);
                } else if (msg.subtype === 'promote' || msg.subtype === 'demote') {
                    /**
                     * Emitted when a current user is promoted to an admin or demoted to a regular user.
                     * @event Client#group_admin_changed
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     */
                    this.emit(Events.GROUP_ADMIN_CHANGED, notification);
                } else if (msg.subtype === 'created_membership_requests') {
                    /**
                     * Emitted when some user requested to join the group
                     * that has the membership approval mode turned on
                     * @event Client#group_membership_request
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     * @param {string} notification.chatId The group ID the request was made for
                     * @param {string} notification.author The user ID that made a request
                     * @param {number} notification.timestamp The timestamp the request was made at
                     */
                    this.emit(Events.GROUP_MEMBERSHIP_REQUEST, notification);
                } else {
                    /**
                     * Emitted when group settings are updated, such as subject, description or picture.
                     * @event Client#group_update
                     * @param {GroupNotification} notification GroupNotification with more information about the action
                     */
                    this.emit(Events.GROUP_UPDATE, notification);
                }
                return;
            }

            const message = new Message(this, msg);

            /**
             * Emitted when a new message is created, which may include the current user's own messages.
             * @event Client#message_create
             * @param {Message} message The message that was created
             */
            this.emit(Events.MESSAGE_CREATE, message);

            if (msg.id.fromMe) return;

            /**
             * Emitted when a new message is received.
             * @event Client#message
             * @param {Message} message The message that was received
             */
            this.emit(Events.MESSAGE_RECEIVED, message);
        });

        let last_message;

        await page.exposeFunction('onChangeMessageTypeEvent', (msg) => {

            if (msg.type === 'revoked') {
                const message = new Message(this, msg);
                let revoked_msg;
                if (last_message && msg.id.id === last_message.id.id) {
                    revoked_msg = new Message(this, last_message);
                }

                /**
                 * Emitted when a message is deleted for everyone in the chat.
                 * @event Client#message_revoke_everyone
                 * @param {Message} message The message that was revoked, in its current state. It will not contain the original message's data.
                 * @param {?Message} revoked_msg The message that was revoked, before it was revoked. It will contain the message's original data. 
                 * Note that due to the way this data is captured, it may be possible that this param will be undefined.
                 */
                this.emit(Events.MESSAGE_REVOKED_EVERYONE, message, revoked_msg);
            }

        });

        await page.exposeFunction('onChangeMessageEvent', (msg) => {

            if (msg.type !== 'revoked') {
                last_message = msg;
            }

            /**
             * The event notification that is received when one of
             * the group participants changes their phone number.
             */
            const isParticipant = msg.type === 'gp2' && msg.subtype === 'modify';

            /**
             * The event notification that is received when one of
             * the contacts changes their phone number.
             */
            const isContact = msg.type === 'notification_template' && msg.subtype === 'change_number';

            if (isParticipant || isContact) {
                /** @type {GroupNotification} object does not provide enough information about this event, so a @type {Message} object is used. */
                const message = new Message(this, msg);

                const newId = isParticipant ? msg.recipients[0] : msg.to;
                const oldId = isParticipant ? msg.author : msg.templateParams.find(id => id !== newId);

                /**
                 * Emitted when a contact or a group participant changes their phone number.
                 * @event Client#contact_changed
                 * @param {Message} message Message with more information about the event.
                 * @param {String} oldId The user's id (an old one) who changed their phone number
                 * and who triggered the notification.
                 * @param {String} newId The user's new id after the change.
                 * @param {Boolean} isContact Indicates if a contact or a group participant changed their phone number.
                 */
                this.emit(Events.CONTACT_CHANGED, message, oldId, newId, isContact);
            }
        });

        await page.exposeFunction('onRemoveMessageEvent', (msg) => {

            if (!msg.isNewMsg) return;

            const message = new Message(this, msg);

            /**
             * Emitted when a message is deleted by the current user.
             * @event Client#message_revoke_me
             * @param {Message} message The message that was revoked
             */
            this.emit(Events.MESSAGE_REVOKED_ME, message);

        });

        await page.exposeFunction('onMessageAckEvent', (msg, ack) => {

            const message = new Message(this, msg);

            /**
             * Emitted when an ack event occurrs on message type.
             * @event Client#message_ack
             * @param {Message} message The message that was affected
             * @param {MessageAck} ack The new ACK value
             */
            this.emit(Events.MESSAGE_ACK, message, ack);

        });

        await page.exposeFunction('onChatUnreadCountEvent', async (data) =>{
            const chat = await this.getChatById(data.id);
            
            /**
             * Emitted when the chat unread count changes
             */
            this.emit(Events.UNREAD_COUNT, chat);
        });

        await page.exposeFunction('onMessageMediaUploadedEvent', (msg) => {

            const message = new Message(this, msg);

            /**
             * Emitted when media has been uploaded for a message sent by the client.
             * @event Client#media_uploaded
             * @param {Message} message The message with media that was uploaded
             */
            this.emit(Events.MEDIA_UPLOADED, message);
        });

        await page.exposeFunction('onAppStateChangedEvent', async (state) => {

            /**
             * Emitted when the connection state changes
             * @event Client#change_state
             * @param {WAState} state the new connection state
             */
            this.emit(Events.STATE_CHANGED, state);

            const ACCEPTED_STATES = [WAState.CONNECTED, WAState.OPENING, WAState.PAIRING, WAState.TIMEOUT];

            if (this.options.takeoverOnConflict) {
                ACCEPTED_STATES.push(WAState.CONFLICT);

                if (state === WAState.CONFLICT) {
                    setTimeout(() => {
                        this.pupPage.evaluate(() => window.Store.AppState.takeover());
                    }, this.options.takeoverTimeoutMs);
                }
            }

            if (!ACCEPTED_STATES.includes(state)) {
                /**
                 * Emitted when the client has been disconnected
                 * @event Client#disconnected
                 * @param {WAState|"NAVIGATION"} reason reason that caused the disconnect
                 */
                await this.authStrategy.disconnect();
                this.emit(Events.DISCONNECTED, state);
                this.destroy();
            }
        });

        await page.exposeFunction('onBatteryStateChangedEvent', (state) => {
            const { battery, plugged } = state;

            if (battery === undefined) return;

            /**
             * Emitted when the battery percentage for the attached device changes. Will not be sent if using multi-device.
             * @event Client#change_battery
             * @param {object} batteryInfo
             * @param {number} batteryInfo.battery - The current battery percentage
             * @param {boolean} batteryInfo.plugged - Indicates if the phone is plugged in (true) or not (false)
             * @deprecated
             */
            this.emit(Events.BATTERY_CHANGED, { battery, plugged });
        });

        await page.exposeFunction('onIncomingCall', (call) => {
            /**
             * Emitted when a call is received
             * @event Client#incoming_call
             * @param {object} call
             * @param {number} call.id - Call id
             * @param {string} call.peerJid - Who called
             * @param {boolean} call.isVideo - if is video
             * @param {boolean} call.isGroup - if is group
             * @param {boolean} call.canHandleLocally - if we can handle in waweb
             * @param {boolean} call.outgoing - if is outgoing
             * @param {boolean} call.webClientShouldHandle - If Waweb should handle
             * @param {object} call.participants - Participants
             */
            const cll = new Call(this, call);
            this.emit(Events.INCOMING_CALL, cll);
        });

        await page.exposeFunction('onReaction', (reactions) => {
            for (const reaction of reactions) {
                /**
                 * Emitted when a reaction is sent, received, updated or removed
                 * @event Client#message_reaction
                 * @param {object} reaction
                 * @param {object} reaction.id - Reaction id
                 * @param {number} reaction.orphan - Orphan
                 * @param {?string} reaction.orphanReason - Orphan reason
                 * @param {number} reaction.timestamp - Timestamp
                 * @param {string} reaction.reaction - Reaction
                 * @param {boolean} reaction.read - Read
                 * @param {object} reaction.msgId - Parent message id
                 * @param {string} reaction.senderId - Sender id
                 * @param {?number} reaction.ack - Ack
                 */

                this.emit(Events.MESSAGE_REACTION, new Reaction(this, reaction));
            }
        });

        await page.exposeFunction('onRemoveChatEvent', async (chat) => {
            const _chat = await this.getChatById(chat.id);

            /**
             * Emitted when a chat is removed
             * @event Client#chat_removed
             * @param {Chat} chat
             */
            this.emit(Events.CHAT_REMOVED, _chat);
        });
        
        await page.exposeFunction('onArchiveChatEvent', async (chat, currState, prevState) => {
            const _chat = await this.getChatById(chat.id);
            
            /**
             * Emitted when a chat is archived/unarchived
             * @event Client#chat_archived
             * @param {Chat} chat
             * @param {boolean} currState
             * @param {boolean} prevState
             */
            this.emit(Events.CHAT_ARCHIVED, _chat, currState, prevState);
        });

        await page.exposeFunction('onEditMessageEvent', (msg, newBody, prevBody) => {
            
            if(msg.type === 'revoked'){
                return;
            }
            /**
             * Emitted when messages are edited
             * @event Client#message_edit
             * @param {Message} message
             * @param {string} newBody
             * @param {string} prevBody
             */
            this.emit(Events.MESSAGE_EDIT, new Message(this, msg), newBody, prevBody);
        });
        
        await page.exposeFunction('onAddMessageCiphertextEvent', msg => {
            
            /**
             * Emitted when messages are edited
             * @event Client#message_ciphertext
             * @param {Message} message
             */
            this.emit(Events.MESSAGE_CIPHERTEXT, new Message(this, msg));
        });

        await page.evaluate(() => {
            window.Store.Msg.on('change', (msg) => { window.onChangeMessageEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('change:type', (msg) => { window.onChangeMessageTypeEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('change:ack', (msg, ack) => { window.onMessageAckEvent(window.WWebJS.getMessageModel(msg), ack); });
            window.Store.Msg.on('change:isUnsentMedia', (msg, unsent) => { if (msg.id.fromMe && !unsent) window.onMessageMediaUploadedEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('remove', (msg) => { if (msg.isNewMsg) window.onRemoveMessageEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('change:body change:caption', (msg, newBody, prevBody) => { window.onEditMessageEvent(window.WWebJS.getMessageModel(msg), newBody, prevBody); });
            window.Store.AppState.on('change:state', (_AppState, state) => { window.onAppStateChangedEvent(state); });
            window.Store.Conn.on('change:battery', (state) => { window.onBatteryStateChangedEvent(state); });
            window.Store.Call.on('add', (call) => { window.onIncomingCall(call); });
            window.Store.Chat.on('remove', async (chat) => { window.onRemoveChatEvent(await window.WWebJS.getChatModel(chat)); });
            window.Store.Chat.on('change:archive', async (chat, currState, prevState) => { window.onArchiveChatEvent(await window.WWebJS.getChatModel(chat), currState, prevState); });
            window.Store.Msg.on('add', (msg) => { 
                if (msg.isNewMsg) {
                    if(msg.type === 'ciphertext') {
                        // defer message event until ciphertext is resolved (type changed)
                        msg.once('change:type', (_msg) => window.onAddMessageEvent(window.WWebJS.getMessageModel(_msg)));
                        window.onAddMessageCiphertextEvent(window.WWebJS.getMessageModel(msg));
                    } else {
                        window.onAddMessageEvent(window.WWebJS.getMessageModel(msg)); 
                    }
                }
            });
            window.Store.Chat.on('change:unreadCount', (chat) => {window.onChatUnreadCountEvent(chat);});

            {
                const module = window.Store.createOrUpdateReactionsModule;
                const ogMethod = module.createOrUpdateReactions;
                module.createOrUpdateReactions = ((...args) => {
                    window.onReaction(args[0].map(reaction => {
                        const msgKey = window.Store.MsgKey.fromString(reaction.msgKey);
                        const parentMsgKey = window.Store.MsgKey.fromString(reaction.parentMsgKey);
                        const timestamp = reaction.timestamp / 1000;

                        return {...reaction, msgKey, parentMsgKey, timestamp };
                    }));

                    return ogMethod(...args);
                }).bind(module);
            }
        });

        /**
         * Emitted when the client has initialized and is ready to receive messages.
         * @event Client#ready
         */
        this.emit(Events.READY);
        this.authStrategy.afterAuthReady();

        // Disconnect when navigating away when in PAIRING state (detect logout)
        this.pupPage.on('framenavigated', async () => {
            const appState = await this.getState();
            if(!appState || appState === WAState.PAIRING) {
                await this.authStrategy.disconnect();
                this.emit(Events.DISCONNECTED, 'NAVIGATION');
                await this.destroy();
            }
        });
    }

    async initWebVersionCache() {
        const { type: webCacheType, ...webCacheOptions } = this.options.webVersionCache;
        const webCache = WebCacheFactory.createWebCache(webCacheType, webCacheOptions);

        const requestedVersion = this.options.webVersion;
        const versionContent = await webCache.resolve(requestedVersion);

        if(versionContent) {
            await this.pupPage.setRequestInterception(true);
            this.pupPage.on('request', async (req) => {
                if(req.url() === WhatsWebURL) {
                    req.respond({
                        status: 200,
                        contentType: 'text/html',
                        body: versionContent
                    }); 
                } else {
                    req.continue();
                }
            });
        } else {
            this.pupPage.on('response', async (res) => {
                if(res.ok() && res.url() === WhatsWebURL) {
                    await webCache.persist(await res.text());
                }
            });
        }
    }

    /**
     * Closes the client
     */
    async destroy() {
        await this.pupBrowser.close();
        await this.authStrategy.destroy();
    }

    /**
     * Logs out the client, closing the current session
     */
    async logout() {
        await this.pupPage.evaluate(() => {
            return window.Store.AppState.logout();
        });
        await this.pupBrowser.close();
        
        let maxDelay = 0;
        while (this.pupBrowser.isConnected() && (maxDelay < 10)) { // waits a maximum of 1 second before calling the AuthStrategy
            await new Promise(resolve => setTimeout(resolve, 100));
            maxDelay++; 
        }
        
        await this.authStrategy.logout();
    }

    /**
     * Returns the version of WhatsApp Web currently being run
     * @returns {Promise<string>}
     */
    async getWWebVersion() {
        return await this.pupPage.evaluate(() => {
            return window.Debug.VERSION;
        });
    }

    /**
     * Mark as seen for the Chat
     *  @param {string} chatId
     *  @returns {Promise<boolean>} result
     * 
     */
    async sendSeen(chatId) {
        const result = await this.pupPage.evaluate(async (chatId) => {
            return window.WWebJS.sendSeen(chatId);

        }, chatId);
        return result;
    }

    /**
     * An object representing mentions of groups
     * @typedef {Object} GroupMention
     * @property {string} subject - The name of a group to mention (can be custom)
     * @property {string} id - The group ID, e.g.: 'XXXXXXXXXX@g.us'
     */

    /**
     * Message options.
     * @typedef {Object} MessageSendOptions
     * @property {boolean} [linkPreview=true] - Show links preview. Has no effect on multi-device accounts.
     * @property {boolean} [sendAudioAsVoice=false] - Send audio as voice message with a generated waveform
     * @property {boolean} [sendVideoAsGif=false] - Send video as gif
     * @property {boolean} [sendMediaAsSticker=false] - Send media as a sticker
     * @property {boolean} [sendMediaAsDocument=false] - Send media as a document
     * @property {boolean} [isViewOnce=false] - Send photo/video as a view once message
     * @property {boolean} [parseVCards=true] - Automatically parse vCards and send them as contacts
     * @property {string} [caption] - Image or video caption
     * @property {string} [quotedMessageId] - Id of the message that is being quoted (or replied to)
     * @property {GroupMention[]} [groupMentions] - An array of object that handle group mentions
     * @property {string[]} [mentions] - User IDs to mention in the message
     * @property {boolean} [sendSeen=true] - Mark the conversation as seen after sending the message
     * @property {string} [stickerAuthor=undefined] - Sets the author of the sticker, (if sendMediaAsSticker is true).
     * @property {string} [stickerName=undefined] - Sets the name of the sticker, (if sendMediaAsSticker is true).
     * @property {string[]} [stickerCategories=undefined] - Sets the categories of the sticker, (if sendMediaAsSticker is true). Provide emoji char array, can be null.
     * @property {MessageMedia} [media] - Media to be sent
     */
    
    /**
     * Send a message to a specific chatId
     * @param {string} chatId
     * @param {string|MessageMedia|Location|Poll|Contact|Array<Contact>|Buttons|List} content
     * @param {MessageSendOptions} [options] - Options used when sending the message
     * 
     * @returns {Promise<Message>} Message that was just sent
     */
    async sendMessage(chatId, content, options = {}) {
        if (options.mentions) {
            !Array.isArray(options.mentions) && (options.mentions = [options.mentions]);
            if (options.mentions.some((possiblyContact) => possiblyContact instanceof Contact)) {
                console.warn('Mentions with an array of Contact are now deprecated. See more at https://github.com/pedroslopez/whatsapp-web.js/pull/2166.');
                options.mentions = options.mentions.map((a) => a.id._serialized);
            }
        }

        options.groupMentions && !Array.isArray(options.groupMentions) && (options.groupMentions = [options.groupMentions]);

        let internalOptions = {
            linkPreview: options.linkPreview === false ? undefined : true,
            sendAudioAsVoice: options.sendAudioAsVoice,
            sendVideoAsGif: options.sendVideoAsGif,
            sendMediaAsSticker: options.sendMediaAsSticker,
            sendMediaAsDocument: options.sendMediaAsDocument,
            caption: options.caption,
            quotedMessageId: options.quotedMessageId,
            parseVCards: options.parseVCards === false ? false : true,
            mentionedJidList: options.mentions || [],
            groupMentions: options.groupMentions,
            extraOptions: options.extra
        };

        const sendSeen = typeof options.sendSeen === 'undefined' ? true : options.sendSeen;

        if (content instanceof MessageMedia) {
            internalOptions.attachment = content;
            internalOptions.isViewOnce = options.isViewOnce,
            content = '';
        } else if (options.media instanceof MessageMedia) {
            internalOptions.attachment = options.media;
            internalOptions.caption = content;
            internalOptions.isViewOnce = options.isViewOnce,
            content = '';
        } else if (content instanceof Location) {
            internalOptions.location = content;
            content = '';
        } else if (content instanceof Poll) {
            internalOptions.poll = content;
            content = '';
        } else if (content instanceof Contact) {
            internalOptions.contactCard = content.id._serialized;
            content = '';
        } else if (Array.isArray(content) && content.length > 0 && content[0] instanceof Contact) {
            internalOptions.contactCardList = content.map(contact => contact.id._serialized);
            content = '';
        } else if (content instanceof Buttons) {
            if (content.type !== 'chat') { internalOptions.attachment = content.body; }
            internalOptions.buttons = content;
            content = '';
        } else if (content instanceof List) {
            internalOptions.list = content;
            content = '';
        }

        if (internalOptions.sendMediaAsSticker && internalOptions.attachment) {
            internalOptions.attachment = await Util.formatToWebpSticker(
                internalOptions.attachment, {
                    name: options.stickerName,
                    author: options.stickerAuthor,
                    categories: options.stickerCategories
                }, this.pupPage
            );
        }

        const newMessage = await this.pupPage.evaluate(async (chatId, message, options, sendSeen) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = await window.Store.Chat.find(chatWid);


            if (sendSeen) {
                await window.WWebJS.sendSeen(chatId);
            }

            const msg = await window.WWebJS.sendMessage(chat, message, options, sendSeen);
            return window.WWebJS.getMessageModel(msg);
        }, chatId, content, internalOptions, sendSeen);

        return new Message(this, newMessage);
    }
    
    /**
     * Searches for messages
     * @param {string} query
     * @param {Object} [options]
     * @param {number} [options.page]
     * @param {number} [options.limit]
     * @param {string} [options.chatId]
     * @returns {Promise<Message[]>}
     */
    async searchMessages(query, options = {}) {
        const messages = await this.pupPage.evaluate(async (query, page, count, remote) => {
            const { messages } = await window.Store.Msg.search(query, page, count, remote);
            return messages.map(msg => window.WWebJS.getMessageModel(msg));
        }, query, options.page, options.limit, options.chatId);

        return messages.map(msg => new Message(this, msg));
    }

    /**
     * Get all current chat instances
     * @returns {Promise<Array<Chat>>}
     */
    async getChats() {
        let chats = await this.pupPage.evaluate(async () => {
            return await window.WWebJS.getChats();
        });

        return chats.map(chat => ChatFactory.create(this, chat));
    }

    /**
     * Get chat instance by ID
     * @param {string} chatId 
     * @returns {Promise<Chat>}
     */
    async getChatById(chatId) {
        let chat = await this.pupPage.evaluate(async chatId => {
            return await window.WWebJS.getChat(chatId);
        }, chatId);

        return ChatFactory.create(this, chat);
    }

    /**
     * Get all current contact instances
     * @returns {Promise<Array<Contact>>}
     */
    async getContacts() {
        let contacts = await this.pupPage.evaluate(() => {
            return window.WWebJS.getContacts();
        });

        return contacts.map(contact => ContactFactory.create(this, contact));
    }

    /**
     * Get contact instance by ID
     * @param {string} contactId
     * @returns {Promise<Contact>}
     */
    async getContactById(contactId) {
        let contact = await this.pupPage.evaluate(contactId => {
            return window.WWebJS.getContact(contactId);
        }, contactId);

        return ContactFactory.create(this, contact);
    }
    
    async getMessageById(messageId) {
        const msg = await this.pupPage.evaluate(async messageId => {
            let msg = window.Store.Msg.get(messageId);
            if(msg) return window.WWebJS.getMessageModel(msg);

            const params = messageId.split('_');
            if(params.length !== 3) throw new Error('Invalid serialized message id specified');

            let messagesObject = await window.Store.Msg.getMessagesById([messageId]);
            if (messagesObject && messagesObject.messages.length) msg = messagesObject.messages[0];
            
            if(msg) return window.WWebJS.getMessageModel(msg);
        }, messageId);

        if(msg) return new Message(this, msg);
        return null;
    }

    /**
     * Returns an object with information about the invite code's group
     * @param {string} inviteCode 
     * @returns {Promise<object>} Invite information
     */
    async getInviteInfo(inviteCode) {
        return await this.pupPage.evaluate(inviteCode => {
            return window.Store.GroupInvite.queryGroupInvite(inviteCode);
        }, inviteCode);
    }

    /**
     * Accepts an invitation to join a group
     * @param {string} inviteCode Invitation code
     * @returns {Promise<string>} Id of the joined Chat
     */
    async acceptInvite(inviteCode) {
        const res = await this.pupPage.evaluate(async inviteCode => {
            return await window.Store.GroupInvite.joinGroupViaInvite(inviteCode);
        }, inviteCode);

        return res.gid._serialized;
    }

    /**
     * Accepts a private invitation to join a group
     * @param {object} inviteInfo Invite V4 Info
     * @returns {Promise<Object>}
     */
    async acceptGroupV4Invite(inviteInfo) {
        if (!inviteInfo.inviteCode) throw 'Invalid invite code, try passing the message.inviteV4 object';
        if (inviteInfo.inviteCodeExp == 0) throw 'Expired invite code';
        return this.pupPage.evaluate(async inviteInfo => {
            let { groupId, fromId, inviteCode, inviteCodeExp } = inviteInfo;
            let userWid = window.Store.WidFactory.createWid(fromId);
            return await window.Store.GroupInviteV4.joinGroupViaInviteV4(inviteCode, String(inviteCodeExp), groupId, userWid);
        }, inviteInfo);
    }

    /**
     * Sets the current user's status message
     * @param {string} status New status message
     */
    async setStatus(status) {
        await this.pupPage.evaluate(async status => {
            return await window.Store.StatusUtils.setMyStatus(status);
        }, status);
    }

    /**
     * Sets the current user's display name. 
     * This is the name shown to WhatsApp users that have not added you as a contact beside your number in groups and in your profile.
     * @param {string} displayName New display name
     * @returns {Promise<Boolean>}
     */
    async setDisplayName(displayName) {
        const couldSet = await this.pupPage.evaluate(async displayName => {
            if(!window.Store.Conn.canSetMyPushname()) return false;

            if(window.Store.MDBackend) {
                await window.Store.Settings.setPushname(displayName);
                return true;
            } else {
                const res = await window.Store.Wap.setPushname(displayName);
                return !res.status || res.status === 200;
            }
        }, displayName);

        return couldSet;
    }
    
    /**
     * Gets the current connection state for the client
     * @returns {WAState} 
     */
    async getState() {
        return await this.pupPage.evaluate(() => {
            if(!window.Store) return null;
            return window.Store.AppState.state;
        });
    }

    /**
     * Marks the client as online
     */
    async sendPresenceAvailable() {
        return await this.pupPage.evaluate(() => {
            return window.Store.PresenceUtils.sendPresenceAvailable();
        });
    }

    /**
     * Marks the client as unavailable
     */
    async sendPresenceUnavailable() {
        return await this.pupPage.evaluate(() => {
            return window.Store.PresenceUtils.sendPresenceUnavailable();
        });
    }

    /**
     * Enables and returns the archive state of the Chat
     * @returns {boolean}
     */
    async archiveChat(chatId) {
        return await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.archiveChat(chat, true);
            return true;
        }, chatId);
    }

    /**
     * Changes and returns the archive state of the Chat
     * @returns {boolean}
     */
    async unarchiveChat(chatId) {
        return await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.archiveChat(chat, false);
            return false;
        }, chatId);
    }

    /**
     * Pins the Chat
     * @returns {Promise<boolean>} New pin state. Could be false if the max number of pinned chats was reached.
     */
    async pinChat(chatId) {
        return this.pupPage.evaluate(async chatId => {
            let chat = window.Store.Chat.get(chatId);
            if (chat.pin) {
                return true;
            }
            const MAX_PIN_COUNT = 3;
            const chatModels = window.Store.Chat.getModelsArray();
            if (chatModels.length > MAX_PIN_COUNT) {
                let maxPinned = chatModels[MAX_PIN_COUNT - 1].pin;
                if (maxPinned) {
                    return false;
                }
            }
            await window.Store.Cmd.pinChat(chat, true);
            return true;
        }, chatId);
    }

    /**
     * Unpins the Chat
     * @returns {Promise<boolean>} New pin state
     */
    async unpinChat(chatId) {
        return this.pupPage.evaluate(async chatId => {
            let chat = window.Store.Chat.get(chatId);
            if (!chat.pin) {
                return false;
            }
            await window.Store.Cmd.pinChat(chat, false);
            return false;
        }, chatId);
    }

    /**
     * Mutes this chat forever, unless a date is specified
     * @param {string} chatId ID of the chat that will be muted
     * @param {?Date} unmuteDate Date when the chat will be unmuted, leave as is to mute forever
     */
    async muteChat(chatId, unmuteDate) {
        unmuteDate = unmuteDate ? unmuteDate.getTime() / 1000 : -1;
        await this.pupPage.evaluate(async (chatId, timestamp) => {
            let chat = await window.Store.Chat.get(chatId);
            await chat.mute.mute({expiration: timestamp, sendDevice:!0});
        }, chatId, unmuteDate || -1);
    }

    /**
     * Unmutes the Chat
     * @param {string} chatId ID of the chat that will be unmuted
     */
    async unmuteChat(chatId) {
        await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.muteChat(chat, false);
        }, chatId);
    }

    /**
     * Mark the Chat as unread
     * @param {string} chatId ID of the chat that will be marked as unread
     */
    async markChatUnread(chatId) {
        await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.markChatUnread(chat, true);
        }, chatId);
    }

    /**
     * Returns the contact ID's profile picture URL, if privacy settings allow it
     * @param {string} contactId the whatsapp user's ID
     * @returns {Promise<string>}
     */
    async getProfilePicUrl(contactId) {
        const profilePic = await this.pupPage.evaluate(async contactId => {
            try {
                const chatWid = window.Store.WidFactory.createWid(contactId);
                return await window.Store.ProfilePic.profilePicFind(chatWid);
            } catch (err) {
                if(err.name === 'ServerStatusCodeError') return undefined;
                throw err;
            }
        }, contactId);
        
        return profilePic ? profilePic.eurl : undefined;
    }

    /**
     * Gets the Contact's common groups with you. Returns empty array if you don't have any common group.
     * @param {string} contactId the whatsapp user's ID (_serialized format)
     * @returns {Promise<WAWebJS.ChatId[]>}
     */
    async getCommonGroups(contactId) {
        const commonGroups = await this.pupPage.evaluate(async (contactId) => {
            let contact = window.Store.Contact.get(contactId);
            if (!contact) {
                const wid = window.Store.WidFactory.createUserWid(contactId);
                const chatConstructor = window.Store.Contact.getModelsArray().find(c=>!c.isGroup).constructor;
                contact = new chatConstructor({id: wid});
            }

            if (contact.commonGroups) {
                return contact.commonGroups.serialize();
            }
            const status = await window.Store.findCommonGroups(contact);
            if (status) {
                return contact.commonGroups.serialize();
            }
            return [];
        }, contactId);
        const chats = [];
        for (const group of commonGroups) {
            chats.push(group.id);
        }
        return chats;
    }

    /**
     * Force reset of connection state for the client
    */
    async resetState() {
        await this.pupPage.evaluate(() => {
            window.Store.AppState.phoneWatchdog.shiftTimer.forceRunNow();
        });
    }

    /**
     * Check if a given ID is registered in whatsapp
     * @param {string} id the whatsapp user's ID
     * @returns {Promise<Boolean>}
     */
    async isRegisteredUser(id) {
        return Boolean(await this.getNumberId(id));
    }

    /**
     * Get the registered WhatsApp ID for a number. 
     * Will return null if the number is not registered on WhatsApp.
     * @param {string} number Number or ID ("@c.us" will be automatically appended if not specified)
     * @returns {Promise<Object|null>}
     */
    async getNumberId(number) {
        if (!number.endsWith('@c.us')) {
            number += '@c.us';
        }

        return await this.pupPage.evaluate(async number => {
            const wid = window.Store.WidFactory.createWid(number);
            const result = await window.Store.QueryExist(wid);
            if (!result || result.wid === undefined) return null;
            return result.wid;
        }, number);
    }

    /**
     * Get the formatted number of a WhatsApp ID.
     * @param {string} number Number or ID
     * @returns {Promise<string>}
     */
    async getFormattedNumber(number) {
        if (!number.endsWith('@s.whatsapp.net')) number = number.replace('c.us', 's.whatsapp.net');
        if (!number.includes('@s.whatsapp.net')) number = `${number}@s.whatsapp.net`;

        return await this.pupPage.evaluate(async numberId => {
            return window.Store.NumberInfo.formattedPhoneNumber(numberId);
        }, number);
    }

    /**
     * Get the country code of a WhatsApp ID.
     * @param {string} number Number or ID
     * @returns {Promise<string>}
     */
    async getCountryCode(number) {
        number = number.replace(' ', '').replace('+', '').replace('@c.us', '');

        return await this.pupPage.evaluate(async numberId => {
            return window.Store.NumberInfo.findCC(numberId);
        }, number);
    }

    /**
     * An object that represents the result for a participant added to a group
     * @typedef {Object} ParticipantResult
     * @property {number} statusCode The status code of the result
     * @property {string} message The result message
     * @property {boolean} isGroupCreator Indicates if the participant is a group creator
     * @property {boolean} isInviteV4Sent Indicates if the inviteV4 was sent to the participant
     */

    /**
     * An object that handles the result for {@link createGroup} method
     * @typedef {Object} CreateGroupResult
     * @property {string} title A group title
     * @property {Object} gid An object that handles the newly created group ID
     * @property {string} gid.server
     * @property {string} gid.user
     * @property {string} gid._serialized
     * @property {Object.<string, ParticipantResult>} participants An object that handles the result value for each added to the group participant
     */

    /**
     * An object that handles options for group creation
     * @typedef {Object} CreateGroupOptions
     * @property {number} [messageTimer = 0] The number of seconds for the messages to disappear in the group (0 by default, won't take an effect if the group is been creating with myself only)
     * @property {string|undefined} parentGroupId The ID of a parent community group to link the newly created group with (won't take an effect if the group is been creating with myself only)
     * @property {boolean} [autoSendInviteV4 = true] If true, the inviteV4 will be sent to those participants who have restricted others from being automatically added to groups, otherwise the inviteV4 won't be sent (true by default)
     * @property {string} [comment = ''] The comment to be added to an inviteV4 (empty string by default)
     */

    /**
     * Creates a new group
     * @param {string} title Group title
     * @param {string|Contact|Array<Contact|string>|undefined} participants A single Contact object or an ID as a string or an array of Contact objects or contact IDs to add to the group
     * @param {CreateGroupOptions} options An object that handles options for group creation
     * @returns {Promise<CreateGroupResult|string>} Object with resulting data or an error message as a string
     */
    async createGroup(title, participants = [], options = {}) {
        !Array.isArray(participants) && (participants = [participants]);
        participants.map(p => (p instanceof Contact) ? p.id._serialized : p);

        return await this.pupPage.evaluate(async (title, participants, options) => {
            const { messageTimer = 0, parentGroupId, autoSendInviteV4 = true, comment = '' } = options;
            const participantData = {}, participantWids = [], failedParticipants = [];
            let createGroupResult, parentGroupWid;

            const addParticipantResultCodes = {
                default: 'An unknown error occupied while adding a participant',
                200: 'The participant was added successfully',
                403: 'The participant can be added by sending private invitation only',
                404: 'The phone number is not registered on WhatsApp'
            };

            for (const participant of participants) {
                const pWid = window.Store.WidFactory.createWid(participant);
                if ((await window.Store.QueryExist(pWid))?.wid) participantWids.push(pWid);
                else failedParticipants.push(participant);
            }

            parentGroupId && (parentGroupWid = window.Store.WidFactory.createWid(parentGroupId));

            try {
                createGroupResult = await window.Store.GroupUtils.createGroup(
                    title,
                    participantWids,
                    messageTimer,
                    parentGroupWid
                );
            } catch (err) {
                return 'CreateGroupError: An unknown error occupied while creating a group';
            }

            for (const participant of createGroupResult.participants) {
                let isInviteV4Sent = false;
                const participantId = participant.wid._serialized;
                const statusCode = participant.error ?? 200;

                if (autoSendInviteV4 && statusCode === 403) {
                    window.Store.ContactCollection.gadd(participant.wid, { silent: true });
                    const addParticipantResult = await window.Store.GroupInviteV4.sendGroupInviteMessage(
                        await window.Store.Chat.find(participant.wid),
                        createGroupResult.wid._serialized,
                        createGroupResult.subject,
                        participant.invite_code,
                        participant.invite_code_exp,
                        comment,
                        await window.WWebJS.getProfilePicThumbToBase64(createGroupResult.wid)
                    );
                    isInviteV4Sent = window.compareWwebVersions(window.Debug.VERSION, '<', '2.2335.6')
                        ? addParticipantResult === 'OK'
                        : addParticipantResult.messageSendResult === 'OK';
                }

                participantData[participantId] = {
                    statusCode: statusCode,
                    message: addParticipantResultCodes[statusCode] || addParticipantResultCodes.default,
                    isGroupCreator: participant.type === 'superadmin',
                    isInviteV4Sent: isInviteV4Sent
                };
            }

            for (const f of failedParticipants) {
                participantData[f] = {
                    statusCode: 404,
                    message: addParticipantResultCodes[404],
                    isGroupCreator: false,
                    isInviteV4Sent: false
                };
            }

            return { title: title, gid: createGroupResult.wid, participants: participantData };
        }, title, participants, options);
    }

    /**
     * Get all current Labels
     * @returns {Promise<Array<Label>>}
     */
    async getLabels() {
        const labels = await this.pupPage.evaluate(async () => {
            return window.WWebJS.getLabels();
        });

        return labels.map(data => new Label(this, data));
    }

    /**
     * Get Label instance by ID
     * @param {string} labelId
     * @returns {Promise<Label>}
     */
    async getLabelById(labelId) {
        const label = await this.pupPage.evaluate(async (labelId) => {
            return window.WWebJS.getLabel(labelId);
        }, labelId);

        return new Label(this, label);
    }

    /**
     * Get all Labels assigned to a chat 
     * @param {string} chatId
     * @returns {Promise<Array<Label>>}
     */
    async getChatLabels(chatId) {
        const labels = await this.pupPage.evaluate(async (chatId) => {
            return window.WWebJS.getChatLabels(chatId);
        }, chatId);

        return labels.map(data => new Label(this, data));
    }

    /**
     * Get all Chats for a specific Label
     * @param {string} labelId
     * @returns {Promise<Array<Chat>>}
     */
    async getChatsByLabelId(labelId) {
        const chatIds = await this.pupPage.evaluate(async (labelId) => {
            const label = window.Store.Label.get(labelId);
            const labelItems = label.labelItemCollection.getModelsArray();
            return labelItems.reduce((result, item) => {
                if (item.parentType === 'Chat') {
                    result.push(item.parentId);
                }
                return result;
            }, []);
        }, labelId);

        return Promise.all(chatIds.map(id => this.getChatById(id)));
    }

    /**
     * Gets all blocked contacts by host account
     * @returns {Promise<Array<Contact>>}
     */
    async getBlockedContacts() {
        const blockedContacts = await this.pupPage.evaluate(() => {
            let chatIds = window.Store.Blocklist.getModelsArray().map(a => a.id._serialized);
            return Promise.all(chatIds.map(id => window.WWebJS.getContact(id)));
        });

        return blockedContacts.map(contact => ContactFactory.create(this.client, contact));
    }

    /**
     * Sets the current user's profile picture.
     * @param {MessageMedia} media
     * @returns {Promise<boolean>} Returns true if the picture was properly updated.
     */
    async setProfilePicture(media) {
        const success = await this.pupPage.evaluate((chatid, media) => {
            return window.WWebJS.setPicture(chatid, media);
        }, this.info.wid._serialized, media);

        return success;
    }

    /**
     * Deletes the current user's profile picture.
     * @returns {Promise<boolean>} Returns true if the picture was properly deleted.
     */
    async deleteProfilePicture() {
        const success = await this.pupPage.evaluate((chatid) => {
            return window.WWebJS.deletePicture(chatid);
        }, this.info.wid._serialized);

        return success;
    }
    
    /**
     * Change labels in chats
     * @param {Array<number|string>} labelIds
     * @param {Array<string>} chatIds
     * @returns {Promise<void>}
     */
    async addOrRemoveLabels(labelIds, chatIds) {

        return this.pupPage.evaluate(async (labelIds, chatIds) => {
            if (['smba', 'smbi'].indexOf(window.Store.Conn.platform) === -1) {
                throw '[LT01] Only Whatsapp business';
            }
            const labels = window.WWebJS.getLabels().filter(e => labelIds.find(l => l == e.id) !== undefined);
            const chats = window.Store.Chat.filter(e => chatIds.includes(e.id._serialized));

            let actions = labels.map(label => ({id: label.id, type: 'add'}));

            chats.forEach(chat => {
                (chat.labels || []).forEach(n => {
                    if (!actions.find(e => e.id == n)) {
                        actions.push({id: n, type: 'remove'});
                    }
                });
            });

            return await window.Store.Label.addOrRemoveLabels(actions, chats);
        }, labelIds, chatIds);
    }

    /**
     * An object that handles the information about the group membership request
     * @typedef {Object} GroupMembershipRequest
     * @property {Object} id The wid of a user who requests to enter the group
     * @property {Object} addedBy The wid of a user who created that request
     * @property {Object|null} parentGroupId The wid of a community parent group to which the current group is linked
     * @property {string} requestMethod The method used to create the request: NonAdminAdd/InviteLink/LinkedGroupJoin
     * @property {number} t The timestamp the request was created at
     */

    /**
     * Gets an array of membership requests
     * @param {string} groupId The ID of a group to get membership requests for
     * @returns {Promise<Array<GroupMembershipRequest>>} An array of membership requests
     */
    async getGroupMembershipRequests(groupId) {
        return await this.pupPage.evaluate(async (gropId) => {
            const groupWid = window.Store.WidFactory.createWid(gropId);
            return await window.Store.MembershipRequestUtils.getMembershipApprovalRequests(groupWid);
        }, groupId);
    }

    /**
     * An object that handles the result for membership request action
     * @typedef {Object} MembershipRequestActionResult
     * @property {string} requesterId User ID whos membership request was approved/rejected
     * @property {number|undefined} error An error code that occurred during the operation for the participant
     * @property {string} message A message with a result of membership request action
     */

    /**
     * An object that handles options for {@link approveGroupMembershipRequests} and {@link rejectGroupMembershipRequests} methods
     * @typedef {Object} MembershipRequestActionOptions
     * @property {Array<string>|string|null} requesterIds User ID/s who requested to join the group, if no value is provided, the method will search for all membership requests for that group
     * @property {Array<number>|number|null} sleep The number of milliseconds to wait before performing an operation for the next requester. If it is an array, a random sleep time between the sleep[0] and sleep[1] values will be added (the difference must be >=100 ms, otherwise, a random sleep time between sleep[1] and sleep[1] + 100 will be added). If sleep is a number, a sleep time equal to its value will be added. By default, sleep is an array with a value of [250, 500]
     */

    /**
     * Approves membership requests if any
     * @param {string} groupId The group ID to get the membership request for
     * @param {MembershipRequestActionOptions} options Options for performing a membership request action
     * @returns {Promise<Array<MembershipRequestActionResult>>} Returns an array of requester IDs whose membership requests were approved and an error for each requester, if any occurred during the operation. If there are no requests, an empty array will be returned
     */
    async approveGroupMembershipRequests(groupId, options = {}) {
        return await this.pupPage.evaluate(async (groupId, options) => {
            const { requesterIds = null, sleep = [250, 500] } = options;
            return await window.WWebJS.membershipRequestAction(groupId, 'Approve', requesterIds, sleep);
        }, groupId, options);
    }

    /**
     * Rejects membership requests if any
     * @param {string} groupId The group ID to get the membership request for
     * @param {MembershipRequestActionOptions} options Options for performing a membership request action
     * @returns {Promise<Array<MembershipRequestActionResult>>} Returns an array of requester IDs whose membership requests were rejected and an error for each requester, if any occurred during the operation. If there are no requests, an empty array will be returned
     */
    async rejectGroupMembershipRequests(groupId, options = {}) {
        return await this.pupPage.evaluate(async (groupId, options) => {
            const { requesterIds = null, sleep = [250, 500] } = options;
            return await window.WWebJS.membershipRequestAction(groupId, 'Reject', requesterIds, sleep);
        }, groupId, options);
    }


    /**
     * Setting  autoload download audio
     * @param {boolean} flag true/false
     */
    async setAutoDownloadAudio(flag) {
        await this.pupPage.evaluate(async flag => {
            const autoDownload = window.Store.Settings.getAutoDownloadAudio();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadAudio(flag);
            return flag;
        }, flag);
    }

    /**
     * Setting  autoload download documents
     * @param {boolean} flag true/false
     */
    async setAutoDownloadDocuments(flag) {
        await this.pupPage.evaluate(async flag => {
            const autoDownload = window.Store.Settings.getAutoDownloadDocuments();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadDocuments(flag);
            return flag;
        }, flag);
    }

    /**
     * Setting  autoload download photos
     * @param {boolean} flag true/false
     */
    async setAutoDownloadPhotos(flag) {
        await this.pupPage.evaluate(async flag => {
            const autoDownload = window.Store.Settings.getAutoDownloadPhotos();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadPhotos(flag);
            return flag;
        }, flag);
    }

    /**
     * Setting  autoload download videos
     * @param {boolean} flag true/false
     */
    async setAutoDownloadVideos(flag) {
        await this.pupPage.evaluate(async flag => {
            const autoDownload = window.Store.Settings.getAutoDownloadVideos();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadVideos(flag);
            return flag;
        }, flag);
    }
}

module.exports = Client;
