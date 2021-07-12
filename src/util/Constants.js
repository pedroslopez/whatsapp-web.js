'use strict';

exports.WhatsWebURL = 'https://web.whatsapp.com/';

exports.DefaultOptions = {
    puppeteer: {
        headless: true,
        defaultViewport: null
    },
    session: false,
    qrTimeoutMs: 45000,
    qrRefreshIntervalMs: 20000,
    authTimeoutMs: 45000,
    takeoverOnConflict: false,
    takeoverTimeoutMs: 0,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36',
    ffmpegPath: 'ffmpeg',
    bypassCSP: false
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
    MESSAGE_ACK: 'message_ack',
    MEDIA_UPLOADED: 'media_uploaded',
    GROUP_JOIN: 'group_join',
    GROUP_LEAVE: 'group_leave',
    GROUP_UPDATE: 'group_update',
    QR_RECEIVED: 'qr',
    DISCONNECTED: 'disconnected',
    STATE_CHANGED: 'change_state',
    BATTERY_CHANGED: 'change_battery',
    INCOMING_CALL: 'incoming_call'
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
    ORDER: 'order',
    REVOKED: 'revoked',
    PRODUCT: 'product',
    UNKNOWN: 'unknown',
    GROUP_INVITE: 'groups_v4_invite'
};

/**
 * Group notification types
 * @readonly
 * @enum {string}
 */
exports.GroupNotificationTypes = {
    ADD: 'add',
    INVITE: 'invite',
    REMOVE: 'remove',
    LEAVE: 'leave',
    SUBJECT: 'subject',
    DESCRIPTION: 'description',
    PICTURE: 'picture',
    ANNOUNCE: 'announce',
    RESTRICT: 'restrict',
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

/**
 * Message ACK
 * @readonly
 * @enum {number}
 */
exports.MessageAck = {
    ACK_ERROR: -1,
    ACK_PENDING: 0,
    ACK_SERVER: 1,
    ACK_DEVICE: 2,
    ACK_READ: 3,
    ACK_PLAYED: 4,
};
