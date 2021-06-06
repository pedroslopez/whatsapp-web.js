const {expect} = require('chai');
const sinon = require('sinon');

const Client = require('../src/Client');
const helper = require('./helper');

const session = require('../___session.json');

describe('Client initialization', function() {
    describe('Authentication', function() {
        it('should emit QR code if not authenticated', async function() {
            this.timeout(25000);
            const callback = sinon.spy();

            const client = new Client();
            client.on('qr', callback);
            client.initialize();

            await helper.sleep(20000);

            expect(callback.called).to.equal(true);
            expect(callback.args[0][0]).to.have.lengthOf(152);

            await client.destroy();
        });

        it('should fail auth if session is invalid', async function() {
            this.timeout(40000);

            const authFailCallback = sinon.spy();
            const qrCallback = sinon.spy();
            const readyCallback = sinon.spy();

            const client = new Client({
                session: {
                    WABrowserId: 'invalid', 
                    WASecretBundle: 'invalid', 
                    WAToken1: 'invalid', 
                    WAToken2: 'invalid'
                },
                authTimeoutMs: 10000,
                restartOnAuthFail: false
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

            const client = new Client({
                session: {
                    WABrowserId: 'invalid', 
                    WASecretBundle: 'invalid', 
                    WAToken1: 'invalid', 
                    WAToken2: 'invalid'
                },
                authTimeoutMs: 10000,
                restartOnAuthFail: true
            });

            client.on('auth_failure', authFailCallback);
            client.on('qr', qrCallback);

            client.initialize();

            await helper.sleep(35000);

            expect(authFailCallback.called).to.equal(true);
            expect(qrCallback.called).to.equal(true);
            expect(qrCallback.args[0][0]).to.have.lengthOf(152);

            await client.destroy();
        });
        
        it('should authenticate with existing session', async function() {
            this.timeout(40000);

            const authenticatedCallback = sinon.spy();
            const qrCallback = sinon.spy();
            const readyCallback = sinon.spy();

            const client = new Client({session});
            client.on('qr', qrCallback);
            client.on('authenticated', authenticatedCallback);
            client.on('ready', readyCallback);

            client.initialize();

            await helper.sleep(25000);

            expect(authenticatedCallback.called).to.equal(true);
            const newSession = authenticatedCallback.args[0][0];
            expect(newSession).to.have.key([
                'WABrowserId', 
                'WASecretBundle', 
                'WAToken1', 
                'WAToken2'
            ]);
            expect(authenticatedCallback.called).to.equal(true);
            expect(readyCallback.called).to.equal(true);
            expect(qrCallback.called).to.equal(false);

            await client.destroy();
        });   
    });

    describe('Expose Store', function() {
        let client;

        before(async function() {
            this.timeout(35000);
            client = new Client({session});
            await client.initialize();
        });

        after(async function () {
            await client.destroy();
        });

        it('exposes the store', async function() {
            const exposed = await client.pupPage.evaluate(() => {
                return Boolean(window.Store);
            });

            expect(exposed).to.equal(true);
        });

        it('exposes all required WhatsApp Web internal models', async function() {
            const expectedModules = [
                'Chat',
                'Msg',
                'Conn', 
                'CryptoLib', 
                'Wap', 
                'SendSeen', 
                'SendClear', 
                'SendDelete', 
                'genId', 
                'SendMessage', 
                'MsgKey', 
                'Invite', 
                'OpaqueData', 
                'MediaPrep', 
                'MediaObject', 
                'MediaUpload',
                'Cmd',
                'MediaTypes',
                'VCard',
                'UserConstructor',
                'Validators',
                'WidFactory',
                'BlockContact',
                'GroupMetadata',
                'Sticker',
                'UploadUtils',
                'Label',
                'Features',
                'QueryOrder',
                'QueryProduct',
            ];  
          
            const loadedModules = await client.pupPage.evaluate(() => {
                return Object.keys(window.Store);
            });

            expect(loadedModules).to.include.members(expectedModules);
        });
    });
});