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
        this.from = data.from;
        this.to = data.to;
        this.author = data.author;
        this.isForwarded = data.isForwarded;
        this.broadcast = data.broadcast;
        this.fromMe = data.id.fromMe;

        return super._patch(data);
    }

    /**
     * Returns the Chat this message was sent in
     */
    getChat() {
        return this.client.getChatById(this.from);
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
            chatId = this.from;
        }
        
        const newMessage = await this.client.pupPage.evaluate(async (chatId, quotedMessageId, message) => {
            let quotedMessage = Store.Msg.get(quotedMessageId);
            if(quotedMessage.canReply()) {
                const chat = Store.Chat.get(chatId);
                const newMessage = await WWebJS.sendMessage(chat, message, quotedMessage.msgContextInfo(chat));
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
            const msg = Store.Msg.get(msgId);
            const buffer = await WWebJS.downloadBuffer(msg.clientUrl);
            const decrypted = await Store.CryptoLib.decryptE2EMedia(msg.type, buffer, msg.mediaKey, msg.mimetype);
            const data = await WWebJS.readBlobAsync(decrypted._blob);
            
            return {
                data,
                mimetype: msg.mimetype,
                filename: msg.filename
            }

        }, this.id._serialized);
    }
}

module.exports = Message;