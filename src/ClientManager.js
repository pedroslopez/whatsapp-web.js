'use strict';

const puppeteer = require('puppeteer');

const Client = require('./Client');
const Util = require('./util/Util');
const { DefaultClientManagerOptions } = require('./util/Constants');

class ClientManager {
    constructor(options = {}) {
        this.clients = [];
        this.browser = null;
        this.options = Util.mergeDefault(DefaultClientManagerOptions, options);
        this.puppeteerOptions = options.puppeteer || {};
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized === true) {
            return;
        }

        if (this.isInitialized === false) {
            this.isInitialized = new Promise((resolve) => {
                const browserArgs = [...(this.puppeteerOptions.args || [])];
                
                if(!browserArgs.find(arg => arg.includes('--user-agent'))) {
                    browserArgs.push(`--user-agent=${this.options.userAgent}`);
                }
                // navigator.webdriver fix
                browserArgs.push('--disable-blink-features=AutomationControlled');
                
                puppeteer.launch({...this.puppeteerOptions, args: browserArgs}).then((browser) => {
                    this.browser = browser;
                    resolve(true);
                });
            });
        }

        this.isInitialized = await this.isInitialized;
    }

    async createClient(options = {}) {
        this.isInitialized = await this.isInitialized;
        if (this.isInitialized !== true) {
            throw new Error('Client manager has not initialized');
        }

        const client = new Client({
            ...options,
            puppeteer: {
                ...this.puppeteerOptions,
                browserWSEndpoint: this.browser.wsEndpoint(),
            }
        });
        this.clients.push(client);
        return client;
    }
}

module.exports = ClientManager;