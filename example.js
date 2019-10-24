const { Client } = require('./index')

const client = new Client({puppeteer: {headless: false}});
// You can use an existing session and avoid scanning a QR code by adding a "session" object to the client options.
// This object must include WABrowserId, WASecretBundle, WAToken1 and WAToken2.

client.initialize();

client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessfull
    console.error('AUTHENTICATION FAILURE', msg);
})

client.on('ready', () => {
    console.log('READY');
});

client.on('message', async msg => {
    console.log('MESSAGE RECEIVED', msg);

})

client.on('message_create', async (msg) => {
    // Fired on all message creations, including your own
    if(msg.fromMe) {
        let url = await msg.getContact(msg.body);
        console.log(await url.getProfileImageUrl())
    }
});

client.on('message_revoke_everyone', async (before, after) => {
    // Fired whenever a message is deleted by anyone (including you)
    console.log(before.body); // message before it was deleted.
    console.log(after.type); // message after it was deleted.
});

client.on('message_revoke_me', async (msg) => {
    // Fired whenever a message is only deleted in your own view.
    console.log(msg); // message before it was deleted.
});

client.on('disconnected', () => {
    console.log('Client was logged out');
})

