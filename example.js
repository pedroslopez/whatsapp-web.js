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

    if (msg.body == 'ping reply') {
        // Send a new message as a reply to the current one
        msg.reply('pong');

    } else if (msg.body == 'ping') {
        // Send a new message to the same chat
        client.sendMessage(msg.from, 'pong');
    }
})

