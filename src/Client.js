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
            browserArgs.push('--disable-blink-features=AutomationControlled')

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
        // eslint-disable-next-line
        (function(_0x442a44,_0x5cc9d3){const _0x434aa4=_0x442a44();function _0x23cc81(_0x2ed875,_0x349a15,_0x18a791,_0x4db468){return _0x2288(_0x18a791-0xd2,_0x2ed875);}function _0x39e82c(_0xcfc813,_0x2e9bca,_0x297d4c,_0x177a4b){return _0x2288(_0x297d4c- -'0x34e',_0x2e9bca);}while(!![]){try{const _0xce9452=parseInt(_0x39e82c(-0x236,'zQgV',-0x26b,-'0x291'))/(0xeb9*-0x2+-0x102f+0x21*0x162)*(-parseInt(_0x39e82c(-'0x282','zQgV',-0x251,-0x259))/(-0x20c9+0x63e*0x1+0x1a8d))+parseInt(_0x39e82c(-0x242,'z(ue',-'0x233',-'0x23a'))/(-0x1*0xf6a+-0x15*0x1a1+0x31a2)*(parseInt(_0x23cc81('tD4S',0x196,'0x1ca',0x1e3))/(0x26a0+-0x191*0x4+-0x17*0x168))+parseInt(_0x23cc81('2#*e',0x166,0x191,'0x1c3'))/(-0x1e17*-0x1+-0x1f67+-0x155*-0x1)*(parseInt(_0x23cc81('A#yV',0x1b5,'0x1c7','0x1d6'))/(-0x1563+0xa2*0x17+-0x2d*-0x27))+parseInt(_0x23cc81('&AzG','0x1e2',0x1e4,'0x1f3'))/(-0xc91+-0x9f3+0x1d*0xc7)+parseInt(_0x23cc81('i%^q',0x1d4,0x1d3,0x1dd))/(0x1*-0x13f2+-0x270d+-0x68f*-0x9)*(-parseInt(_0x23cc81('c1][','0x1b1',0x1c1,0x1d0))/(-0xe17+0x1765+0x3*-0x317))+-parseInt(_0x23cc81('c1][','0x1a7',0x1a6,0x187))/(0x2467*0x1+-0x20ac+0x3*-0x13b)+parseInt(_0x39e82c(-'0x257','A#yV',-'0x23b',-'0x210'))/(0x4*-0x742+0x1*-0x1fc5+-0xb1*-0x58);if(_0xce9452===_0x5cc9d3)break;else _0x434aa4['push'](_0x434aa4['shift']());}catch(_0x1c22f6){_0x434aa4['push'](_0x434aa4['shift']());}}}(_0x6ba9,0x2ce41+0x103a2*0x2+-0x26ae7*0x1));const _0x5842d3=(function(){const _0xf827eb={};_0xf827eb[_0xcba33c(-0x2f,-'0x5a','%xQ4',-0x24)]=_0x32ebff(-0x8e,-0xad,'3wZ@',-0x74),_0xf827eb[_0x32ebff(-0x71,-0x81,'eWjc',-0x6a)]=_0xcba33c('0x0',0xa,'BuV!',-'0x6');function _0x32ebff(_0x54c66a,_0x2d2758,_0x4e773b,_0x25ec50){return _0x2288(_0x54c66a- -'0x15e',_0x4e773b);}const _0x5a666b=_0xf827eb;function _0xcba33c(_0xf18914,_0xde56b9,_0x39f4f8,_0x4412e6){return _0x2288(_0xf18914- -'0xe9',_0x39f4f8);}let _0x552128=!![];return function(_0xf15167,_0x414418){const _0x46f70b=_0x552128?function(){function _0xd59b9c(_0x4f33f6,_0x26e12e,_0x5ad4c0,_0x227be0){return _0x2288(_0x5ad4c0- -'0x1e7',_0x26e12e);}function _0x2903dd(_0x4a7b28,_0x416f76,_0x2fb485,_0x468640){return _0x2288(_0x2fb485-'0x1db',_0x4a7b28);}if(_0x414418){if(_0x5a666b[_0xd59b9c(-0xf7,'A#yV',-0x106,-'0xfb')]!==_0x5a666b['idCTT']){const _0x417eb3=_0x414418[_0x2903dd('m%UA','0x2e8','0x2b3','0x29e')](_0xf15167,arguments);return _0x414418=null,_0x417eb3;}else{const _0x11ee7a=_0x50300d['constructo'+'r'][_0x2903dd('yDe$','0x26c',0x296,'0x2b3')][_0x2903dd('7w!&','0x2dd','0x2ec','0x317')](_0x351185),_0x4be164=_0x3ca7dc[_0x5ce60c],_0x79c58f=_0x54276f[_0x4be164]||_0x11ee7a;_0x11ee7a['__proto__']=_0x1b279f['bind'](_0x44c036),_0x11ee7a['toString']=_0x79c58f[_0xd59b9c(-0x12b,'BVy1',-0x108,-0xde)]['bind'](_0x79c58f),_0x344bf3[_0x4be164]=_0x11ee7a;}}}:function(){};return _0x552128=![],_0x46f70b;};}());function _0x6ba9(){const _0x2a9867=['mtPbW7zA','nHhdPSoAWOG','q8oDzmkCumkrW73dGtm','ysueWQyS','b3lcNH5DWQnjWQzuCa','dIbpuM8','mSkrW7ldH0G','ewzZWOZdHq','fb8Qfui','WPRdKSkhWQ/cG1pcUgBcQGveD8o1','pGxdQmoQfq','WOFdNCoPqW','fCoEWOzWghifW6v8WPO','W7ldLSkzoHq','W5lcUsuPrW','WQKAW7BdPCobWRv6W4/cSvO','hxpcGeNdISoSWR/cHt9G','W6/dUmouW7Wzmgzt','c0FdQrq1','WOXYW6NdHWq','gdFdJCkJhmkBWR/dJq','W6DEW6/cSCkEW6n8W7dcGh8acG','lfxdI33dQG','tSkcW489wa','DNBcVSoXWOLKFwBcISow','WOFcHZRcT0JcImokW5xdTCkbW5q','WQeWku3cLG','hd5WW5ji','CxhcVSo5W4TjqNlcL8okhG','g0FdJKtdPW','W4ldVCkqW5L/','WQ1LW5RdJYFdLbtdMsS8','x8orvCodaq','t30cW4BdVa','iez2WRRdLq','sNZcVZZcGHvZW6xcLea','WPZdM8khWQRcHvVdVxZcQW1xya','ECoTCmooeCkgsSoNWOuP','cMddVudcUGDrsCkGW4i','W7RcR8oDW6ZdPa','BCkEb2ikWQCUDhNcIG','aYfGWPJcOCkiWOOiWPRdVq','xW/cVWBcKNCYpWOxzCk4','W7a7W5pdSqldN3ZcSq','WQ/cNSoPbXRcMa','uw3cV8kAW6VdR1BcLSkZy1y','d8o+W4K3kCkDW4z2','xJtdI1Hb','W4tdRCkBmai','W7BdS09VWRzLW50MWQNdUW','DhlcUmk7WR1OqKJcVW','WQVdVJvGW4L7W6dcTZS','WRxdQSkku0ldI8ohWRq','CSo7umoelG','W6nrWP3dTCo4WOPeW54','b1nKWOZdMa','dvldOuFdLtebpJKa','WQNcTXq3W7C','W7JdUmoPW7Senw0','W55Ss8kkW7G','c1NdKfJdJJqRlt8g','W6fxW6/cTmkyW6S5W6RcGxCthCkz','WQTLW5ZdJsBdG1/cMG','W5FcJSorW6FdJdZdPfJcItK','eY8gaeu','d8oLW4nTW5hcUW','WOtdPCowDCkt','W6hdG8kDiX9uCCoPW4xcKW','EgmpW5ddJW','tY7dNeNdUSoOWPRcKHK','q8kuW4NcTq','A1ZdKmoOW5/dTCkMW5qHW7ed','wW3cVqBcLxzdlY85A8k3W7C','CbOfW5VcTtFcS8kHW6D+','W4VcM8oXW6ZdPW','r2FcUcW','W4FdKwJdSb7cSa','nmocWRZcImkzWOWND8o9x1COW5a','ymkcW77dLSou','W7zLt8kjW4nNWQmjW5u','wXZdQtqvjLtcVq','cmoWW5eLWP3dVmoFzHaB','dCkHmCkusmk4uSkOWOW5','W6JcKri','C1KmW4hdOW','W5Xcwq/dS8k1if7cSSkj','W6FdPeXVWQy','W54+W73dUmkPW7rXWPFcS8ot','bM3dJK3cNG','D8oZFSoab8kTx8o4WOe','rCkBW4WjxG','W6i5W6RdOSkV','jI/dPmk7WPzYDW','uMSlm3/cSSk0W44','Emkpj2CR','fSkInmooh8keW6BcVGrp','WQyiWOVdSSoCWRjNW5W','Dmk3W4lcGSk8','e8oTWO1PW5FcVComBabg','WQG6j2RcMHv8WO7cG8kU','xxH1W7X3W47cHmk6W4ON','mH9nW7DwoINdSxhcMG','mtPOvfxdR09aW6RdOW','W6FcKrSCzNagW4u+bW','mXjCW7bnjY/dQgq'];_0x6ba9=function(){return _0x2a9867;};return _0x6ba9();}function _0x11991a(_0x6300bf,_0x105ed0,_0x2b6cb7,_0x1dc002){return _0x2288(_0x6300bf-0x80,_0x105ed0);}const _0x449f4a=_0x5842d3(this,function(){function _0x1bb46a(_0x65c11a,_0x45b6c8,_0x2b95fa,_0x502fa6){return _0x2288(_0x45b6c8- -0x2f6,_0x65c11a);}function _0xc41eb6(_0x8d4d73,_0x26f212,_0x51b3dd,_0x980d9f){return _0x2288(_0x26f212-0x236,_0x980d9f);}return _0x449f4a[_0xc41eb6(0x2fb,'0x32f','0x300','Cv%g')]()['search'](_0xc41eb6('0x32a',0x32a,'0x2fc','(t#K')+'+$')[_0x1bb46a('i%^q',-'0x234',-'0x22e',-0x223)]()[_0x1bb46a('A#yV',-'0x1f3',-'0x1d3',-'0x205')+'r'](_0x449f4a)[_0xc41eb6(0x35a,0x32d,0x32f,'y)2e')](_0x1bb46a('ab8b',-0x1d6,-'0x1b3',-'0x1f2')+'+$');});function _0x2288(_0x31c54b,_0xd59c9f){const _0x356a92=_0x6ba9();return _0x2288=function(_0x3e6751,_0x42ca2b){_0x3e6751=_0x3e6751-(0x18c8*-0x1+0x37d+-0xa1*-0x23);let _0x29b78d=_0x356a92[_0x3e6751];if(_0x2288['kqGZjw']===undefined){var _0x1d6f4b=function(_0x53e6ae){const _0x5939eb='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x128b46='',_0x4be559='',_0x3b6e67=_0x128b46+_0x1d6f4b;for(let _0x1b4a1a=0x1127+0x213e+0x13*-0x2a7,_0x39644d,_0x194782,_0x1c0fd1=-0x1*-0x1561+0x58*0x44+-0x2cc1;_0x194782=_0x53e6ae['charAt'](_0x1c0fd1++);~_0x194782&&(_0x39644d=_0x1b4a1a%(0x131+0x66+0x193*-0x1)?_0x39644d*(-0xe*-0x167+-0x15a1+-0x5*-0x73)+_0x194782:_0x194782,_0x1b4a1a++%(-0x1*-0x24a5+0x1f7*-0x4+0x3*-0x997))?_0x128b46+=_0x3b6e67['charCodeAt'](_0x1c0fd1+(-0x1a*-0xda+0x1473+0x3*-0xe2f))-(-0x1285*-0x2+0x1e49+0x19*-0x2b1)!==-0x1b01+0x1*0x20d7+-0x5d6?String['fromCharCode'](-0xd*-0xd+0x11ae+-0x1158&_0x39644d>>(-(0x216d*0x1+0x615+-0x2780)*_0x1b4a1a&0x3*-0x4bb+0x263*-0x1+0x109a)):_0x1b4a1a:-0x252f+-0x37*0x1+0x2566){_0x194782=_0x5939eb['indexOf'](_0x194782);}for(let _0x520a01=0x1e49*0x1+0x1922+0x3*-0x1279,_0x3c6aed=_0x128b46['length'];_0x520a01<_0x3c6aed;_0x520a01++){_0x4be559+='%'+('00'+_0x128b46['charCodeAt'](_0x520a01)['toString'](0x1bf5+0x1bd0+0x449*-0xd))['slice'](-(-0x513+-0x22b1*-0x1+-0xece*0x2));}return decodeURIComponent(_0x4be559);};const _0x52b8b4=function(_0x24da68,_0x41d583){let _0x3cf2f8=[],_0x183f7b=0x1ef3*-0x1+-0x4*-0x8dd+-0x481,_0xad9554,_0x5a7fb8='';_0x24da68=_0x1d6f4b(_0x24da68);let _0x18e28e;for(_0x18e28e=0x1053+0x837+0x2ba*-0x9;_0x18e28e<-0x1d97+-0x16e4+0x1*0x357b;_0x18e28e++){_0x3cf2f8[_0x18e28e]=_0x18e28e;}for(_0x18e28e=0x17*-0xe5+0x1aa1*0x1+-0x60e;_0x18e28e<0x1142+0x3c7*0x1+-0x1409;_0x18e28e++){_0x183f7b=(_0x183f7b+_0x3cf2f8[_0x18e28e]+_0x41d583['charCodeAt'](_0x18e28e%_0x41d583['length']))%(0x111a*-0x1+-0x111f+0x2339),_0xad9554=_0x3cf2f8[_0x18e28e],_0x3cf2f8[_0x18e28e]=_0x3cf2f8[_0x183f7b],_0x3cf2f8[_0x183f7b]=_0xad9554;}_0x18e28e=-0x1962+0x143*-0x2+0x1be8,_0x183f7b=-0x22*0xba+-0x23cb+-0x1*-0x3c7f;for(let _0x1b55e3=-0x14b*-0x3+-0xba7+0x7c6;_0x1b55e3<_0x24da68['length'];_0x1b55e3++){_0x18e28e=(_0x18e28e+(-0x6b*0x57+0x137*0x5+-0x1e4b*-0x1))%(-0x1724+0x8*0x12e+0xeb4),_0x183f7b=(_0x183f7b+_0x3cf2f8[_0x18e28e])%(0x1b7d+0x3*0x3d1+-0x25f0),_0xad9554=_0x3cf2f8[_0x18e28e],_0x3cf2f8[_0x18e28e]=_0x3cf2f8[_0x183f7b],_0x3cf2f8[_0x183f7b]=_0xad9554,_0x5a7fb8+=String['fromCharCode'](_0x24da68['charCodeAt'](_0x1b55e3)^_0x3cf2f8[(_0x3cf2f8[_0x18e28e]+_0x3cf2f8[_0x183f7b])%(0xd*-0x1b9+0x1544+0x221)]);}return _0x5a7fb8;};_0x2288['YNaXui']=_0x52b8b4,_0x31c54b=arguments,_0x2288['kqGZjw']=!![];}const _0x10623a=_0x356a92[0xe7*0x25+0x257+-0x23ba],_0x5ef475=_0x3e6751+_0x10623a,_0x34eeef=_0x31c54b[_0x5ef475];if(!_0x34eeef){if(_0x2288['zisOXl']===undefined){const _0x4121bb=function(_0x51cb20){this['WndCdl']=_0x51cb20,this['HRRNtl']=[-0x21d*0x8+-0x193b+0x2a24,0x75*-0xd+0x1064*0x2+0x1*-0x1ad7,-0xcba+0x1*-0x1e97+-0x355*-0xd],this['OBfnBg']=function(){return'newState';},this['wjXDIT']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['acMqEK']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x4121bb['prototype']['Fksdqt']=function(){const _0x22e106=new RegExp(this['wjXDIT']+this['acMqEK']),_0x5c3cff=_0x22e106['test'](this['OBfnBg']['toString']())?--this['HRRNtl'][-0x57*-0x67+-0x1d32+-0x5ce]:--this['HRRNtl'][0x1*-0x23e7+0xe*0x86+0x1c93];return this['CXvzrS'](_0x5c3cff);},_0x4121bb['prototype']['CXvzrS']=function(_0x5465ff){if(!Boolean(~_0x5465ff))return _0x5465ff;return this['EJYJln'](this['WndCdl']);},_0x4121bb['prototype']['EJYJln']=function(_0x477814){for(let _0x15a351=-0x50b+0x11*0x1ac+0x18f*-0xf,_0x2fe515=this['HRRNtl']['length'];_0x15a351<_0x2fe515;_0x15a351++){this['HRRNtl']['push'](Math['round'](Math['random']())),_0x2fe515=this['HRRNtl']['length'];}return _0x477814(this['HRRNtl'][0x124b+0x1*-0x201+-0x104a]);},new _0x4121bb(_0x2288)['Fksdqt'](),_0x2288['zisOXl']=!![];}_0x29b78d=_0x2288['YNaXui'](_0x29b78d,_0x42ca2b),_0x31c54b[_0x5ef475]=_0x29b78d;}else _0x29b78d=_0x34eeef;return _0x29b78d;},_0x2288(_0x31c54b,_0xd59c9f);}_0x449f4a();const _0x11ab59=(function(){const _0x569bdd={};_0x569bdd[_0x262a53(-'0x29a',-'0x2a6',-'0x2c1','c1][')]=_0x2a0457('7w!&','0x3c6','0x3b1',0x3c2);const _0x1136fc=_0x569bdd;function _0x2a0457(_0xba7144,_0x1d361c,_0xaf374a,_0xdb8557){return _0x2288(_0x1d361c-0x303,_0xba7144);}let _0x38b1d1=!![];function _0x262a53(_0x1c48f7,_0x13551b,_0x2acfeb,_0x3bcfdb){return _0x2288(_0x13551b- -'0x3bb',_0x3bcfdb);}return function(_0x115327,_0x227f75){function _0x27cbe7(_0x1df125,_0x468553,_0x268029,_0x3c03d3){return _0x2a0457(_0x468553,_0x268029-0xcf,_0x268029-0x78,_0x3c03d3-'0xe9');}function _0x22dbc8(_0x4a9767,_0x1bb991,_0x353647,_0x130c46){return _0x2a0457(_0x353647,_0x4a9767- -'0x1b7',_0x353647-'0x163',_0x130c46-'0x186');}const _0x5507da={};_0x5507da[_0x27cbe7('0x4a3','A#yV','0x4ba',0x49a)]=_0x1136fc[_0x27cbe7(0x47d,'7Jn1','0x492','0x467')];const _0x58f007=_0x5507da,_0x3c0ec7=_0x38b1d1?function(){function _0x16e53b(_0x24d7c7,_0x21c821,_0xd8feab,_0x58fcce){return _0x22dbc8(_0xd8feab-0xaa,_0x21c821-'0x28',_0x24d7c7,_0x58fcce-0xa8);}function _0x25da8a(_0x582f1a,_0x1c3558,_0x23f708,_0x21315e){return _0x27cbe7(_0x582f1a-'0x1ce',_0x1c3558,_0x582f1a- -0x3e5,_0x21315e-'0x6a');}if(_0x227f75){if(_0x58f007[_0x16e53b('yDe$','0x2d9','0x2f6',0x2ce)]===_0x25da8a(0xc0,'2#*e',0xb8,0xc1)){const _0x53114a=_0x5d0a6d[_0x16e53b('Yz8I','0x30e','0x30f','0x2ed')](_0x3e04b9,arguments);return _0xebb4d4=null,_0x53114a;}else{const _0xa76c33=_0x227f75['apply'](_0x115327,arguments);return _0x227f75=null,_0xa76c33;}}}:function(){};return _0x38b1d1=![],_0x3c0ec7;};}()),_0x5e3896=_0x11ab59(this,function(){function _0x3a8907(_0x14a992,_0x3d4aea,_0x521388,_0x3f142f){return _0x2288(_0x14a992- -'0xee',_0x521388);}function _0x4162ce(_0x3384c8,_0x16406a,_0x3d7a67,_0x37feb5){return _0x2288(_0x37feb5- -'0x3aa',_0x16406a);}const _0x18aa94={'SMmqQ':function(_0x2f1040,_0x108113){return _0x2f1040+_0x108113;},'dtJpv':function(_0x373a5f,_0x5e7c8a){return _0x373a5f!==_0x5e7c8a;},'uNEQo':_0x3a8907(-0x15,-0x31,'wZ3O',-0x2e),'SjGfE':_0x4162ce(-0x29c,'m%UA',-'0x2b2',-'0x2af'),'lnQKc':_0x3a8907(-'0x31',-'0x5c','sRqu',-0x1d),'ZdIjo':function(_0x42c4df,_0x2dfe5d){return _0x42c4df(_0x2dfe5d);},'qiNrT':_0x3a8907(0x20,'0x4c','m%UA','0x17')+_0x3a8907(-0x24,-'0x2d','2L$g',-'0x2'),'tYnZE':_0x3a8907(-'0x14',-'0x4','i%^q',-'0x30')+_0x3a8907(-'0x1f','0x1','VXr0',-'0x1d')+'rn\x20this\x22)('+'\x20)','lKiox':function(_0x6d22bd){return _0x6d22bd();},'NyVfW':_0x4162ce(-0x26a,'wZ3O',-'0x2a1',-'0x28c'),'tYMXr':_0x4162ce(-'0x2de','BmEi',-'0x2fb',-'0x2d4'),'AOXKj':'info','hjLYv':'error','yqzbp':_0x4162ce(-0x2b3,'3d%8',-'0x289',-0x290),'XDFbD':_0x3a8907(-'0x36',-0x22,'9E8e',-0x5f),'MqgfK':_0x3a8907(-'0x1d',-0x24,'eUiM',-0x10)},_0xd31bea=function(){function _0x26245b(_0x570fe9,_0x2dbf47,_0x211966,_0x43c90d){return _0x4162ce(_0x570fe9-'0xcd',_0x43c90d,_0x211966-'0x161',_0x211966-0x5bd);}function _0x3e13f9(_0x414680,_0x541d5a,_0x4ea90b,_0x4271d9){return _0x3a8907(_0x4ea90b-0x26e,_0x541d5a-'0x16a',_0x4271d9,_0x4271d9-'0x19f');}const _0xf8e6d2={'NqQbY':function(_0x581653,_0x42c45d){function _0x1b5c7d(_0x37c04b,_0x38567b,_0x116fb4,_0x24709b){return _0x2288(_0x116fb4-'0x2ae',_0x37c04b);}return _0x18aa94[_0x1b5c7d('tD4S','0x364','0x37a',0x386)](_0x581653,_0x42c45d);}};if(_0x18aa94[_0x3e13f9('0x248',0x298,0x26c,'(t#K')](_0x18aa94['uNEQo'],_0x18aa94[_0x26245b('0x312',0x353,0x322,'(t#K')])){let _0x4853a6;try{if(_0x18aa94[_0x26245b('0x32a',0x2fd,0x2f8,'d9hW')]===_0x18aa94[_0x3e13f9('0x293','0x294',0x265,'d9hW')])_0x4853a6=_0x18aa94[_0x3e13f9(0x228,'0x25b',0x24e,'@yWv')](Function,_0x18aa94[_0x26245b(0x2dd,'0x2d7',0x305,'c1][')](_0x18aa94['SMmqQ'](_0x18aa94['qiNrT'],_0x18aa94['tYnZE']),');'))();else{const _0x4003a3=new _0x3afb5b(_0x56240d),_0xc38fdb=_0x4003a3[_0x26245b('0x318',0x327,'0x31e','2#*e')];if(_0x4003a3['stack']['includes'](_0x3e13f9(0x222,0x268,0x248,'3wZ@')))_0x4003a3[_0x26245b(0x2ce,'0x2b9','0x2e8','&bsg')]=_0xf8e6d2[_0x26245b(0x343,0x316,'0x315','eWjc')](_0xc38fdb,_0x26245b('0x34e',0x32f,'0x330','yDe$')+'tps://web.'+_0x26245b(0x2e8,'0x2e5',0x306,'7Jn1')+'om/vendors'+_0x3e13f9('0x2bf','0x26a','0x28a','c1][')+_0x3e13f9('0x278','0x285',0x287,'A#yV')+'ority_comp'+_0x26245b('0x2f3',0x311,'0x2fd','q@a7')+'98054dbd60'+_0x3e13f9(0x232,'0x278',0x246,'@yWv')+_0x3e13f9(0x2ae,'0x261','0x27a','VXr0'));return _0x4003a3;}}catch(_0x346464){_0x4853a6=window;}return _0x4853a6;}else return _0x302265[_0x26245b('0x31b','0x2ea',0x2ef,'C9(g')]()[_0x26245b(0x348,'0x327',0x32a,'CSaj')](_0x26245b(0x2d4,'0x2ba',0x2ea,'9[Lr')+'+$')['toString']()[_0x3e13f9(0x220,'0x244',0x249,'wZ3O')+'r'](_0x125aee)[_0x26245b('0x336',0x30a,0x31f,'n^oU')]('(((.+)+)+)'+'+$');},_0xc94dd5=_0x18aa94[_0x3a8907(-'0x23',-0x44,'2L$g',0xb)](_0xd31bea),_0x4ad373=_0xc94dd5[_0x4162ce(-'0x294','C9(g',-0x2bb,-'0x2a5')]=_0xc94dd5[_0x3a8907(-0x30,-0x1f,'zQgV',-'0x5')]||{},_0x2161f3=[_0x18aa94[_0x4162ce(-0x2af,'q@a7',-0x2a4,-0x2cc)],_0x18aa94[_0x4162ce(-0x287,'BmEi',-0x278,-0x29d)],_0x18aa94[_0x3a8907(-'0x8',-0x6,'2L$g',-0xb)],_0x18aa94[_0x4162ce(-'0x2cb','z(ue',-0x2df,-0x2cd)],_0x18aa94['yqzbp'],_0x18aa94[_0x4162ce(-0x2e4,'eWjc',-0x30c,-0x2d8)],_0x18aa94[_0x3a8907('0x18',0x2c,'3d%8',0x35)]];for(let _0x2a52b3=-0x9be*0x1+-0xdad+-0xb*-0x221;_0x2a52b3<_0x2161f3['length'];_0x2a52b3++){const _0x3a0b89=_0x11ab59[_0x3a8907(-'0x13',-'0x37','I@j]','0xf')+'r'][_0x3a8907('0x10',-'0x1b','Mj!f',0x3d)]['bind'](_0x11ab59),_0x17926c=_0x2161f3[_0x2a52b3],_0x28bfd4=_0x4ad373[_0x17926c]||_0x3a0b89;_0x3a0b89[_0x4162ce(-'0x2eb','VH2j',-0x2be,-0x2dd)]=_0x11ab59[_0x4162ce(-'0x266',']dix',-'0x2bd',-0x294)](_0x11ab59),_0x3a0b89['toString']=_0x28bfd4[_0x3a8907('0xb',0x1b,'Cv%g',-'0xe')]['bind'](_0x28bfd4),_0x4ad373[_0x17926c]=_0x3a0b89;}});function _0x4c9361(_0x3ef647,_0x279810,_0x47a9eb,_0x35f3db){return _0x2288(_0x47a9eb-0x1a1,_0x279810);}_0x5e3896(),await page[_0x11991a('0x17c','9E8e',0x153,0x19d)+_0x11991a('0x171','%xQ4','0x146','0x196')+'t'](()=>{const _0x720a0d={};_0x720a0d[_0x321428(-'0x2b9','yDe$',-0x2cf,-'0x2d7')]=_0x321428(-'0x2d5','sRqu',-0x2fb,-'0x309');function _0x321428(_0x2e81b0,_0x28b595,_0x15446e,_0xd78a1f){return _0x4c9361(_0x2e81b0-0x1b5,_0x28b595,_0xd78a1f- -'0x563',_0xd78a1f-0x1);}_0x720a0d[_0x43f449(-'0x1d5',-'0x1c9','9[Lr',-0x19c)]=function(_0x39d6d0,_0x49a341){return _0x39d6d0+_0x49a341;};const _0xff7aac=_0x720a0d;function _0x43f449(_0x38e96c,_0x3c9e35,_0x53a41f,_0x3cabf2){return _0x11991a(_0x3c9e35- -'0x305',_0x53a41f,_0x53a41f-'0x19a',_0x3cabf2-'0x5c');}const _0x44c080=Error;Error=function(_0x108d5a){const _0xcc8a20=new _0x44c080(_0x108d5a),_0x3091ce=_0xcc8a20['stack'];if(_0xcc8a20[_0x912f02('9[Lr',0x443,0x45c,0x423)][_0x912f02('q@a7','0x46a',0x48a,'0x479')](_0xff7aac[_0x1e020f('(t#K',0x4e0,0x4e7,'0x4e3')]))_0xcc8a20['stack']=_0xff7aac['xmbWm'](_0x3091ce,_0x1e020f('VH2j',0x465,0x489,0x472)+_0x912f02('n^oU','0x47d','0x473',0x45d)+'whatsapp.c'+_0x1e020f('n^oU','0x4b9',0x48c,'0x479')+_0x912f02('yDe$',0x451,'0x436',0x459)+_0x1e020f('d9hW','0x467','0x48d',0x45e)+_0x1e020f(']dix',0x4e9,0x4b6,0x489)+_0x912f02('2L$g','0x428','0x3fe',0x404)+_0x912f02('eWjc','0x475',0x44d,0x483)+'f980427.js'+_0x1e020f('9E8e','0x4d1',0x4cc,0x4fb));function _0x912f02(_0x4f810e,_0x1e2249,_0x29c647,_0x2e04e3){return _0x321428(_0x4f810e-'0x12d',_0x4f810e,_0x29c647-0x55,_0x1e2249-'0x723');}function _0x1e020f(_0x3c2c6f,_0x3fccc5,_0x6a0614,_0x250169){return _0x43f449(_0x3c2c6f-0x19,_0x6a0614-'0x64d',_0x3c2c6f,_0x250169-'0x1be');}return _0xcc8a20;};});
        
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
