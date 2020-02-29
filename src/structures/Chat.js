'use strict';

const Base = require('./Base');

/**
 * Represents a Chat on WhatsApp
 * @extends {Base}
 */
class Chat extends Base {
    constructor(client, data) {
        super(client);

        if(data) this._patch(data);
    }

    _patch(data) {
        /**
         * ID that represents the chat
         * @type {object}
         */
        this.id = data.id;

        /**
         * Title of the chat
         * @type {string}
         */
        this.name = data.formattedTitle;

        /**
         * Indicates if the Chat is a Group Chat
         * @type {boolean}
         */
        this.isGroup = data.isGroup;

        /**
         * Indicates if the Chat is readonly
         * @type {boolean}
         */
        this.isReadOnly = data.isReadOnly;

        /**
         * Amount of messages unread
         * @type {number}
         */
        this.unreadCount = data.unreadCount;

        /**
         * Unix timestamp for when the chat was created
         * @type {number}
         */
        this.timestamp = data.t;

        /**
         * Indicates if the Chat is archived
         * @type {boolean}
         */
        this.archived = data.archive;

        return super._patch(data);
    }

    /**
     * Send a message to this chat
     * @param {string|MessageMedia|Location} content
     * @param {object} options 
     * @returns {Promise<Message>} Message that was just sent
     */
    async sendMessage(content, options) {
        return this.client.sendMessage(this.id._serialized, content, options);
    }

    /**
     * Clears all messages from the chat
     * @returns {Promise<Boolean>} result
     */
    async clearMessages() {
        return this.client.pupPage.evaluate(chatId => {
            return window.WWebJS.sendClearChat(chatId);
        }, this.id._serialized);
    }

    /**
     * Deletes the chat
     * @returns {Promise<Boolean>} result
     */
    async delete() {
        return this.client.pupPage.evaluate(chatId => {
            return window.WWebJS.sendDeleteChat(chatId);
        }, this.id._serialized);
    }

    /**
     * Archives this chat
     */
    async archive() {
        return this.client.archiveChat(this.id._serialized);
    }

    /**
     * un-archives this chat
     */
    async unarchive() {
        return this.client.unarchiveChat(this.id._serialized);
    }
   
    /**
     * Simulate typing in chat. This will last for 25 seconds.
     */
    async sendStateTyping() {
        return this.client.pupPage.evaluate(chatId => {
            window.WWebJS.sendChatstate('typing', chatId);
            return true;
        }, this.id._serialized);        
    }
    
    /**
     * Simulate recording audio in chat. This will last for 25 seconds.
     */
    async sendStateRecording() {
        return this.client.pupPage.evaluate(chatId => {
            window.WWebJS.sendChatstate('recording', chatId);
            return true;
        }, this.id._serialized);        
    }

    /**
     * Stops typing or recording in chat immediately.
     */
    async clearState() {
        return this.client.pupPage.evaluate(chatId => {
            window.WWebJS.sendChatstate('stop', chatId);
            return true;
        }, this.id._serialized);        
    }
}

module.exports = Chat;
