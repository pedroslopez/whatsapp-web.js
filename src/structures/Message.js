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
        this.body = data.body;
        this.type = data.type;
        this.timestamp = data.t;
        this.from = data.from;
        this.to = data.to;
        this.author = data.author;
        this.isForwarded = data.isForwarded;
        this.broadcast = data.broadcast;

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
        
        return await this.client.pupPage.evaluate((chatId, quotedMessageId, message) => {
            let quotedMessage = Store.Msg.get(quotedMessageId);
            if(quotedMessage.canReply()) {
                const chat = Store.Chat.get(chatId);
                chat.composeQuotedMsg = quotedMessage;
                chat.sendMessage(message, {quotedMsg: quotedMessage});
                chat.composeQuotedMsg = null;
            } else {
                throw new Error('This message cannot be replied to.');
            }
            
        }, chatId, this.id._serialized, message);
    }

    static get WAppModel() {
        return 'Msg';
    }

    static get extraFields() {
        return [
            'isNewMsg'
        ];
    }
}

module.exports = Message;