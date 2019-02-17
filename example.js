const { Client } = require('./src')

const client = new Client({puppeteer: {headless: false}});

client.initialize();

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('ready', () => {
    console.log('READY');
});

client.on('message', (msg) => {
    console.log('MESSAGE RECEIVED', msg);

    if (!msg.id.fromMe && msg.body == 'ping') {
        client.sendMessage(msg.from, 'pong');
    }
})

