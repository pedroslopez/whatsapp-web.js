[![npm](https://img.shields.io/npm/v/whatsapp-web.js.svg)](https://www.npmjs.com/package/whatsapp-web.js) [![Depfu](https://badges.depfu.com/badges/4a65a0de96ece65fdf39e294e0c8dcba/overview.svg)](https://depfu.com/github/pedroslopez/whatsapp-web.js?project_id=9765) ![WhatsApp_Web 0.4.613](https://img.shields.io/badge/WhatsApp_Web-0.4.613-brightgreen.svg)

# whatsapp-web.js
A WhatsApp API client that connects through the WhatsApp Web browser app

It uses Puppeteer to run a real instance of Whatsapp Web to avoid getting blocked.

**NOTE:** I can't guarantee you will not be blocked by using this method, although it has worked for me. WhatsApp does not allow bots or unofficial clients on their platform, so this shouldn't be considered totally safe.

## Installation

The module is now available on npm! `npm i whatsapp-web.js`

Please note that Node v8+ is required due to Puppeteer.

## Example usage

```js
const { Client } = require('whatsapp-web.js');
const client = new Client();

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize();
```

Take a look at [example.js](https://github.com/pedroslopez/whatsapp-web.js/blob/master/example.js) for another example with more use cases.

## Supported features

| Feature  | Status |
| ------------- | ------------- |
| Send messages  | ✅  |
| Receive messages  | ✅  |
| Send media (images/audio/documents)  | ✅  |
| Send media (video)  | _pending_  |
| Send stickers | _pending_ |
| Receive media (images/audio/video/documents)  | ✅  |
| Send contact cards | _pending_ |
| Send location | ✅ |
| Receive location | ✅ | 
| Message replies | ✅ |
| Join groups by invite  | ✅ |
| Get invite for group  | ✅ |
| Modify group info (subject, description)  | ✅  |
| Add group participants  | ✅  |
| Kick group participants  | ✅  |
| Promote/demote group participants | ✅ |
| Mention users | ✅ |
| Get contact info | ✅ |
| Get profile pictures | ✅ |
| Set user status message | ✅ |

Something missing? Make an issue and let us know!

## Links

* [Documentation](https://pedroslopez.me/whatsapp-web.js) _(preview)_
* [GitHub](https://github.com/pedroslopez/whatsapp-web.js)

## Contributing

Pull requests are welcome! If you see something you'd like to add, please do. For drastic changes, please open an issue first.
