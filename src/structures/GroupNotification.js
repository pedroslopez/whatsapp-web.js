'use strict';

const Base = require('./Base');

/**
 * Represents a GroupNotification on WhatsApp
 * @extends {Base}
 */
class GroupNotification extends Base {
    constructor(client, data) {
        super(client);

        if(data) this._patch(data);
    }

    _patch(data) {
        /**
         * ID that represents the groupNotification
         * @type {object}
         */
        this.id = data.id;

        /**
         * GroupNotification content
         * @type {string}
         */
        this.body = this.hasMedia ? data.caption || '' : data.body || '';

        /** 
         * GroupNotification type
         * @type {GroupNotificationTypes}
         */
        this.type = data.type;

        /**
         * GroupNotification Subtype
         * @type {GroupNotificationSubtypes}
         */
        this.subtype = data.subtype;
        
        /**
         * Unix timestamp for when the groupNotification was created
         * @type {number}
         */
        this.timestamp = data.t;

        /**
         * ID for the Chat that this groupNotification was sent to, except if the groupNotification was sent by the current user.
         * @type {string}
         */
        this.from = typeof (data.from) === 'object' ? data.from._serialized : data.from;

        /**
         * ID for who this groupNotification is for.
         * 
         * If the groupNotification is sent by the current user, it will be the Chat to which the groupNotification is being sent.
         * If the groupNotification is sent by another user, it will be the ID for the current user. 
         * @type {string}
         */
        this.to = typeof (data.to) === 'object' ? data.to._serialized : data.to;

        /**
         * If the groupNotification was sent to a group, this field will contain the user that sent the groupNotification.
         * @type {string}
         */
        this.author = typeof (data.author) === 'object' ? data.author._serialized : data.author;

        /** 
         * Indicates if the groupNotification was sent by the current user
         * @type {boolean}
         */
        this.fromMe = data.id.fromMe;
        
        /**
         * Indicates the Recipients of a GroupNotification.
         * @type {Array<string>}
         */
        this.recipientIds = [];

        if (data.recipients) {
            this.recipientIds = data.recipients;
        }

        return super._patch(data);
    }

    _getChatId() {
        return this.fromMe ? this.to : this.from;
    }

    /**
     * Returns the Chat this groupNotification was sent in
     * @returns {Promise<Chat>}
     */
    getChat() {
        return this.client.getChatById(this._getChatId());
    }

    /**
     * Returns the Contact this groupNotification was sent from
     * @returns {Promise<Contact>}
     */
    getContact() {
        return this.client.getContactById(this.author || this.from);
    }

    /**
     * Returns the Contacts mentioned in this groupNotification
     * @returns {Promise<Array<Contact>>}
     */
    async getRecipients() {
        return await Promise.all(this.recipientIds.map(async m => await this.client.getContactById(m)));
    }

    /**
     * Sends a message as a reply to this groupNotification. If chatId is specified, it will be sent 
     * through the specified Chat. If not, it will send the groupNotification 
     * in the same Chat as the original groupNotification was sent.
     * 
     * @param {string|MessageMedia|Location} content 
     * @param {?string} chatId 
     * @param {object} options
     * @returns {Promise<Message>}
     */
    async reply(content, chatId, options={}) {
        if (!chatId) {
            chatId = this._getChatId();
        }

        options = {
            ...options,
        };

        return this.client.sendMessage(chatId, content, options);
    }
    
}

module.exports = GroupNotification;
