'use strict';

exports.WhatsWebURL = 'https://web.whatsapp.com/'

exports.UserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36';

exports.DefaultOptions = {
    puppeteer: {
        headless: true
    }
}

exports.Status = {
    INITIALIZING: 0,
    AUTHENTICATING: 1,
    READY: 3
}

exports.Events = {
    AUTHENTICATED: 'authenticated',
    READY: 'ready',
    MESSAGE_CREATE: 'message',
    QR_RECEIVED: 'qr'
}

exports.MessageTypes = {
    TEXT: 'chat',
    AUDIO: 'audio',
    VOICE: 'ptt',
    IMAGE: 'image',
    VIDEO: 'video',
    DOCUMENT: 'document',
    STICKER: 'sticker'
}

exports.ChatTypes = {
    SOLO: 'solo',
    GROUP: 'group',
    UNKNOWN: 'unknown'
}