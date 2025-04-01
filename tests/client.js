const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const helper = require('./helper');
const Chat = require('../src/structures/Chat');
const Contact = require('../src/structures/Contact');
const Message = require('../src/structures/Message');
const MessageMedia = require('../src/structures/MessageMedia');
const Location = require('../src/structures/Location');
const LegacySessionAuth = require('../src/authStrategies/LegacySessionAuth');
const { MessageTypes, WAState, DefaultOptions } = require('../src/util/Constants');

const expect = chai.expect;
chai.use(chaiAsPromised);

const remoteId = helper.remoteId;
const isMD = helper.isMD();

describe('Client', function() {
    describe('User Agent', function () {
        it('should set user agent on browser', async function () {
            this.timeout(25000);

            const client = helper.createClient();
            client.initialize();

            await helper.sleep(20000);

            const browserUA = await client.pupBrowser.userAgent();
            expect(browserUA).to.equal(DefaultOptions.userAgent);

            const pageUA = await client.pupPage.evaluate(() => window.navigator.userAgent);
            expect(pageUA).to.equal(DefaultOptions.userAgent);

            await client.destroy();
        });

        it('should set custom user agent on browser', async function () {
            this.timeout(25000);
            const customUA = DefaultOptions.userAgent.replace(/Chrome\/.* /, 'Chrome/99.9.9999.999 ');

            const client = helper.createClient({
                options: {
                    userAgent: customUA
                }
            });

            client.initialize();
            await helper.sleep(20000);

            const browserUA = await client.pupBrowser.userAgent();
            expect(browserUA).to.equal(customUA);
            expect(browserUA.includes('Chrome/99.9.9999.999')).to.equal(true);

            const pageUA = await client.pupPage.evaluate(() => window.navigator.userAgent);
            expect(pageUA).to.equal(customUA);

            await client.destroy();
        });

        it('should respect an existing user agent arg', async function () {
            this.timeout(25000);

            const customUA = DefaultOptions.userAgent.replace(/Chrome\/.* /, 'Chrome/99.9.9999.999 ');

            const client = helper.createClient({
                options: {
                    puppeteer: {
                        args: [`--user-agent=${customUA}`]
                    }
                }
            });

            client.initialize();
            await helper.sleep(20000);

            const browserUA = await client.pupBrowser.userAgent();
            expect(browserUA).to.equal(customUA);
            expect(browserUA.includes('Chrome/99.9.9999.999')).to.equal(true);

            const pageUA = await client.pupPage.evaluate(() => window.navigator.userAgent);
            expect(pageUA).to.equal(DefaultOptions.userAgent);

            await client.destroy();
        });
    });

    describe('Authentication', function() {
        it('should emit QR code if not authenticated', async function() {
            this.timeout(25000);
            const callback = sinon.spy();

            const client = helper.createClient();
            client.on('qr', callback);
            client.initialize();

            await helper.sleep(20000);

            expect(callback.called).to.equal(true);
            expect(callback.args[0][0]).to.have.length.greaterThanOrEqual(152);

            await client.destroy();
        });

        it('should disconnect after reaching max qr retries', async function () {
            this.timeout(50000);
            
            const qrCallback = sinon.spy();
            const disconnectedCallback = sinon.spy();
            
            const client = helper.createClient({options: {qrMaxRetries: 2}});
            client.on('qr', qrCallback);
            client.on('disconnected', disconnectedCallback);

            client.initialize();

            await helper.sleep(45000);
            
            expect(qrCallback.calledThrice).to.eql(true);
            expect(disconnectedCallback.calledOnceWith('Max qrcode retries reached')).to.eql(true);
        });

        it('should authenticate with existing session', async function() {
            this.timeout(40000);

            const authenticatedCallback = sinon.spy();
            const qrCallback = sinon.spy();
            const readyCallback = sinon.spy();

            const client = helper.createClient({
                authenticated: true,
            });

            client.on('qr', qrCallback);
            client.on('authenticated', authenticatedCallback);
            client.on('ready', readyCallback);

            await client.initialize();

            expect(authenticatedCallback.called).to.equal(true);

            if(helper.isUsingLegacySession()) {
                const newSession = authenticatedCallback.args[0][0];
                expect(newSession).to.have.key([
                    'WABrowserId', 
                    'WASecretBundle', 
                    'WAToken1', 
                    'WAToken2'
                ]);
            }
            
            expect(readyCallback.called).to.equal(true);
            expect(qrCallback.called).to.equal(false);

            await client.destroy();
        });

        describe('LegacySessionAuth', function () {
            it('should fail auth if session is invalid', async function() {
                this.timeout(40000);
        
                const authFailCallback = sinon.spy();
                const qrCallback = sinon.spy();
                const readyCallback = sinon.spy();
        
                const client = helper.createClient({
                    options: {
                        authStrategy: new LegacySessionAuth({
                            session: {
                                WABrowserId: 'invalid', 
                                WASecretBundle: 'invalid', 
                                WAToken1: 'invalid', 
                                WAToken2: 'invalid'
                            },
                            restartOnAuthFail: false,
                        }),
                    }
                });
        
                client.on('qr', qrCallback);
                client.on('auth_failure', authFailCallback);
                client.on('ready', readyCallback);
        
                client.initialize();
        
                await helper.sleep(25000);
        
                expect(authFailCallback.called).to.equal(true);
                expect(authFailCallback.args[0][0]).to.equal('Unable to log in. Are the session details valid?');
        
                expect(readyCallback.called).to.equal(false);
                expect(qrCallback.called).to.equal(false);
        
                await client.destroy();
            });
        
            it('can restart without a session if session was invalid and restartOnAuthFail=true', async function() {
                this.timeout(40000);
        
                const authFailCallback = sinon.spy();
                const qrCallback = sinon.spy();
        
                const client = helper.createClient({
                    options: {
                        authStrategy: new LegacySessionAuth({
                            session: {
                                WABrowserId: 'invalid', 
                                WASecretBundle: 'invalid', 
                                WAToken1: 'invalid', 
                                WAToken2: 'invalid'
                            },
                            restartOnAuthFail: true,
                        }),
                    }
                });
        
                client.on('auth_failure', authFailCallback);
                client.on('qr', qrCallback);
        
                client.initialize();
        
                await helper.sleep(35000);
        
                expect(authFailCallback.called).to.equal(true);
                expect(qrCallback.called).to.equal(true);
                expect(qrCallback.args[0][0]).to.have.length.greaterThanOrEqual(152);
        
                await client.destroy();
            });
        });

        describe('Non-MD only', function () {
            if(!isMD) {
                it('can take over if client was logged in somewhere else with takeoverOnConflict=true', async function() {
                    this.timeout(40000);
    
                    const readyCallback1 = sinon.spy();
                    const readyCallback2 = sinon.spy();
                    const disconnectedCallback1 = sinon.spy();
                    const disconnectedCallback2 = sinon.spy();
    
                    const client1 = helper.createClient({
                        authenticated: true, 
                        options: { takeoverOnConflict: true, takeoverTimeoutMs: 5000 }
                    });
                    const client2 = helper.createClient({authenticated: true});
    
                    client1.on('ready', readyCallback1);
                    client2.on('ready', readyCallback2);
                    client1.on('disconnected', disconnectedCallback1);
                    client2.on('disconnected', disconnectedCallback2);
    
                    await client1.initialize();
                    expect(readyCallback1.called).to.equal(true);
                    expect(readyCallback2.called).to.equal(false);
                    expect(disconnectedCallback1.called).to.equal(false);
                    expect(disconnectedCallback2.called).to.equal(false);
    
                    await client2.initialize();
                    expect(readyCallback2.called).to.equal(true);
                    expect(disconnectedCallback1.called).to.equal(false);
                    expect(disconnectedCallback2.called).to.equal(false);
    
                    // wait for takeoverTimeoutMs to kick in
                    await helper.sleep(5200);
                    expect(disconnectedCallback1.called).to.equal(false);
                    expect(disconnectedCallback2.called).to.equal(true);
                    expect(disconnectedCallback2.calledWith(WAState.CONFLICT)).to.equal(true);
    
                    await client1.destroy();
                });
            }
        }); 
    });

    describe('Authenticated', function() {
        let client;

        before(async function() {
            this.timeout(35000);
            client = helper.createClient({authenticated: true});
            await client.initialize();
        });

        after(async function () {
            await client.destroy();
        });

        it('can get current WhatsApp Web version', async function () {
            const version = await client.getWWebVersion();
            expect(typeof version).to.equal('string');
            console.log(`WA Version: ${version}`);
        });

        describe('Expose Store', function() {
            it('exposes the store', async function() {
                const exposed = await client.pupPage.evaluate(() => {
                    return Boolean(window.Store);
                });
    
                expect(exposed).to.equal(true);
            });
    
            it('exposes all required WhatsApp Web internal models', async function() {
                const expectedModules = [
                    'AppState',
                    'BlockContact',
                    'Call',
                    'Chat',
                    'ChatState',
                    'Cmd',
                    'Conn',
                    'Contact',
                    'DownloadManager',
                    'EphemeralFields',
                    'Features',
                    'GroupMetadata',
                    'GroupParticipants',
                    'GroupUtils',
                    'Invite',
                    'InviteInfo',
                    'JoinInviteV4',
                    'Label',
                    'MediaObject',
                    'MediaPrep',
                    'MediaTypes',
                    'MediaUpload',
                    'MessageInfo',
                    'Msg',
                    'MsgKey',
                    'OpaqueData',
                    'QueryOrder',
                    'QueryProduct',
                    'PresenceUtils',
                    'ProfilePic',
                    'QueryExist',
                    'QueryProduct',
                    'QueryOrder',
                    'SendClear',
                    'SendDelete',
                    'SendMessage',
                    'SendSeen',
                    'StatusUtils',
                    'UploadUtils',
                    'UserConstructor',
                    'VCard',
                    'Validators',
                    'WidFactory',
                    'findCommonGroups',
                    'sendReactionToMsg',
                ];
              
                const loadedModules = await client.pupPage.evaluate((expectedModules) => {
                    return expectedModules.filter(m => Boolean(window.Store[m]));
                }, expectedModules);
    
                expect(loadedModules).to.have.members(expectedModules);
            });
        });
    
        describe('Send Messages', function () {            
            it('can send a message', async function() {
                const msg = await client.sendMessage(remoteId, 'hello world');
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.TEXT);
                expect(msg.fromMe).to.equal(true);
                expect(msg.body).to.equal('hello world');
                expect(msg.to).to.equal(remoteId);
            });
    
            it('can send a media message', async function() {
                const media = new MessageMedia(
                    'image/png', 
                    'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII='
                );
    
                const msg = await client.sendMessage(remoteId, media, {caption: 'here\'s my media'});
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.IMAGE);
                expect(msg.fromMe).to.equal(true);
                expect(msg.hasMedia).to.equal(true);
                expect(msg.body).to.equal('here\'s my media');
                expect(msg.to).to.equal(remoteId);
            });

            it('can send a media message from URL', async function() {
                const media = await MessageMedia.fromUrl('https://via.placeholder.com/350x150.png');
    
                const msg = await client.sendMessage(remoteId, media);
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.IMAGE);
                expect(msg.fromMe).to.equal(true);
                expect(msg.hasMedia).to.equal(true);
                expect(msg.to).to.equal(remoteId);
            });
    
            it('can send a media message as a document', async function() {
                const media = new MessageMedia(
                    'image/png', 
                    'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII=',
                    'this is my filename.png'
                );
    
                const msg = await client.sendMessage(remoteId, media, { sendMediaAsDocument: true});
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.DOCUMENT);
                expect(msg.fromMe).to.equal(true);
                expect(msg.hasMedia).to.equal(true);
                expect(msg.body).to.equal('this is my filename.png');
                expect(msg.to).to.equal(remoteId);
            });

            it('can send media messages as voice', async function() {
                const media = new MessageMedia(
                    'audio/ogg; codecs=opus',
                    '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',
                );
    
                const msg = await client.sendMessage(remoteId, media, { sendAudioAsVoice: true});
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.VOICE);
                expect(msg.fromMe).to.equal(true);
                expect(msg.hasMedia).to.equal(true);
                expect(msg.to).to.equal(remoteId);
            });
    
            it('can send a sticker message', async function() {
                const media = new MessageMedia(
                    'image/png', 
                    'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII='
                );
    
                const msg = await client.sendMessage(remoteId, media, {sendMediaAsSticker: true});
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.STICKER);
                expect(msg.fromMe).to.equal(true);
                expect(msg.hasMedia).to.equal(true);
                expect(msg.to).to.equal(remoteId);
            });
    
            it('can send a sticker message with custom author and name', async function() {
                const media = new MessageMedia(
                    'image/png', 
                    'iVBORw0KGgoAAAANSUhEUgAAAV4AAACWBAMAAABkyf1EAAAAG1BMVEXMzMyWlpacnJyqqqrFxcWxsbGjo6O3t7e+vr6He3KoAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEcElEQVR4nO2aTW/bRhCGh18ij1zKknMkbbf2UXITIEeyMhIfRaF1exQLA/JRclslRykO+rs7s7s0VwytNmhJtsA8gHZEcox9PTs7uysQgGEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmEYhmGYr2OWRK/ReIKI8Zt7Hb19wTcQ0uTkGh13bQupcw7gPOvdo12/5CzNtNR7xLUtNtT3CGBQ6g3InjY720pvofUec22LJPr8PhEp2OMPyI40PdwWUdronCu9yQpdPx53bQlfLKnfOVhlnDYRBXve4Ov+IZTeMgdedm0NR+xoXJeQvdJ3CvziykSukwil16W/Oe7aGjIjqc/9ib4jQlJy0uArtN4A0+cvXFvDkmUJ47sJ1Y1ATLDNVXZkNPIepQzxy1ki9fqiwbUj/I+64zxWNzyZnPuhvohJ9K70VvXBixpcu2SAHU+Xd9EKdEJDNpYP3AQr3bQSpPQ6Y6/4dl1z7ZDbArsszjA7L0g7ibB0CDcidUWVoErvIMKZh2Xs0LUzcLW6V5NfiUgNEbaYmAVL6bXl0nJRc+1S72ua/D/cTjGPlQj7eUqd7A096rYlRjdPYlhz7VIvxpVG3cemDKF+WAwLY/6XelOZKTXXzsC4xvDjjtSN6kHLhLke6PrwM8h1raf40qjrGO7H9aTEbduucjS04ZrYU/4iuS5Z2Hdt0rvCLFdmLEXcU30AGddST62o+sLcf5l6k7CP+ru4pLYqX/VFyxbm/utQbx/r22ZEbTb2f5I2kns1Y1OQR8ZyofX+TjJxj1Rz7QQVnf1QzR26Oth0ueJVYcRP6ZUPac/Rx/5M6ixO1dhSrT3Y1DpiYmx3tF4ZUdpz9LD/dSg9PXES0LB71BwcGjKROuV28lnvnv7HHJsezheBGH5+X2CfSfRbMKW+5aGs3JFjMrjGibJc0S7TJzqjHrh2hDybj9XRXNZa89Aro55XBdbW5wti2c/5WJ7jJ1RolVUn/HWpb0I58Tziup6Rx7Dm2hnbRP1GM9PW/NFmQ4PtVRVN63Wvxfmu5sowDMMwDMMwDMMwDMMwDMMwDMMwzL+CpT//F/6beoV8zb2Jmt4Qryx6lTUCsENQ75HOkhXAO3EPVgyQtKtUy3C/e+FJg17Zjnew1Xrdb9InbG4WqfUAftG+WhLwPVyfg536+MU7m4C1CMk4ZznpXZzDYI1PDL2nS1hpvc5cNd7E2sJg05Fe7/7d3Fln8Cvc3bwB616auxsKl4WPghjemHrDqyDWeu1UNW5s2btPnSQ75oOdunEwWazfwgVG0kqluYCM9OIjWOGnfA2b9G4Ha63XKpvQ8perTvTifJNhi6+WMWmi7smEZf6G8MmhlyGq+NqP8GV84TLuJr7UIQVx+bDEoEpRZIz42gs40OuN4Mv8hXzelV7KX1isH+ewTWckikyVv+CfHuqVF7I16gN0VKypX6wPsE+zFPzkinolU9UH8OMGvSpnZqKsv13p/RsMun6X5x/y2LeAr8O66lsBwzBMP/wJfyGq8pgBk6IAAAAASUVORK5CYII='
                );
    
                const msg = await client.sendMessage(remoteId, media, {
                    sendMediaAsSticker: true, 
                    stickerAuthor: 'WWEBJS', 
                    stickerName: 'My Sticker'
                });
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.STICKER);
                expect(msg.fromMe).to.equal(true);
                expect(msg.hasMedia).to.equal(true);
                expect(msg.to).to.equal(remoteId);
            });
    
            it('can send a location message', async function() {
                const location = new Location(37.422, -122.084, 'Googleplex\nGoogle Headquarters');
    
                const msg = await client.sendMessage(remoteId, location);
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.LOCATION);
                expect(msg.fromMe).to.equal(true);
                expect(msg.to).to.equal(remoteId);
    
                expect(msg.location).to.be.instanceOf(Location);
                expect(msg.location.latitude).to.equal(37.422);
                expect(msg.location.longitude).to.equal(-122.084);
                expect(msg.location.description).to.equal('Googleplex\nGoogle Headquarters');
            });
    
            it('can send a vCard as a contact card message', async function() {
                const vCard = `BEGIN:VCARD
VERSION:3.0
FN;CHARSET=UTF-8:John Doe
N;CHARSET=UTF-8:Doe;John;;;
EMAIL;CHARSET=UTF-8;type=HOME,INTERNET:john@doe.com
TEL;TYPE=HOME,VOICE:1234567890
REV:2021-06-06T02:35:53.559Z
END:VCARD`;
    
                const msg = await client.sendMessage(remoteId, vCard);
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.CONTACT_CARD);
                expect(msg.fromMe).to.equal(true);
                expect(msg.to).to.equal(remoteId);
                expect(msg.body).to.equal(vCard);
                expect(msg.vCards).to.have.lengthOf(1);
                expect(msg.vCards[0]).to.equal(vCard);
            });
    
            it('can optionally turn off vCard parsing', async function() {
                const vCard = `BEGIN:VCARD
VERSION:3.0
FN;CHARSET=UTF-8:John Doe
N;CHARSET=UTF-8:Doe;John;;;
EMAIL;CHARSET=UTF-8;type=HOME,INTERNET:john@doe.com
TEL;TYPE=HOME,VOICE:1234567890
REV:2021-06-06T02:35:53.559Z
END:VCARD`;
    
                const msg = await client.sendMessage(remoteId, vCard, {parseVCards: false});
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.TEXT); // not a contact card
                expect(msg.fromMe).to.equal(true);
                expect(msg.to).to.equal(remoteId);
                expect(msg.body).to.equal(vCard);
            });
    
            it('can send a Contact as a contact card message', async function() {
                const contact = await client.getContactById(remoteId);
    
                const msg = await client.sendMessage(remoteId, contact);
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.CONTACT_CARD);
                expect(msg.fromMe).to.equal(true);
                expect(msg.to).to.equal(remoteId);
                expect(msg.body).to.match(/BEGIN:VCARD/);
                expect(msg.vCards).to.have.lengthOf(1);
                expect(msg.vCards[0]).to.match(/BEGIN:VCARD/);
            });
    
            it('can send multiple Contacts as a contact card message', async function () {
                const contact1 = await client.getContactById(remoteId);
                const contact2 = await client.getContactById('5511942167462@c.us'); //iFood
    
                const msg = await client.sendMessage(remoteId, [contact1, contact2]);
                expect(msg).to.be.instanceOf(Message);
                expect(msg.type).to.equal(MessageTypes.CONTACT_CARD_MULTI);
                expect(msg.fromMe).to.equal(true);
                expect(msg.to).to.equal(remoteId);
                expect(msg.vCards).to.have.lengthOf(2);
                expect(msg.vCards[0]).to.match(/BEGIN:VCARD/);
                expect(msg.vCards[1]).to.match(/BEGIN:VCARD/);
            });
        });
    
        describe('Get Chats', function () {    
            it('can get a chat by its ID', async function () {
                const chat = await client.getChatById(remoteId);
                expect(chat).to.be.instanceOf(Chat);
                expect(chat.id._serialized).to.eql(remoteId);
                expect(chat.isGroup).to.eql(false);
            });
    
            it('can get all chats', async function () {
                const chats = await client.getChats();
                expect(chats.length).to.be.greaterThanOrEqual(1);
    
                const chat = chats.find(c => c.id._serialized === remoteId);
                expect(chat).to.exist;
                expect(chat).to.be.instanceOf(Chat);
            });
        });

        describe('Get Contacts', function () {    
            it('can get a contact by its ID', async function () {
                const contact = await client.getContactById(remoteId);
                expect(contact).to.be.instanceOf(Contact);
                expect(contact.id._serialized).to.eql(remoteId);
                expect(contact.number).to.eql(remoteId.split('@')[0]);
            });
    
            it('can get all contacts', async function () {
                const contacts = await client.getContacts();
                expect(contacts.length).to.be.greaterThanOrEqual(1);
    
                const contact = contacts.find(c => c.id._serialized === remoteId);
                expect(contact).to.exist;
                expect(contact).to.be.instanceOf(Contact);
            });

            it('can block a contact', async function () {
                const contact = await client.getContactById(remoteId);
                await contact.block();

                const refreshedContact = await client.getContactById(remoteId);
                expect(refreshedContact.isBlocked).to.eql(true);
            });

            it('can get a list of blocked contacts', async function () {
                const blockedContacts = await client.getBlockedContacts();
                expect(blockedContacts.length).to.be.greaterThanOrEqual(1);

                const contact = blockedContacts.find(c => c.id._serialized === remoteId);
                expect(contact).to.exist;
                expect(contact).to.be.instanceOf(Contact);

            });

            it('can unblock a contact', async function () {
                const contact = await client.getContactById(remoteId);
                await contact.unblock();

                const refreshedContact = await client.getContactById(remoteId);
                expect(refreshedContact.isBlocked).to.eql(false);
            });
        });

        describe('Numbers and Users', function () {
            it('can verify that a user is registered', async function () {
                const isRegistered = await client.isRegisteredUser(remoteId);
                expect(isRegistered).to.be.true;
            });

            it('can verify that a user is not registered', async function () {
                const isRegistered = await client.isRegisteredUser('9999999999@c.us');
                expect(isRegistered).to.be.false;
            });

            it('can get a number\'s whatsapp id', async function () {
                const number = remoteId.split('@')[0];
                const numberId = await client.getNumberId(number);
                expect(numberId).to.eql({
                    server: 'c.us',
                    user: number,
                    _serialized: `${number}@c.us`
                });
            });

            it('returns null when getting an unregistered number\'s whatsapp id', async function () {
                const number = '9999999999';
                const numberId = await client.getNumberId(number);
                expect(numberId).to.eql(null);
            });

            it('can get a number\'s country code', async function () {
                const number = '18092201111';
                const countryCode = await client.getCountryCode(number);
                expect(countryCode).to.eql('1');
            });

            it('can get a formatted number', async function () {
                const number = '18092201111';
                const formatted = await client.getFormattedNumber(number);
                expect(formatted).to.eql('+1 (809) 220-1111');
            });

            it('can get a formatted number from a serialized ID', async function () {
                const number = '18092201111@c.us';
                const formatted = await client.getFormattedNumber(number);
                expect(formatted).to.eql('+1 (809) 220-1111');
            });
        });

        describe('Search messages', function () {
            it('can search for messages', async function () {
                const m1 = await client.sendMessage(remoteId, 'I\'m searching for Super Mario Brothers');
                const m2 = await client.sendMessage(remoteId, 'This also contains Mario');
                const m3 = await client.sendMessage(remoteId, 'Nothing of interest here, just Luigi');
                
                // wait for search index to catch up
                await helper.sleep(1000);
                
                const msgs = await client.searchMessages('Mario', {chatId: remoteId});
                expect(msgs.length).to.be.greaterThanOrEqual(2);
                const msgIds = msgs.map(m => m.id._serialized);
                expect(msgIds).to.include.members([
                    m1.id._serialized, m2.id._serialized
                ]);
                expect(msgIds).to.not.include.members([m3.id._serialized]);
            });
        });

        describe('Status/About', function () {
            let me, previousStatus;

            before(async function () {
                me = await client.getContactById(client.info.wid._serialized);
                previousStatus = await me.getAbout();
            });

            after(async function () {
                await client.setStatus(previousStatus);
            });
            
            it('can set the status text', async function () {
                await client.setStatus('My shiny new status');

                const status = await me.getAbout();
                expect(status).to.eql('My shiny new status');
            });

            it('can set the status text to something else', async function () {
                await client.setStatus('Busy');
                
                const status = await me.getAbout();
                expect(status).to.eql('Busy');
            });
        });
    });
});
