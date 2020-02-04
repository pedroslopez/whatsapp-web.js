'use strict';

const Base = require('./Base');
const MessageMedia = require('./MessageMedia');

/**
 * Represents a Message on WhatsApp
 * @extends {Base}
 */
class Message extends Base {
    constructor(client, data) {
        super(client);

        if(data) this._patch(data);
    }

    _patch(data) {
        this.id = data.id;
        this.hasMedia = data.clientUrl ? true : false;
        this.body = this.hasMedia ? data.caption || '' : data.body || '';
        this.type = data.type;
        this.timestamp = data.t;
        this.from = typeof (data.from) === 'object' ? data.from._serialized : data.from;
        this.to = typeof (data.to) === 'object' ? data.to._serialized : data.to;
        this.author = typeof (data.author) === 'object' ? data.author._serialized : data.author;
        this.isForwarded = data.isForwarded;
        this.broadcast = data.broadcast;
        this.fromMe = data.id.fromMe;
        this.hasQuotedMsg = data.quotedMsg ? true : false;

        return super._patch(data);
    }

    _getChatId() {
        return this.fromMe ? this.to : this.from;
    }

    /**
     * Returns the Chat this message was sent in
     * @returns {Chat}
     */
    getChat() {
        return this.client.getChatById(this._getChatId());
    }

    /**
     * Returns the Contact this message was sent from
     * @returns {Contact}
     */
    getContact() {
        return this.client.getContactById(this._getChatId());
    }

    /**
     * Returns the quoted message, if any
     * @returns {Message}
     */
    async getQuotedMessage() {
        if (!this.hasQuotedMsg) return undefined;

        const quotedMsg = await this.client.pupPage.evaluate((msgId) => {
            let msg = window.Store.Msg.get(msgId);
            return msg.quotedMsgObj().serialize();
        }, this.id._serialized);

        return new Message(this.client, quotedMsg);
    }

    /**
     * Sends a message as a reply. If chatId is specified, it will be sent 
     * through the specified Chat. If not, it will send the message 
     * in the same Chat as the original message was sent.
     * 
     * @param {string|MessageMedia} content 
     * @param {?string} chatId 
     * @param {object} options
     * @returns {Message}
     */
    async reply(content, chatId, options={}) {
        if (!chatId) {
            chatId = this._getChatId();
        }

        options = {
            ...options,
            quotedMessageId: this.id._serialized
        };

        return this.client.sendMessage(chatId, content, options);
    }

    /**
     * Downloads and returns the attatched message media
     * @returns {MessageMedia}
     */
    async downloadMedia() {
        if (!this.hasMedia) {
            return undefined;
        }

        const {data, mimetype, filename} = await this.client.pupPage.evaluate(async (msgId) => {
            const msg = window.Store.Msg.get(msgId);
            const buffer = await window.WWebJS.downloadBuffer(msg.clientUrl);
            const decrypted = await window.Store.CryptoLib.decryptE2EMedia(msg.type, buffer, msg.mediaKey, msg.mimetype);
            const data = await window.WWebJS.readBlobAsync(decrypted._blob);
            
            return {
                data: data.split(',')[1],
                mimetype: msg.mimetype,
                filename: msg.filename
            };

        }, this.id._serialized);

        return new MessageMedia(mimetype, data, filename);
    }
}

module.exports = Message;