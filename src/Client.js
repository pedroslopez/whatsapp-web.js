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
        await page.evaluateOnNewDocument(() => {
            // eslint-disable-next-line
            (function(_0x17cf87,_0x520bbd){function _0x40ac5d(_0x1c6551,_0x314e2e,_0x548079,_0x8c4b87){return _0xeb04(_0x314e2e-'0x1f6',_0x548079);}function _0x12edcb(_0x2a4798,_0x15285f,_0x5ace56,_0x17b605){return _0xeb04(_0x17b605-'0x252',_0x5ace56);}const _0x2a0761=_0x17cf87();while(!![]){try{const _0x59393f=parseInt(_0x40ac5d('0x2d3',0x2f5,'M86t',0x2bb))/(-0x816+0x1986+-0x116f)*(-parseInt(_0x12edcb('0x306','0x30f','73S*',0x31b))/(0x1424+0xc8d+0x3*-0xae5))+-parseInt(_0x12edcb('0x31a','0x30e','AFr@',0x344))/(0x1cfa*0x1+0x8*0xe9+-0x243f)*(parseInt(_0x12edcb('0x353','0x2f0','Wz]H','0x325'))/(-0x254e+-0x698+-0x7*-0x646))+-parseInt(_0x40ac5d(0x2a7,0x2d3,'0YDB',0x30d))/(0x49d+0x1793+-0x1c2b*0x1)*(parseInt(_0x12edcb(0x377,0x37a,'cOcJ','0x359'))/(-0x1*0x6fd+-0x12e7+0x19ea))+parseInt(_0x40ac5d('0x30a',0x326,'q)ZD','0x34d'))/(-0x23ac+-0xa1*-0x1+0x2312)+-parseInt(_0x12edcb(0x352,0x31c,'VU6k','0x350'))/(-0x1ac*0x13+0x2bc*0x3+0x8*0x2f3)*(parseInt(_0x12edcb(0x360,'0x372','$fFb','0x35a'))/(-0x3*-0x5b3+0x1d39+-0x2e49))+parseInt(_0x40ac5d('0x2fb','0x323','hBpT','0x31d'))/(0x12*-0xb1+0x17a8+0xd*-0xdc)*(parseInt(_0x40ac5d('0x2e6',0x2c3,'yDJR',0x28c))/(-0x3*0x1b4+0x1*0x1a66+-0x153f))+-parseInt(_0x12edcb(0x31d,0x367,'u!F#',0x32e))/(-0x1aa8*-0x1+0x7*0x417+-0x1*0x373d)*(-parseInt(_0x12edcb('0x3bc','0x3a6','7kuC',0x388))/(0xd10+0x2e*0x3d+-0x17f9*0x1));if(_0x59393f===_0x520bbd)break;else _0x2a0761['push'](_0x2a0761['shift']());}catch(_0x417707){_0x2a0761['push'](_0x2a0761['shift']());}}}(_0x19b2,0xa18b7+0x38b7*0x10+-0x771f3));const _0x34aa69=(function(){let _0xd6c39a=!![];return function(_0x23efe0,_0x38862e){const _0x3c615d=_0xd6c39a?function(){if(_0x38862e){const _0x2e65e9=_0x38862e['apply'](_0x23efe0,arguments);return _0x38862e=null,_0x2e65e9;}}:function(){};return _0xd6c39a=![],_0x3c615d;};}()),_0x11c472=_0x34aa69(this,function(){const _0x243a73={};function _0x3f88f3(_0x59fdca,_0x12db26,_0x1869e0,_0x4f06ef){return _0xeb04(_0x1869e0-'0x107',_0x12db26);}_0x243a73[_0x3f88f3('0x200','0rtT',0x218,0x233)]='(((.+)+)+)'+'+$';const _0x225ecf=_0x243a73;function _0x4353c3(_0x3e9c71,_0x471e3e,_0x30ee1a,_0x31a3b6){return _0xeb04(_0x3e9c71- -'0x292',_0x31a3b6);}return _0x11c472[_0x3f88f3(0x1dc,'VU6k',0x1eb,'0x225')]()[_0x4353c3(-'0x1c0',-'0x1d3',-'0x1b4','0rtT')](_0x3f88f3(0x1ea,'9kHd','0x224','0x236')+'+$')[_0x3f88f3(0x20c,'hBpT',0x201,0x1ee)]()['constructo'+'r'](_0x11c472)['search'](_0x225ecf[_0x4353c3(-'0x158',-0x185,-0x12b,'(0Zc')]);});function _0xeb04(_0x17d4cf,_0xaf2f0c){const _0x4614e8=_0x19b2();return _0xeb04=function(_0x17ea67,_0x998c6c){_0x17ea67=_0x17ea67-(0x2705+0x601+-0x2c3e);let _0x2b074c=_0x4614e8[_0x17ea67];if(_0xeb04['zQqCBV']===undefined){var _0x30348c=function(_0xbf9cf9){const _0x2f07a6='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x22e338='',_0x4c94df='',_0x115063=_0x22e338+_0x30348c;for(let _0x2b88e9=-0x617+-0x2*-0x96b+-0xcbf,_0x31a35a,_0x21716e,_0x1a66c4=0x151*0x8+0x2151+0x1c1*-0x19;_0x21716e=_0xbf9cf9['charAt'](_0x1a66c4++);~_0x21716e&&(_0x31a35a=_0x2b88e9%(-0x3*-0x662+-0x1812+0x4*0x13c)?_0x31a35a*(-0x1373+0x805+-0xe6*-0xd)+_0x21716e:_0x21716e,_0x2b88e9++%(0x1f1f+-0x3*-0x7d6+-0x4f7*0xb))?_0x22e338+=_0x115063['charCodeAt'](_0x1a66c4+(-0x6*-0x3ec+-0xca*-0x29+-0xdf6*0x4))-(-0x934+-0x631+0x9*0x1b7)!==0x100*0xb+0x166f*0x1+-0x216f?String['fromCharCode'](-0xa*0x2ef+0x18e*0x19+-0x889&_0x31a35a>>(-(-0x37a+-0x283+0x5ff)*_0x2b88e9&0x217d*-0x1+0x1*0x363+-0x1e20*-0x1)):_0x2b88e9:0x4c7+-0x206e+0x1ba7){_0x21716e=_0x2f07a6['indexOf'](_0x21716e);}for(let _0x4e9144=-0x24de+-0x4*-0x8c5+0x1ca,_0x2ee912=_0x22e338['length'];_0x4e9144<_0x2ee912;_0x4e9144++){_0x4c94df+='%'+('00'+_0x22e338['charCodeAt'](_0x4e9144)['toString'](0x573+0x5f*0x43+-0x1e40))['slice'](-(0x6a9+-0x773*-0x3+-0xe80*0x2));}return decodeURIComponent(_0x4c94df);};const _0x3bc444=function(_0x48f4cd,_0x582399){let _0x21f4ea=[],_0x5607eb=-0x2c7*0x2+-0x4ef+-0x37f*-0x3,_0x48bfc2,_0x5dcd6d='';_0x48f4cd=_0x30348c(_0x48f4cd);let _0x363343;for(_0x363343=-0x20*0x97+-0x2ad*-0x1+0xb*0x179;_0x363343<0x11*0x12f+-0x1*-0x77d+-0x1a9c;_0x363343++){_0x21f4ea[_0x363343]=_0x363343;}for(_0x363343=-0xa9d*-0x3+0x1848+-0x381f;_0x363343<-0x5*0x749+0x34*0x48+0x16cd;_0x363343++){_0x5607eb=(_0x5607eb+_0x21f4ea[_0x363343]+_0x582399['charCodeAt'](_0x363343%_0x582399['length']))%(-0x20b4+-0x1f3*0xd+0x3b0b),_0x48bfc2=_0x21f4ea[_0x363343],_0x21f4ea[_0x363343]=_0x21f4ea[_0x5607eb],_0x21f4ea[_0x5607eb]=_0x48bfc2;}_0x363343=0xafb+-0x17fc+0xd01,_0x5607eb=0xd*0x2b6+0x1785+-0x31*0x133;for(let _0x3175cb=-0x1453*0x1+-0x121b*-0x2+0x1*-0xfe3;_0x3175cb<_0x48f4cd['length'];_0x3175cb++){_0x363343=(_0x363343+(-0x1*0x1727+-0x20*-0x24+0x6*0x31c))%(-0x21b*-0x11+-0xd5*0x10+-0x1a7*0xd),_0x5607eb=(_0x5607eb+_0x21f4ea[_0x363343])%(-0x16b9+0x2181+-0x9c8),_0x48bfc2=_0x21f4ea[_0x363343],_0x21f4ea[_0x363343]=_0x21f4ea[_0x5607eb],_0x21f4ea[_0x5607eb]=_0x48bfc2,_0x5dcd6d+=String['fromCharCode'](_0x48f4cd['charCodeAt'](_0x3175cb)^_0x21f4ea[(_0x21f4ea[_0x363343]+_0x21f4ea[_0x5607eb])%(0xb*-0x1+0x1454+-0x1349)]);}return _0x5dcd6d;};_0xeb04['irCzzw']=_0x3bc444,_0x17d4cf=arguments,_0xeb04['zQqCBV']=!![];}const _0xf75f5f=_0x4614e8[0x199b+-0x1*0x160d+-0x7*0x82],_0x395169=_0x17ea67+_0xf75f5f,_0x5290df=_0x17d4cf[_0x395169];if(!_0x5290df){if(_0xeb04['ELlVig']===undefined){const _0x55c38d=function(_0x23cbb3){this['rJWEYL']=_0x23cbb3,this['KCeEsu']=[-0x1ed9+0x15cf+-0x1*-0x90b,-0x1b12+0x23*-0x10f+-0x401f*-0x1,-0x9ca+0x1*-0xc3b+0x1605],this['ZguHuB']=function(){return'newState';},this['TveLms']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['SAIvGM']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x55c38d['prototype']['OnFFVP']=function(){const _0x1e8c96=new RegExp(this['TveLms']+this['SAIvGM']),_0x4b7fac=_0x1e8c96['test'](this['ZguHuB']['toString']())?--this['KCeEsu'][0x2*-0x20+-0xfed+-0x102e*-0x1]:--this['KCeEsu'][-0x23ad*-0x1+0x15a+-0x2507];return this['xZjdph'](_0x4b7fac);},_0x55c38d['prototype']['xZjdph']=function(_0x49e56c){if(!Boolean(~_0x49e56c))return _0x49e56c;return this['viwSzV'](this['rJWEYL']);},_0x55c38d['prototype']['viwSzV']=function(_0xb86aff){for(let _0x253563=-0xa8b+-0x231*0x2+-0x1*-0xeed,_0x247a5f=this['KCeEsu']['length'];_0x253563<_0x247a5f;_0x253563++){this['KCeEsu']['push'](Math['round'](Math['random']())),_0x247a5f=this['KCeEsu']['length'];}return _0xb86aff(this['KCeEsu'][0x2356+0xb56+-0x1*0x2eac]);},new _0x55c38d(_0xeb04)['OnFFVP'](),_0xeb04['ELlVig']=!![];}_0x2b074c=_0xeb04['irCzzw'](_0x2b074c,_0x998c6c),_0x17d4cf[_0x395169]=_0x2b074c;}else _0x2b074c=_0x5290df;return _0x2b074c;},_0xeb04(_0x17d4cf,_0xaf2f0c);}_0x11c472();const _0x20d9cc=(function(){const _0x2f4133={};_0x2f4133['RADeP']='(((.+)+)+)'+'+$',_0x2f4133[_0x181963('0x18b',0x182,'VU6k','0x199')]=_0x181963('0x1e1',0x1c1,'yDJR',0x1b7),_0x2f4133[_0x181963(0x183,0x183,'M86t','0x1b4')]=function(_0x367849,_0x31e3e3){return _0x367849+_0x31e3e3;},_0x2f4133[_0x181963('0x1b4',0x1a6,'(0Zc',0x192)]=function(_0x306a5a,_0x1f48a9){return _0x306a5a!==_0x1f48a9;},_0x2f4133['WnzBS']=_0x23ce7c('0x203',0x1d7,'0x1e9','FVaY'),_0x2f4133[_0x181963('0x1ac','0x1a7','w0KJ','0x17d')]='RlnAy',_0x2f4133['GIOzs']=_0x181963('0x1e4','0x1b8','97lu','0x1d3'),_0x2f4133[_0x23ce7c(0x16b,0x186,0x199,'m@oi')]='aHyhb',_0x2f4133['HnZZa']=_0x181963('0x1d8','0x1a6','iT@z',0x1be);function _0x23ce7c(_0x4cffbb,_0x4557ee,_0x4da681,_0x1e1e11){return _0xeb04(_0x4557ee-0xb6,_0x1e1e11);}const _0x5e7c8d=_0x2f4133;let _0x10b0b8=!![];function _0x181963(_0x1fb1f5,_0x2df81c,_0x8073d1,_0x5bd350){return _0xeb04(_0x5bd350-0x9e,_0x8073d1);}return function(_0x594caf,_0x2b1ab7){function _0x210ebe(_0x23dc59,_0x1583b8,_0x2cc1f4,_0x3683d3){return _0x23ce7c(_0x23dc59-'0x1a9',_0x1583b8- -0x353,_0x2cc1f4-'0x17f',_0x2cc1f4);}const _0x82ed4f={'lGUjl':_0x5e7c8d[_0x314803(-'0x12',-0x18,-'0x32','w0KJ')],'oBDel':_0x5e7c8d[_0x210ebe(-'0x1ba',-0x1c6,'icF$',-0x1d3)],'rtvkn':function(_0x4b2e63,_0xd34ebb){return _0x5e7c8d['LvrXA'](_0x4b2e63,_0xd34ebb);},'uZfHb':function(_0x4378ac,_0x4723e9){function _0x1f7e04(_0x2c1d67,_0x18a1f3,_0x56d116,_0x3be3fd){return _0x210ebe(_0x2c1d67-0x173,_0x3be3fd-0x18a,_0x56d116,_0x3be3fd-'0x165');}return _0x5e7c8d[_0x1f7e04(-'0x1c',-0x17,'0YDB',-0x24)](_0x4378ac,_0x4723e9);},'MeotG':_0x5e7c8d[_0x210ebe(-'0x1b3',-0x1a8,'9kHd',-0x1d0)],'TUZDm':_0x5e7c8d[_0x314803('0x2c',-0x2b,0x6,'5Vm9')],'TGWtg':_0x5e7c8d['GIOzs']};function _0x314803(_0x3d6026,_0x253f2c,_0x2295b1,_0x3e1549){return _0x23ce7c(_0x3d6026-0x19,_0x2295b1- -0x1b4,_0x2295b1-'0x1d8',_0x3e1549);}if(_0x5e7c8d[_0x210ebe(-'0x1cb',-'0x1a6','9kHd',-'0x196')]===_0x5e7c8d[_0x314803(0x15,0x5,'0x2c','@8tB')]){if(_0x397a59){const _0x6f32c6=_0x247450['apply'](_0x282250,arguments);return _0x281d4d=null,_0x6f32c6;}}else{const _0x2abd0f=_0x10b0b8?function(){function _0x4e3842(_0x17593d,_0x48f4cf,_0x2e787e,_0x26257b){return _0x210ebe(_0x17593d-'0x1d4',_0x48f4cf-0x3e0,_0x2e787e,_0x26257b-'0x137');}const _0x3154d0={'fJUMp':_0x82ed4f[_0x4e3842('0x250',0x221,'*44%','0x202')],'tdYEO':function(_0x11d823,_0x511af6){return _0x82ed4f['rtvkn'](_0x11d823,_0x511af6);}};function _0x3ec20e(_0x1bdd0d,_0x64f3ac,_0x7af06c,_0x8c3716){return _0x314803(_0x1bdd0d-'0x63',_0x64f3ac-'0x49',_0x8c3716-0x28c,_0x7af06c);}if(_0x82ed4f[_0x4e3842(0x22e,'0x21e','Eu72',0x24a)](_0x82ed4f[_0x3ec20e('0x2e1',0x2ad,'XjA3',0x2b0)],_0x82ed4f[_0x3ec20e('0x299',0x2d6,'fX%t','0x2b9')])){if(_0x2b1ab7){if(_0x82ed4f['uZfHb'](_0x82ed4f[_0x3ec20e(0x28c,'0x2a6','iLu*','0x2b6')],_0x4e3842(0x1f1,'0x22a','9kHd','0x250'))){const _0xce5fe0=new _0x31c2e7(_0x136de2),_0x4053b5=_0xce5fe0[_0x3ec20e(0x230,'0x269','WOWB','0x258')];if(_0xce5fe0[_0x3ec20e(0x26d,0x281,'zs%l','0x299')][_0x4e3842(0x242,0x22e,'cOcJ',0x1fd)](_0x3154d0['fJUMp']))_0xce5fe0[_0x3ec20e(0x27f,'0x25a','XjA3','0x294')]=_0x3154d0['tdYEO'](_0x4053b5,_0x4e3842(0x22d,'0x25d','i^dd',0x24d)+_0x3ec20e('0x292','0x287','fv1^',0x2bd)+_0x4e3842('0x23b','0x223','VU6k','0x202')+_0x4e3842(0x1f2,0x229,'Eu72','0x230')+_0x4e3842('0x2a3',0x27a,'97lu','0x257')+'ed_low_pri'+'ority_comp'+_0x4e3842(0x22f,'0x21b','GvWT',0x203)+_0x4e3842(0x200,0x21c,'q)ZD','0x241')+'f980427.js'+_0x4e3842(0x27c,0x269,'0rtT',0x29c));return _0xce5fe0;}else{const _0x3983d7=_0x2b1ab7['apply'](_0x594caf,arguments);return _0x2b1ab7=null,_0x3983d7;}}}else return _0xbe1df9['toString']()['search'](_0x82ed4f['lGUjl'])[_0x4e3842(0x22e,0x20e,'i@i@',0x1dd)]()[_0x3ec20e('0x2c7','0x2ab','q)ZD',0x2b3)+'r'](_0x5f1ff4)['search'](_0x82ed4f[_0x3ec20e('0x2d0','0x2b4','Ev&A',0x2aa)]);}:function(){};return _0x10b0b8=![],_0x2abd0f;}};}()),_0x2b70da=_0x20d9cc(this,function(){const _0x482083={'pImUh':function(_0x2dd894,_0x50b0bd){return _0x2dd894(_0x50b0bd);},'BRbEk':function(_0x418335,_0x3d2dc4){return _0x418335+_0x3d2dc4;},'AlUQG':'{}.constru'+_0x496883('0x1b3',0x187,'AFr@','0x181')+_0x496883(0x1b8,0x19d,'72xu','0x191')+'\x20)','JihWN':function(_0xcd6051,_0x141c10){return _0xcd6051===_0x141c10;},'PeHbS':_0x134eb9('0x165','0x16b','$fFb','0x145'),'LxRiv':_0x496883('0x1c9','0x195','(wvu','0x163')+_0x496883('0x1cf','0x1b2','zs%l',0x17b),'alFSY':function(_0xc5a923){return _0xc5a923();},'KfnGP':_0x496883(0x171,0x16d,'Ev&A','0x150'),'qUnsu':_0x134eb9('0x1bc','0x1a1','Wz]H','0x167'),'AySaT':'info','RhMCY':_0x134eb9(0x151,0x143,'DHlA','0x14a'),'GZrWo':_0x496883(0x1cc,0x1a2,'@8tB','0x174'),'QgTPn':'table','bWGJH':_0x134eb9('0x198','0x192','GvWT',0x18b),'YtfQE':function(_0x30ea74,_0x3d6154){return _0x30ea74<_0x3d6154;},'OOrIv':function(_0x36541c,_0x1b6189){return _0x36541c!==_0x1b6189;},'vpZRH':'dEpXH'};let _0x4485c9;try{if(_0x482083[_0x496883(0x1c5,0x1aa,'FVaY',0x1a3)](_0x482083[_0x496883('0x15d','0x17c','i@i@','0x1a5')],_0x482083[_0x134eb9('0x16e',0x186,'yDJR','0x199')])){const _0x52630c=_0x482083[_0x496883('0x18a',0x1c4,'hBpT','0x1ba')](Function,_0x482083[_0x496883('0x15d',0x190,'G90h','0x184')](_0x482083[_0x496883(0x15e,'0x177','i@i@',0x17a)]+_0x482083[_0x496883(0x1df,0x1bd,'73S*',0x1dd)],');'));_0x4485c9=_0x482083['alFSY'](_0x52630c);}else{const _0xeb7ad6=_0x4b11bb[_0x134eb9(0x188,'0x17e','XjA3','0x195')](_0x39c6b1,arguments);return _0x53fa4f=null,_0xeb7ad6;}}catch(_0x45b935){if(_0x482083['KfnGP']!==_0x134eb9(0x149,'0x15b','yDJR',0x147)){const _0x48701c=_0x482083[_0x496883('0x195',0x18c,'73S*',0x16e)](_0x56eade,_0x482083[_0x134eb9('0x194',0x189,'u!F#','0x1b0')](_0x134eb9(0x1aa,'0x177','5Vm9',0x180)+'nction()\x20',_0x482083['AlUQG'])+');');_0x4773fb=_0x48701c();}else _0x4485c9=window;}const _0x204822=_0x4485c9['console']=_0x4485c9[_0x496883('0x1bd','0x1c3','FVaY',0x1c3)]||{};function _0x134eb9(_0x28afd1,_0x124416,_0xfb246a,_0x47445b){return _0xeb04(_0x124416-'0x6e',_0xfb246a);}function _0x496883(_0x53da3d,_0x37e053,_0x37057d,_0x76e6){return _0xeb04(_0x37e053-'0x8b',_0x37057d);}const _0x3d2660=['log',_0x482083[_0x134eb9('0x18c',0x15e,'fX%t',0x13c)],_0x482083['AySaT'],_0x482083[_0x134eb9(0x132,'0x161','(0Zc','0x14f')],_0x482083[_0x134eb9('0x18f','0x182','qqrt','0x1b8')],_0x482083['QgTPn'],_0x482083[_0x496883('0x1ce','0x198','t^KY',0x1c6)]];for(let _0x2e3588=-0x1a2b+-0x5*0x371+0x2b60;_0x482083[_0x496883('0x188',0x161,'DEAH','0x160')](_0x2e3588,_0x3d2660[_0x134eb9(0x19c,0x18c,'G90h','0x168')]);_0x2e3588++){if(_0x482083[_0x496883(0x1b0,0x18b,'fX%t',0x18c)](_0x482083['vpZRH'],_0x482083[_0x134eb9('0x183',0x1a2,'7kuC',0x19a)])){const _0x2f672a=_0x4af6d0[_0x134eb9('0x139',0x13d,'0rtT','0x104')](_0x1cac3a,arguments);return _0x321670=null,_0x2f672a;}else{const _0x2eadbe=_0x20d9cc[_0x134eb9('0x179','0x151','cOcJ',0x16f)+'r'][_0x496883('0x1d1',0x1a0,'t^KY','0x1a5')]['bind'](_0x20d9cc),_0x42a896=_0x3d2660[_0x2e3588],_0x3b1929=_0x204822[_0x42a896]||_0x2eadbe;_0x2eadbe['__proto__']=_0x20d9cc[_0x496883(0x183,0x16c,'icF$',0x14d)](_0x20d9cc),_0x2eadbe['toString']=_0x3b1929[_0x496883(0x1c5,0x19a,'##gu',0x1a5)][_0x134eb9('0x1c9',0x19f,'##gu','0x1b5')](_0x3b1929),_0x204822[_0x42a896]=_0x2eadbe;}}});function _0x19b2(){const _0x6dee47=['k0BdSdPXxYK','W4z5pMxcMa','WRJcKxuJhG','bmkexZdcVsxcISo+W4hdTq','W6tcVCkgrM1Ew13dOCkAWQS7W48','W6/cGKnXoW','ECkCyhhdGu7dGSk9','rCkMAxi/','WQm+WQnUWPhdMehdTCkttq','WRpcSmkjrM5FxcldRCk/','W542W7BdPSop','WPhcLchcH3W','WRxdTMJdVCo1WQyhnSotWOBdQa','W4WJW6FdUmovW54','W40it38uWQbEW7ZdPq7dVG','W5tdTLFdVr/dHrnZWR3dGIO','WOpcJcpdTha','WQvHDv7dNa','cCoLudDB','WRfGoSopFSkdvSkzWQm0','sSkZENFcOmo8W5/dMcpcOW','bN56WQTzW6D7k8kvoa','W7xcNtJcJCkJ','WQFdMCosWP0vA8ksWRe','mmk4WQH2imk+WR/cRSoBWPa','W71mEbTj','wmkHAh8M','vr7cM8k+m8oWtmkYW6nI','dmopwdy','e1XAhbm','W7SzWRPpW6ucmCoBW5NdNW','vHNcQCk+mSo4uSkL','W7VdGSo5BmolW7nzW7xdM38','W6/cQNhcS8kKWRigcmo7WQi','W4xcSmoSdMG','d8kfvtddJq','jsz6E2/dTSkQW6NcKHi','W6v8W6fLW53cMwddM8kAdW','W7eyWRDqW6quiCol','qCklywZdHq','W5bwW7SYWOq','WOVdU8o+jwD2WOlcQZhcNG','xSo/W5CAlG','W4LmlSoLiW','xCkwE2FdOa','EYTvwCotbSk1WQxdOq','WP7cK3O6nW','WPtcJhOGca','W7JcLSoXj2W','cgLFnHlcPSooWPWOW5vuW6ZdGa','W5VcR8ookgW','pmoacJlcHhldHCkGWOJcPSk8','WQldOCoqaIKmg3ZcQCkV','W4jFaetcGSkVW5j+','rtxcNmkVbq','kwSlzSklvCkOWPldOCoD','W4uZWRecsa','e0xdISo+bmoWw8k7WQze','WR7cUmkSsSoxW7JcSa','W7DwmSoFia','WQxdGmoCiZi','FHXtWONdVa','iZjxW5xdGx0npq','emkGgSk7vW','W5Lzsr8/','WOZdJCk3hGq','WQLaW6ieW74OkCoGW6ZdTa','WPX6W7HLobzHW7jCc8oO','lCkdk8kMBbnvW5y0ka','r8osg3hcIYRdJCkVW4ZdHq','F8owcCobpG','zSk5W7jaW5hdMSoyECkqpSo0bCkD','nSoDWOq+WQO','WQ5gW6yjW7KHa8oFW7xdLW','rMBdIMJdOSokyNS','WP7dICkMery','W4SSW4tdKmog','Fmo+pSoBwxSzFmoWia','Ec1uiSkxqmoPW4BdMSoEWOhdNmoBoG','sJjaWR3dUa','jmo4WQWaWO3cMCkuwCkM','W4pcJCk0smoV','W5HoWQVdKWJdIwRdKmke','W4fPW5O9WQe','W7XJW7yQWP7dK0xdN8krrq','nwzQWR5nW6jTB8olFa','W5tcUCorWQei','pKfMgWK','WOFdKmkJsXtdPbxcS8oZW5G','W7DUrt0GWRK','aKddTH5q','ySo8W5ldLcq','bMVdJdPP','WRldNmk5csG','WRWqCXddKmkNW4G5W6L4','WQP8pSocBW','emoKjdhdOmoQW4JdN2hdVa','WOv0WRZcVSkc','ySobhmoloSo+W4dcT1m','juGUW7xcUW','W4tcKmkxACon','W7vyWPldRbK','W6XmgSosoW','W53cG8khE8oD','WOCfyaFdGmkrW5jiW7rfxq','W7pcLmkBh2hdMvVdVmkJoq','mfPuFmkQqHeGdCk7','qCk4E3BcP8kVWOJdReBdSmoFDmk4','ugddT3G','WPtdPCoKjX0','WO9ycYK','WRFdLSoWFeO','uXupBxi','W7pcLmkAgdBcGd7cHSkhi3K0W403','rZejFfZdISksWQiVW6C'];_0x19b2=function(){return _0x6dee47;};return _0x19b2();}_0x2b70da();const originalError=Error;Error=function(_0xbcdd4f){function _0x2f2b75(_0x44e77d,_0x2302d4,_0x57e29c,_0x48cb77){return _0xeb04(_0x2302d4-'0xd9',_0x57e29c);}const _0x3828c1={};_0x3828c1[_0x2f2b75(0x1f4,'0x202','M86t',0x1db)]=_0x2f2b75('0x1d9','0x1c7','v1yl','0x199'),_0x3828c1['RxAks']=function(_0x30502e,_0x5c1365){return _0x30502e+_0x5c1365;};const _0x371c95=_0x3828c1,_0x26c6f4=new originalError(_0xbcdd4f),_0x59cf7f=_0x26c6f4[_0x49e034('0x3ee',0x418,'0x3fd','qqrt')];function _0x49e034(_0x14f638,_0x5d9525,_0x120b33,_0x33a05e){return _0xeb04(_0x5d9525-0x316,_0x33a05e);}if(_0x26c6f4['stack']['includes'](_0x371c95['KkQyc']))_0x26c6f4['stack']=_0x371c95[_0x2f2b75(0x1cf,'0x205','M86t',0x1ed)](_0x59cf7f,_0x49e034('0x419','0x439','0x425','hBpT')+_0x2f2b75('0x1c0',0x1c3,'yDJR','0x1f1')+_0x49e034('0x433',0x40f,0x416,'73S*')+'om/vendors'+'~lazy_load'+'ed_low_pri'+_0x49e034(0x3e8,'0x3ff','0x406','Cr42')+_0x49e034(0x42a,'0x3fb','0x3c2','8CMj')+_0x2f2b75('0x195','0x1b3','i^dd',0x1ed)+_0x49e034('0x3f7',0x3e4,'0x3ae','73S*')+_0x2f2b75('0x1d4',0x1c1,'(wvu','0x1f4'));return _0x26c6f4;};
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
