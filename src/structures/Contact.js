'use strict';

const Base = require('./Base');

/**
 * Represents a Contact on WhatsApp
 * @extends {Base}
 */
class Contact extends Base {
    constructor(client, data) {
        super(client);

        if(data) this._patch(data);
    }

    _patch(data) {
        /**
         * ID that represents the contact
         * @type {object}
         */
        this.id = data.id;

        /**
         * Contact's phone number
         * @type {string}
         */
        this.number = data.userid;

        /**
         * Indicates if the contact is a business contact
         * @type {boolean}
         */
        this.isBusiness = data.isBusiness;

        /**
         * Indicates if the contact is an enterprise contact
         * @type {boolean}
         */
        this.isEnterprise = data.isEnterprise;

        this.labels = data.labels;

        /**
         * The contact's name, as saved by the current user
         * @type {?string}
         */
        this.name = data.name;

        /**
         * The name that the contact has configured to be shown publically
         * @type {string}
         */
        this.pushname = data.pushname;

        this.sectionHeader = data.sectionHeader;

        /**
         * A shortened version of name
         * @type {?string}
         */
        this.shortName = data.shortName;

        this.statusMute = data.statusMute;
        this.type = data.type;
        this.verifiedLevel = data.verifiedLevel;
        this.verifiedName = data.verifiedName;

        /**
         * Indicates if the contact is the current user's contact
         * @type {boolean}
         */
        this.isMe = data.isMe;

        /**
         * Indicates if the contact is a user contact
         * @type {boolean}
         */
        this.isUser = data.isUser;

        /**
         * Indicates if the contact is a group contact
         * @type {boolean}
         */
        this.isGroup = data.isGroup;

        /**
         * Indicates if the number is registered on WhatsApp
         * @type {boolean}
         */
        this.isWAContact = data.isWAContact;

        /**
         * Indicates if the number is saved in the current phone's contacts
         * @type {boolean}
         */
        this.isMyContact = data.isMyContact;

        /**
         * Indicates if you have blocked this contact
         * @type {boolean}
         */
        this.isBlocked = data.isBlocked;

        return super._patch(data);
    }

    /**
     * Returns the contact's profile picture URL, if privacy settings allow it
     * @returns {Promise<string>}
     */
    async getProfilePicUrl() {
        return await this.client.getProfilePicUrl(this.id._serialized);
    }

    /**
     * Returns the Chat that corresponds to this Contact. 
     * Will return null when getting chat for currently logged in user.
     * @returns {Promise<Chat>}
     */
    async getChat() {
        if(this.isMe) return null;

        return await this.client.getChatById(this.id._serialized);
    }

    /**
     * Blocks this contact from WhatsApp
     * @returns {Promise<boolean>}
     */
    async block() {
        if(this.isGroup) return false;

        await this.client.pupPage.evaluate(async (contactId) => {
            const contact = window.Store.Contact.get(contactId);
            await window.Store.BlockContact.blockContact(contact);
        }, this.id._serialized);

        return true;
    }

    /**
     * Unblocks this contact from WhatsApp
     * @returns {Promise<boolean>}
     */
    async unblock() {
        if(this.isGroup) return false;

        await this.client.pupPage.evaluate(async (contactId) => {
            const contact = window.Store.Contact.get(contactId);
            await window.Store.BlockContact.unblockContact(contact);
        }, this.id._serialized);

        return true;
    }
    
}

module.exports = Contact;