'use strict';

const EventEmitter = require('events');
const puppeteer = require('puppeteer');
const moduleRaid = require('moduleraid/moduleraid');
const jsQR = require('jsqr');

const Util = require('./util/Util');
const { WhatsWebURL, UserAgent, DefaultOptions, Events, WAState } = require('./util/Constants');
const { ExposeStore, LoadUtils } = require('./util/Injected');
const ChatFactory = require('./factories/ChatFactory');
const ContactFactory = require('./factories/ContactFactory');
const ClientInfo = require('./structures/ClientInfo');
const Message = require('./structures/Message');
const MessageMedia = require('./structures/MessageMedia');
const Location = require('./structures/Location');

/**
 * Starting point for interacting with the WhatsApp Web API
 * @extends {EventEmitter}
 * @fires Client#qr
 * @fires Client#authenticated
 * @fires Client#auth_failure
 * @fires Client#ready
 * @fires Client#message
 * @fires Client#message_create
 * @fires Client#message_revoke_me
 * @fires Client#message_revoke_everyone
 * @fires Client#disconnected
 * @fires Client#change_state
 */
class Client extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = Util.mergeDefault(DefaultOptions, options);

        this.pupBrowser = null;
        this.pupPage = null;
    }

    /**
     * Sets up events and requirements, kicks off authentication request
     */
    async initialize() {
        const browser = await puppeteer.launch(this.options.puppeteer);
        const page = (await browser.pages())[0];
        page.setUserAgent(UserAgent);

        if (this.options.session) {
            await page.evaluateOnNewDocument(
                session => {
                    localStorage.clear();
                    localStorage.setItem('WABrowserId', session.WABrowserId);
                    localStorage.setItem('WASecretBundle', session.WASecretBundle);
                    localStorage.setItem('WAToken1', session.WAToken1);
                    localStorage.setItem('WAToken2', session.WAToken2);
                }, this.options.session);
        }

        await page.goto(WhatsWebURL);

        const KEEP_PHONE_CONNECTED_IMG_SELECTOR = '[data-asset-intro-image="true"]';

        if (this.options.session) {
            // Check if session restore was successfull 
            try {
                await page.waitForSelector(KEEP_PHONE_CONNECTED_IMG_SELECTOR, { timeout: 15000 });
            } catch (err) {
                if (err.name === 'TimeoutError') {
                    /**
                     * Emitted when there has been an error while trying to restore an existing session
                     * @event Client#auth_failure
                     * @param {string} message
                     */
                    this.emit(Events.AUTHENTICATION_FAILURE, 'Unable to log in. Are the session details valid?');
                    browser.close();

                    return;
                }

                throw err;
            }

        } else {
            // Wait for QR Code
            const QR_CANVAS_SELECTOR = 'canvas';
            await page.waitForSelector(QR_CANVAS_SELECTOR);
            const qrImgData = await page.$eval(QR_CANVAS_SELECTOR, canvas => [].slice.call(canvas.getContext('2d').getImageData(0, 0, 264, 264).data));
            const qr = jsQR(qrImgData, 264, 264).data;

            /**
             * Emitted when the QR code is received
             * @event Client#qr
             * @param {string} qr QR Code
             */
            this.emit(Events.QR_RECEIVED, qr);

            // Wait for code scan
            await page.waitForSelector(KEEP_PHONE_CONNECTED_IMG_SELECTOR, { timeout: 0 });
        }

        await page.evaluate(ExposeStore, moduleRaid.toString());

        // Get session tokens
        const localStorage = JSON.parse(await page.evaluate(() => {
            return JSON.stringify(window.localStorage);
        }));

        const session = {
            WABrowserId: localStorage.WABrowserId,
            WASecretBundle: localStorage.WASecretBundle,
            WAToken1: localStorage.WAToken1,
            WAToken2: localStorage.WAToken2
        };

        /**
         * Emitted when authentication is successful
         * @event Client#authenticated
         * @param {object} session Object containing session information. Can be used to restore the session.
         */
        this.emit(Events.AUTHENTICATED, session);

        // Check window.Store Injection
        await page.waitForFunction('window.Store != undefined');

        //Load util functions (serializers, helper functions)
        await page.evaluate(LoadUtils);

        // Expose client info
        this.info = new ClientInfo(this, await page.evaluate(() => {
            return window.Store.Conn.serialize();
        }));

        // Register events
        await page.exposeFunction('onAddMessageEvent', msg => {
            if (!msg.isNewMsg) return;

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

        await page.exposeFunction('onAppStateChangedEvent', (_AppState, state) => {

            /**
             * Emitted when the connection state changes
             * @event Client#change_state
             * @param {WAState} state the new connection state
             */
            this.emit(Events.STATE_CHANGED, state);

            const ACCEPTED_STATES = [WAState.CONNECTED, WAState.OPENING, WAState.PAIRING, WAState.TIMEOUT];
            if (!ACCEPTED_STATES.includes(state)) {
                /**
                 * Emitted when the client has been disconnected
                 * @event Client#disconnected
                 * @param {WAState} reason state that caused the disconnect
                 */
                this.emit(Events.DISCONNECTED, state);
                this.destroy();
            }
        });

        await page.evaluate(() => {
            window.Store.Msg.on('add', window.onAddMessageEvent);
            window.Store.Msg.on('change', window.onChangeMessageEvent);
            window.Store.Msg.on('change:type', window.onChangeMessageTypeEvent);
            window.Store.Msg.on('remove', window.onRemoveMessageEvent);
            window.Store.AppState.on('change:state', window.onAppStateChangedEvent);
        });

        this.pupBrowser = browser;
        this.pupPage = page;

        /**
         * Emitted when the client has initialized and is ready to receive messages.
         * @event Client#ready
         */
        this.emit(Events.READY);
    }

    /**
     * Closes the client
     */
    async destroy() {
        await this.pupBrowser.close();
    }

    /**
     * Send a message to a specific chatId
     * @param {string} chatId
     * @param {string|MessageMedia|Location} content
     * @param {object} options 
     * @returns {Promise<Message>} Message that was just sent
     */
    async sendMessage(chatId, content, options = {}) {
        let internalOptions = {
            caption: options.caption,
            quotedMessageId: options.quotedMessageId,
            mentionedJidList: Array.isArray(options.mentions) ? options.mentions.map(contact => contact.id._serialized) : []
        };

        if (content instanceof MessageMedia) {
            internalOptions.attachment = content;
            content = '';
        } else if (options.media instanceof MessageMedia) {
            internalOptions.attachment = options.media;
            internalOptions.caption = content;
        } else if (content instanceof Location) {
            internalOptions.location = content;
            content = '';
        }

        const newMessage = await this.pupPage.evaluate(async (chatId, message, options) => {
            let chat = window.Store.Chat.get(chatId);
            let msg;
            if (!chat) { // The chat is not available in the previously chatted list

                //todo : Check if the number is a whatsapp enabled. Whatsapp web sends query exists via ws.
                chat = window.Store.Chat.models[0]; //get the topmost chat object and assign the new chatId to it
                let originalChatObjId = chat.id;
                chat.id = typeof originalChatObjId === 'string' ? chatId : new window.Store.UserConstructor(chatId, { intentionallyUsePrivateConstructor: true });
                msg = await window.WWebJS.sendMessage(chat, message, options);
                chat.id = originalChatObjId; //replace the chat with its original id
            }
            else
                msg = await window.WWebJS.sendMessage(chat, message, options);
            return msg.serialize();
        }, chatId, content, internalOptions);

        return new Message(this, newMessage);
    }


    /**
     * Get all current chat instances
     * @returns {Promise<Array<Chat>>}
     */
    async getChats() {
        let chats = await this.pupPage.evaluate(() => {
            return window.WWebJS.getChats();
        });

        return chats.map(chat => ChatFactory.create(this, chat));
    }

    /**
     * Get chat instance by ID
     * @param {string} chatId 
     * @returns {Promise<Chat>}
     */
    async getChatById(chatId) {
        let chat = await this.pupPage.evaluate(chatId => {
            return window.WWebJS.getChat(chatId);
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

    /**
     * Accepts an invitation to join a group
     * @param {string} inviteCode Invitation code
     */
    async acceptInvite(inviteCode) {
        const chatId = await this.pupPage.evaluate(async inviteCode => {
            return await window.Store.Invite.sendJoinGroupViaInvite(inviteCode);
        }, inviteCode);

        return chatId._serialized;
    }

    /**
     * Sets the current user's status message
     * @param {string} status New status message
     */
    async setStatus(status) {
        await this.pupPage.evaluate(async status => {
            return await window.Store.Wap.sendSetStatus(status);
        }, status);
    }

    /**
     * Gets the current connection state for the client
     * @returns {WAState} 
     */
    async getState() {
        return await this.pupPage.evaluate(() => {
            return window.Store.AppState.state;
        });
    }

}

module.exports = Client;
