'use strict';

const EventEmitter = require('events');
const puppeteer = require('puppeteer');
const Util = require('../util/Util');
const { WhatsWebURL, UserAgent, DefaultOptions, Events } = require('../util/Constants');
const { ExposeStore, LoadExtraProps } = require('../util/Injected');
const Chat = require('../models/Chat');
const Message = require('../models/Message')

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

    async initialize() {
        const browser = await puppeteer.launch(this.options.puppeteer);
        const page = await browser.newPage();
        page.setUserAgent(UserAgent);

        await page.goto(WhatsWebURL);
        await page.evaluate(ExposeStore);

        await page.waitForSelector('._1jjYO');  // Wait for QR Code
        const qr = await page.$eval('._2EZ_m', node => node.getAttribute('data-ref'));
        
        this.emit(Events.QR_RECEIVED, qr);

        // Wait for Auth
        await page.waitForSelector('._2Uo0Z', {timeout: 0});
        this.emit(Events.AUTHENTICATED);

        // Check Store Injection
        await page.waitForFunction('window.Store != undefined');
        
        // Load extra serialized props
        const models = [Chat, Message];
        for (let model of models) {
            await page.evaluate(LoadExtraProps, model.WAppModel, model.extraFields);
        }

        await page.exposeFunction('onAddMessageEvent', (msg) => {
            if (msg.id.fromMe) return;

            this.emit('message', new Message(this, msg));
        });

        await page.evaluate(() => {
            Store.Msg.on('add', onAddMessageEvent);
        })

        this.pupBrowser = browser;
        this.pupPage = page;

        this.emit(Events.READY);
    }

    async destroy() {
        await this.pupBrowser.close();
    }

    async sendMessage(chatId, message) {
        await this.pupPage.evaluate((chatId, message) => {
            Store.Chat.get(chatId).sendMessage(message);
        }, chatId, message)
    }

    async getChatById(chatId) {
        let chat = await this.pupPage.evaluate(chatId => {
            return Store.Chat.get(chatId).serialize();
        }, chatId);
        
        return new Chat(this, chat);
    }

     
}

module.exports = Client;