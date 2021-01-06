'use strict';

const Chat = require('./Chat');

/**
 * Group participant information
 * @typedef {Object} GroupParticipant
 * @property {ContactId} id
 * @property {boolean} isAdmin
 * @property {boolean} isSuperAdmin
 */

/**
 * Represents a Group Chat on WhatsApp
 * @extends {Chat}
 */
class GroupChat extends Chat {
    _patch(data) {
        this.groupMetadata = data.groupMetadata;

        return super._patch(data);
    }

    /**
     * Gets the group owner
     * @type {ContactId}
     */
    get owner() {
        return this.groupMetadata.owner;
    }
    
    /**
     * Gets the date at which the group was created
     * @type {date}
     */
    get createdAt() {
        return new Date(this.groupMetadata.creation * 1000);
    }

    /** 
     * Gets the group description
     * @type {string}
     */
    get description() {
        return this.groupMetadata.desc;
    }

    /**
     * Gets the group participants
     * @type {Array<GroupParticipant>}
     */
    get participants() {
        return this.groupMetadata.participants;
    }

    /**
     * Adds a list of participants by ID to the group
     * @param {Array<string>} participantIds 
     * @returns {Promise<Object>}
     */
    async addParticipants(participantIds) {
        return await this.client.pupPage.evaluate((chatId, participantIds) => {
            return window.Store.Wap.addParticipants(chatId, participantIds);
        }, this.id._serialized, participantIds);
    }

    /**
     * Removes a list of participants by ID to the group
     * @param {Array<string>} participantIds 
     * @returns {Promise<Object>}
     */
    async removeParticipants(participantIds) {
        return await this.client.pupPage.evaluate((chatId, participantIds) => {
            return window.Store.Wap.removeParticipants(chatId, participantIds);
        }, this.id._serialized, participantIds);
    }

    /**
     * Promotes participants by IDs to admins
     * @param {Array<string>} participantIds 
     * @returns {Promise<{ status: number }>} Object with status code indicating if the operation was successful
     */
    async promoteParticipants(participantIds) {
        return await this.client.pupPage.evaluate((chatId, participantIds) => {
            return window.Store.Wap.promoteParticipants(chatId, participantIds);
        }, this.id._serialized, participantIds);
    }

    /**
     * Demotes participants by IDs to regular users
     * @param {Array<string>} participantIds 
     * @returns {Promise<{ status: number }>} Object with status code indicating if the operation was successful
     */
    async demoteParticipants(participantIds) {
        return await this.client.pupPage.evaluate((chatId, participantIds) => {
            return window.Store.Wap.demoteParticipants(chatId, participantIds);
        }, this.id._serialized, participantIds);
    }

    /**
     * Updates the group subject
     * @param {string} subject 
     * @returns {Promise} 
     */
    async setSubject(subject) {
        let res = await this.client.pupPage.evaluate((chatId, subject) => {
            return window.Store.Wap.changeSubject(chatId, subject);
        }, this.id._serialized, subject);

        if(res.status == 200) {
            this.name = subject;
        }
    }

    /**
     * Updates the group description
     * @param {string} description 
     * @returns {Promise} 
     */
    async setDescription(description) {
        let res = await this.client.pupPage.evaluate((chatId, description) => {
            let descId = window.Store.GroupMetadata.get(chatId).descId;
            return window.Store.Wap.setGroupDescription(chatId, description, window.Store.genId(), descId);
        }, this.id._serialized, description);

        if (res.status == 200) {
            this.groupMetadata.desc = description;
        }
    }

    /**
     * Updates the group settings to only allow admins to send messages.
     * @param {boolean} [adminsOnly=true] Enable or disable this option 
     * @returns {Promise<boolean>} Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setMessagesAdminsOnly(adminsOnly=true) {
        let res = await this.client.pupPage.evaluate((chatId, value) => {
            return window.Store.Wap.setGroupProperty(chatId, 'announcement', value);
        }, this.id._serialized, adminsOnly);

        if (res.status !== 200) return false;
        
        this.groupMetadata.announce = adminsOnly;
        return true;
    }

    /**
     * Updates the group settings to only allow admins to edit group info (title, description, photo).
     * @param {boolean} [adminsOnly=true] Enable or disable this option 
     * @returns {Promise<boolean>} Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setInfoAdminsOnly(adminsOnly=true) {
        let res = await this.client.pupPage.evaluate((chatId, value) => {
            return window.Store.Wap.setGroupProperty(chatId, 'restrict', value);
        }, this.id._serialized, adminsOnly);

        if (res.status !== 200) return false;
        
        this.groupMetadata.restrict = adminsOnly;
        return true;
    }

    /**
     * Gets the invite code for a specific group
     * @returns {Promise<string>} Group's invite code
     */
    async getInviteCode() {
        let res = await this.client.pupPage.evaluate(chatId => {
            return window.Store.Wap.groupInviteCode(chatId);
        }, this.id._serialized);

        if (res.status == 200) {
            return res.code;
        } 

        throw new Error('Not authorized');
    }
    
    /**
     * Invalidates the current group invite code and generates a new one
     * @returns {Promise}
     */
    async revokeInvite() {
        return await this.client.pupPage.evaluate(chatId => {
            return window.Store.Wap.revokeGroupInvite(chatId);
        }, this.id._serialized);
    }

    /**
     * Makes the bot leave the group
     * @returns {Promise}
     */
    async leave() {
        return await this.client.pupPage.evaluate(chatId => {
            return window.Store.Wap.leaveGroup(chatId);
        }, this.id._serialized);
    }

}

module.exports = GroupChat;