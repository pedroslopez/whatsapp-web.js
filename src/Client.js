'use strict';

const EventEmitter = require('events');
const puppeteer = require('puppeteer');
const moduleRaid = require('moduleraid/moduleraid');

const Util = require('./util/Util');
const { WhatsWebURL, UserAgent, DefaultOptions, Events } = require('./util/Constants');
const { ExposeStore, LoadExtraProps, LoadCustomSerializers } = require('./util/Injected');
const ChatFactory = require('./factories/ChatFactory');
const Chat = require('./structures/Chat');
const Message = require('./structures/Message');

/**
 * Starting point for interacting with the WhatsApp Web API
 * @extends {EventEmitter}
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
        const page = await browser.newPage();
        page.setUserAgent(UserAgent);

        if(this.options.session) {
            await page.evaluateOnNewDocument (
                session => {
                    localStorage.clear();
                    localStorage.setItem("WABrowserId", session.WABrowserId);
                    localStorage.setItem("WASecretBundle", session.WASecretBundle);
                    localStorage.setItem("WAToken1", session.WAToken1);
                    localStorage.setItem("WAToken2", session.WAToken2);
            }, this.options.session);
        }
        
        await page.goto(WhatsWebURL);

        const KEEP_PHONE_CONNECTED_IMG_SELECTOR = '._1wSzK';

        if(this.options.session) {
            // Check if session restore was successfull 
            try {
                await page.waitForSelector(KEEP_PHONE_CONNECTED_IMG_SELECTOR, {timeout: 5000});
            } catch(err) {
                if(err.name === 'TimeoutError') {
                    this.emit(Events.AUTHENTICATION_FAILURE, 'Unable to log in. Are the session details valid?');
                    browser.close();

                    return;
                } 

                throw err;
            }
           
       } else {
            // Wait for QR Code

            const QR_CONTAINER_SELECTOR = '._2d3Jz';
            const QR_VALUE_SELECTOR = '._1pw2F';

            await page.waitForSelector(QR_CONTAINER_SELECTOR);

            const qr = await page.$eval(QR_VALUE_SELECTOR, node => node.getAttribute('data-ref'));
            this.emit(Events.QR_RECEIVED, qr);

            // Wait for code scan
            await page.waitForSelector(KEEP_PHONE_CONNECTED_IMG_SELECTOR, {timeout: 0});
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
        }

        this.emit(Events.AUTHENTICATED, session);

        // Check Store Injection
        await page.waitForFunction('window.Store != undefined');
        
        //Load extra serialized props
        const models = [Message];
        for (let model of models) {
            await page.evaluate(LoadExtraProps, model.WAppModel, model.extraFields);
        }

        await page.evaluate(LoadCustomSerializers);

        // Register events
        await page.exposeFunction('onAddMessageEvent', msg => {
            if (msg.id.fromMe || !msg.isNewMsg) return;
            this.emit(Events.MESSAGE_CREATE, new Message(this, msg));
        });

        await page.exposeFunction('onConnectionChangedEvent', (conn, connected) => {
            if (!connected) {
                this.emit(Events.DISCONNECTED);
                this.destroy();
            }
        })

        await page.evaluate(() => {
            Store.Msg.on('add', onAddMessageEvent);
            Store.Conn.on('change:connected', onConnectionChangedEvent);
        })

        this.pupBrowser = browser;
        this.pupPage = page;

        this.emit(Events.READY);
    }

    async destroy() {
        await this.pupBrowser.close();
    }

    /**
     * Send a message to a specific chatId
     * @param {string} chatId
     * @param {string} message 
     */
    async sendMessage(chatId, message) {
        await this.pupPage.evaluate((chatId, message) => {
            Store.SendMessage(Store.Chat.get(chatId), message);
        }, chatId, message)
    }

    /**
     * Get all current chat instances
     */
    async getChats() {
        // let chats = await this.pupPage.evaluate(() => {
        //     return Store.Chat.serialize()
        // });

        // return chats.map(chatData => ChatFactory.create(this, chatData));
        throw new Error('NOT IMPLEMENTED')
    }

    /**
     * Get chat instance by ID
     * @param {string} chatId 
     */
    async getChatById(chatId) {
        let chat = await this.pupPage.evaluate(chatId => {
            return WWebJS.getChat(chatId);
        }, chatId);

        return ChatFactory.create(this, chat);
    }

}

module.exports = Client;
