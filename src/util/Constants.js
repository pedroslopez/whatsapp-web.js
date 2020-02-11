'use strict';

exports.WhatsWebURL = 'https://web.whatsapp.com/';

exports.UserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36';

exports.DefaultOptions = {
    puppeteer: {
        headless: true
    },
    session: false
};

/**
 * Client status
 * @readonly
 * @enum {number}
 */
exports.Status = {
    INITIALIZING: 0,
    AUTHENTICATING: 1,
    READY: 3
};

/**
 * Events that can be emitted by the client
 * @readonly
 * @enum {string}
 */
exports.Events = {
    AUTHENTICATED: 'authenticated',
    AUTHENTICATION_FAILURE: 'auth_failure',
    READY: 'ready',
    MESSAGE_RECEIVED: 'message',
    MESSAGE_CREATE: 'message_create',
    MESSAGE_REVOKED_EVERYONE: 'message_revoke_everyone',
    MESSAGE_REVOKED_ME: 'message_revoke_me',
    QR_RECEIVED: 'qr',
    DISCONNECTED: 'disconnected',
    STATE_CHANGED: 'change_state'
};

/**
 * Message types
 * @readonly
 * @enum {string}
 */
exports.MessageTypes = {
    TEXT: 'chat',
    AUDIO: 'audio',
    VOICE: 'ptt',
    IMAGE: 'image',
    VIDEO: 'video',
    DOCUMENT: 'document',
    STICKER: 'sticker',
    LOCATION: 'location',
    CONTACT_CARD: 'vcard',
    CONTACT_CARD_MULTI: 'multi_vcard',
    REVOKED: 'revoked',
    UNKNOWN: 'unknown'
};

/**
 * Chat types
 * @readonly
 * @enum {string}
 */
exports.ChatTypes = {
    SOLO: 'solo',
    GROUP: 'group',
    UNKNOWN: 'unknown'
};

/**
 * WhatsApp state
 * @readonly
 * @enum {string}
 */
exports.WAState = {
    CONFLICT: 'CONFLICT',
    CONNECTED: 'CONNECTED',
    DEPRECATED_VERSION: 'DEPRECATED_VERSION',
    OPENING: 'OPENING',
    PAIRING: 'PAIRING',
    PROXYBLOCK: 'PROXYBLOCK',
    SMB_TOS_BLOCK: 'SMB_TOS_BLOCK',
    TIMEOUT: 'TIMEOUT',
    TOS_BLOCK: 'TOS_BLOCK',
    UNLAUNCHED: 'UNLAUNCHED',
    UNPAIRED: 'UNPAIRED',
    UNPAIRED_IDLE: 'UNPAIRED_IDLE'
};