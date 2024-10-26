'use strict';

const Base = require('./Base');
const Message = require('./Message');

/**
 * Represents a Chat on WhatsApp
 * @extends {Base}
 */
class Chat extends Base {
    constructor(client, data) {
        super(client);

        if (data) this._patch(data);
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
         * Unix timestamp for when the last activity occurred
         * @type {number}
         */
        this.timestamp = data.t;

        /**
         * Indicates if the Chat is archived
         * @type {boolean}
         */
        this.archived = data.archive;

        /**
         * Indicates if the Chat is pinned
         * @type {boolean}
         */
        this.pinned = !!data.pin;

        /**
         * Indicates if the chat is muted or not
         * @type {boolean}
         */
        this.isMuted = data.isMuted;

        /**
         * Unix timestamp for when the mute expires
         * @type {number}
         */
        this.muteExpiration = data.muteExpiration;

        /**
         * Last message fo chat
         * @type {Message}
         */
        this.lastMessage = data.lastMessage ? new Message(this.client, data.lastMessage) : undefined;
        
        return super._patch(data);
    }

    /**
     * Send a message to this chat
     * @param {string|MessageMedia|Location} content
     * @param {MessageSendOptions} [options] 
     * @returns {Promise<Message>} Message that was just sent
     */
    async sendMessage(content, options) {
        return this.client.sendMessage(this.id._serialized, content, options);
    }

    /**
     * Set the message as seen
     * @returns {Promise<Boolean>} result
     */
    async sendSeen() {
        return this.client.sendSeen(this.id._serialized);
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
     * Pins this chat
     * @returns {Promise<boolean>} New pin state. Could be false if the max number of pinned chats was reached.
     */
    async pin() {
        return this.client.pinChat(this.id._serialized);
    }

    /**
     * Unpins this chat
     * @returns {Promise<boolean>} New pin state
     */
    async unpin() {
        return this.client.unpinChat(this.id._serialized);
    }

    /**
     * Mutes this chat forever, unless a date is specified
     * @param {?Date} unmuteDate Date at which the Chat will be unmuted, leave as is to mute forever
     */
    async mute(unmuteDate) {
        return this.client.muteChat(this.id._serialized, unmuteDate);
    }

    /**
     * Unmutes this chat
     */
    async unmute() {
        return this.client.unmuteChat(this.id._serialized);
    }

    /**
     * Mark this chat as unread
     */
    async markUnread(){
        return this.client.markChatUnread(this.id._serialized);
    }

    /**
     * Loads chat messages, sorted from earliest to latest.
     * @param {Object} searchOptions Options for searching messages. Right now only limit and fromMe is supported.
     * @param {Number} [searchOptions.limit] The amount of messages to return. If no limit is specified, the available messages will be returned. Note that the actual number of returned messages may be smaller if there aren't enough messages in the conversation. Set this to Infinity to load all messages.
     * @param {Boolean} [searchOptions.fromMe] Return only messages from the bot number or vise versa. To get all messages, leave the option undefined.
     * @returns {Promise<Array<Message>>}
     */
    async fetchMessages(searchOptions) {
        let messages = await this.client.pupPage.evaluate(async (chatId, searchOptions) => {
            const msgFilter = (m) => {
                if (m.isNotification) {
                    return false; // dont include notification messages
                }
                if (searchOptions && searchOptions.fromMe !== undefined && m.id.fromMe !== searchOptions.fromMe) {
                    return false;
                }
                return true;
            };

            const chat = await window.Store.Chat.find(chatId);
            let msgs = chat.msgs.getModelsArray().filter(msgFilter);

            if (searchOptions && searchOptions.limit > 0) {
                while (msgs.length < searchOptions.limit) {
                    const loadedMessages = await window.Store.ConversationMsgs.loadEarlierMsgs(chat);
                    if (!loadedMessages || !loadedMessages.length) break;
                    msgs = [...loadedMessages.filter(msgFilter), ...msgs];
                }
                
                if (msgs.length > searchOptions.limit) {
                    msgs.sort((a, b) => (a.t > b.t) ? 1 : -1);
                    msgs = msgs.splice(msgs.length - searchOptions.limit);
                }
            }

            return msgs.map(m => window.WWebJS.getMessageModel(m));

        }, this.id._serialized, searchOptions);

        return messages.map(m => new Message(this.client, m));
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

    /**
     * Returns the Contact that corresponds to this Chat.
     * @returns {Promise<Contact>}
     */
    async getContact() {
        return await this.client.getContactById(this.id._serialized);
    }

    /**
     * Returns array of all Labels assigned to this Chat
     * @returns {Promise<Array<Label>>}
     */
    async getLabels() {
        return this.client.getChatLabels(this.id._serialized);
    }

    /**
     * Add or remove labels to this Chat
     * @param {Array<number|string>} labelIds
     * @returns {Promise<void>}
     */
    async changeLabels(labelIds) {
        return this.client.addOrRemoveLabels(labelIds, [this.id._serialized]);
    }

    /**
     * Sets message expiration timer for the chat.
     * Valid values for passing to the method are:
     * 0 for message expiration removal,
     * 1 for 24 hours message expiration,
     * 2 for 7 days message expiration,
     * 3 for 90 days message expiration
     * @see https://faq.whatsapp.com/673193694148537
     * @param {number} value The value to set the message expiration for
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async setMessageExpiration(value) {
        switch (value) {
        case 0:
            value = 0;
            break;
        case 1:
            value = 86400;
            break;
        case 2:
            value = 604800;
            break;
        case 3:
            value = 7776000;
            break;
        default:
            throw new class SetMessageExpirationError extends Error {
                constructor(m) { super(m); }
            }(`Invalid message expiration value = ${value} is provided. Valid values are:\n0 for message expiration removal,\n1 for 24 hours message expiration,\n2 for 7 days message expiration,\n3 for 90 days message expiration`);
        }

        const result = await this.client.pupPage.evaluate(async (chatId, value) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = window.Store.Chat.get(chatWid);
            try {
                await window.Store.EphemeralFields.changeEphemeralDuration(chat, value);
                return true;
            } catch (err) {
                return false;
            }
        }, this.id._serialized, value);

        result && (this.ephemeralDuration = value);
        return result;
    }

    /**
     * Indicates if there are kept messages in that chat
     * @see https://faq.whatsapp.com/728928448599090
     * @returns {Promise<boolean>} True if there are kept messages in a chat, false otherwise
     */
    async hasKeptMessages() {
        return await this.client.hasKeptMessages(this.id._serialized);
    }

    /**
     * Gets kept messages from this chat, if any
     * @see https://faq.whatsapp.com/728928448599090
     * @returns {Promise<Message[]|[]>} An array of kept messages, or an empty array if no those
     */
    async getKeptMessages() {
        return await this.client.getKeptMessages(this.id._serialized);
    }

    /**
     * Sync chat history conversation
     * @return {Promise<boolean>} True if operation completed successfully, false otherwise.
     */
    async syncHistory() {
        return this.client.syncHistory(this.id._serialized);
    }
}

module.exports = Chat;
