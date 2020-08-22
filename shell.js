/**
 * ==== wwebjs-shell ====
 * Used for quickly testing library features
 * 
 * Running `npm run shell` will start WhatsApp Web in headless mode 
 * and then drop you into Node REPL with `client` in its context. 
 */

const repl = require('repl');
const fs = require('fs');

const { Client } = require('./index');

const SESSION_FILE_PATH = './session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({
    puppeteer: { headless: false }, 
    session: sessionCfg 
});

console.log('Initializing...');

client.initialize();

client.on('qr', () => {
    console.log('Please scan the QR code on the browser.');
});

client.on('ready', () => {
    const shell = repl.start('wwebjs> ');
    shell.context.client = client;
    shell.on('exit', async () => {
        await client.destroy();
    });
});
