'use strict';

const EventEmitter = require('events');
const puppeteer = require('puppeteer');
const Util = require('./util/Util');
const { WhatsWebURL, UserAgent, DefaultOptions, Events } = require('./util/Constants');
const { ExposeStore, LoadExtraProps, LoadCustomSerializers } = require('./util/Injected');
const ChatFactory = require('./factories/ChatFactory');
const Chat = require('./structures/Chat');
const Message = require('./structures/Message')

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

        await page.goto(WhatsWebURL);
        await page.evaluate(ExposeStore);

        // Wait for QR Code
        await page.waitForSelector('._1jjYO');
        const qr = await page.$eval('._2EZ_m', node => node.getAttribute('data-ref'));
        
        this.emit(Events.QR_RECEIVED, qr);

        // Wait for Auth
        await page.waitForSelector('._2Uo0Z', {timeout: 0});
        this.emit(Events.AUTHENTICATED);

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
            Store.Chat.get(chatId).sendMessage(message);
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