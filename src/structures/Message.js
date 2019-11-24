'use strict';

const Contact = require('./Contact');
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
	    this.mentions = [];

	    if (data.mentionedJidList) {
		    for (let i = 0; i < data.mentionedJidList.length; i++) {
			    //let contact = this.getContact(data.mentionedJidList[i]);
			    let contact = data.mentionedJidList[i];
			    this.mentions.push(contact)
		    }
	    }

	    return super._patch(data);
    }

    /**
     * Returns the Chat this message was sent in
     */
    getChat() {
        return this.client.getChatById(this.from);
    }

    /**
     * Returns the Contact this message was sent from
     */
    getContact() {

    	let input = this.author;
    	if (this.author) {
	        input = this.from;
	    }
        return this.client.getContactById(input);
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
                window.Store.SendMessage(chat, message, {quotedMsg: quotedMessage});
                chat.composeQuotedMsg = null;
            } else {
                throw new Error('This message cannot be replied to.');
            }
            
        }, chatId, this.id._serialized, message);
    }
}

module.exports = Message;