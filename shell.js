/**
 * ==== wwebjs-shell ====
 * Used for quickly testing library features
 * 
 * Running `npm run shell` will start WhatsApp Web with headless=false
 * and then drop you into Node REPL with `client` in its context. 
 */

const repl = require('repl');

const { Client, LocalAuth } = require('./index');

const client = new Client({
    puppeteer: { headless: false }, 
    authStrategy: new LocalAuth()
});

console.log('Initializing...');

client.initialize();

client.on('qr', () => {
    console.log('Please scan the QR code on the browser.');
});

client.on('authenticated', (session) => {
    console.log(JSON.stringify(session));
});

client.on('ready', () => {
    const shell = repl.start('wwebjs> ');
    shell.context.client = client;
    shell.on('exit', async () => {
        await client.destroy();
    });
});
