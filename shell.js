/**
 * ==== wwebjs-shell ====
 * Used for quickly testing library features
 * 
 * Running `npm run shell` will start WhatsApp Web with headless=false
 * and then drop you into Node REPL with `client` in its context. 
 */
/**
 * @fileOverview A script for initializing a WhatsApp Web client.
 * @module wwebjs-shell
 */

const repl = require('repl');
const { Client, LocalAuth } = require('./index');

/**
 * Configuration options.
 */
const config = {
    puppeteer: {
        headless: false,
    },
    authStrategy: new LocalAuth(),
};

/**
 * Initialize and run WhatsApp Web with headless=false and a Node REPL.
 */
async function initializeWhatsAppWeb() {
    try {
        const client = new Client(config);
        console.log('Initializing...');

        client.on('qr', () => {
            console.log('Please scan the QR code on the browser.');
        });

        client.on('authenticated', (session) => {
            console.log(JSON.stringify(session));
        });

        client.on('ready', () => {
            const shell = repl.start('wwebjs> ');
            shell.context.client = client;
            shell.on('exit', handleExit);
        });

        await client.initialize();
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

/**
 * Handle the 'exit' event by destroying the client.
 */
async function handleExit() {
    try {
        await client.destroy();
    } catch (error) {
        console.error('An error occurred while destroying the client:', error);
    }
}

// Initialize WhatsApp Web
initializeWhatsAppWeb();
