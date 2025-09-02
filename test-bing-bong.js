const { Client, LocalAuth } = require('./index');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: false,
    },
});

// Initialize the client
client.initialize();

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', async (qr) => {
    console.log('QR RECEIVED - Scan this QR code with your WhatsApp app');
    console.log('QR Code:', qr);
});

client.on('code', (code) => {
    console.log('Pairing code:', code);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED - Successfully logged in!');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', async () => {
    console.log('READY - Bot is now online and listening for messages!');
    console.log('Bot will reply to all messages with "bing" and "bong"');
    
    // Get client info
    const info = client.info;
    console.log(`Connected as: ${info.pushname} (${info.wid.user})`);
});

client.on('message', async msg => {
    console.log('MESSAGE RECEIVED:', msg.body);
    console.log('From:', msg.from);
    console.log('Type:', msg.type);
    
    // Reply to all messages with "bing" and "bong"
    try {
        // Send "bing" as a reply to the message
        await msg.reply('bing');
        console.log('Sent: bing');
        
        // Send "bong" to the same chat
        await client.sendMessage(msg.from, 'bong');
        console.log('Sent: bong');
        
        // Mark message as read
        const chat = await msg.getChat();
        await chat.sendSeen();
        console.log('Marked message as read');
        
    } catch (error) {
        console.error('Error sending reply:', error);
    }
});

client.on('message_create', async (msg) => {
    // Handle messages created by the bot itself
    if (msg.fromMe) {
        console.log('Bot sent message:', msg.body);
    }
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out:', reason);
});

client.on('change_state', state => {
    console.log('Connection state changed:', state);
});

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

console.log('Starting WhatsApp Bot...');
console.log('The bot will reply to all messages with "bing" and "bong"');
console.log('Make sure to scan the QR code when it appears...');
