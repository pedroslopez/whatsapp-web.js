'use strict';

const Base = require('./Base');

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
     */
    getChat() {
        return this.client.getChatById(this._getChatId());
    }

    /**
     * Returns the Contact this message was sent from
     */
    getContact() {
        return this.client.getContactById(this._getChatId());
    }

    /**
     * Returns the quoted message, if any
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
     * @param {string} message 
     * @param {?string} chatId 
     */
    async reply(message, chatId) {
        if (!chatId) {
            chatId = this._getChatId();
        }
        
        const newMessage = await this.client.pupPage.evaluate(async (chatId, quotedMessageId, message) => {
            let quotedMessage = window.Store.Msg.get(quotedMessageId);
            if(quotedMessage.canReply()) {
                const chat = window.Store.Chat.get(chatId);
                const newMessage = await window.WWebJS.sendMessage(chat, message, quotedMessage.msgContextInfo(chat));
                return newMessage.serialize();
            } else {
                throw new Error('This message cannot be replied to.');
            }
        }, chatId, this.id._serialized, message);

        return new Message(this.client, newMessage);
    }

    async downloadMedia() {
        if (!this.hasMedia) {
            return undefined;
        }

        return await this.client.pupPage.evaluate(async (msgId) => {
            const msg = window.Store.Msg.get(msgId);
            const buffer = await window.WWebJS.downloadBuffer(msg.clientUrl);
            const decrypted = await window.Store.CryptoLib.decryptE2EMedia(msg.type, buffer, msg.mediaKey, msg.mimetype);
            const data = await window.WWebJS.readBlobAsync(decrypted._blob);
            
            return {
                data,
                mimetype: msg.mimetype,
                filename: msg.filename
            };

        }, this.id._serialized);
    }
}

module.exports = Message;