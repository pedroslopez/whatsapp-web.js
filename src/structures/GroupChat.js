'use strict';

const Chat = require('./Chat');
const Util = require('../util/Util');

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
     * Internal function to change a number of participant's state..
     * @param {string} type (promote|demote|add|remove) 
     */
    async _changeParticipants(participantIds, type, sleep = null) {
        return await this.client.pupPage.evaluate(async (chatId, participantIds, sleep) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const participantWids = participantIds.map(p => window.Store.WidFactory.createWid(p));
            const status = [];
            for (const participantWid of participantWids) {
                status.push(await window.Store.GroupParticipants.['send'+type.charAt(0).toUpperCase() + type.slice(1)+'Participants'](chatWid, [participantWid]));
                if (sleep) {
                    await Util.sleep(sleep);
                }
            }
            return status;
        }, this.id._serialized, participantIds, sleep);
    }

    /**
     * Adds a list of participants by ID to the group
     * @param {Array<string>} participantIds
     * @param {?number} sleep optional, amount to sleep in milliseconds before adding the next participant
     * @returns {Promise<Array<Object>>}
     */
    async addParticipants(participantIds, sleep = null) {
        return this._changeParticipants(participantIds, 'add', sleep);
    }

    /**
     * Removes a list of participants by ID to the group
     * @param {Array<string>} participantIds
     * @param {?number} sleep optional, amount to sleep in milliseconds before removing the next participant
     * @returns {Promise<Array<Object>>}
     */
    async removeParticipants(participantIds, sleep = null) {
        return return this._changeParticipants(participantIds, 'remove', sleep);
    }

    /**
     * Promote participants to admins by IDs
     * @param {Array<string>} participantIds
     * @param {?number} sleep optional, amount to sleep in milliseconds before promoting the next participant
     * @returns {Promise<Array<Object>>}
     */
    async promoteParticipants(participantIds, sleep = null) {
        return return this._changeParticipants(participantIds, 'promote', sleep);
    }

    /**
     * Demotes admins to regular participants by IDs 
     * @param {Array<string>} participantIds
     * @param {?number} sleep optional, amount to sleep in milliseconds before demoting the next participant
     * @returns {Promise<Array<Object>>}
     */
    async demoteParticipants(participantIds, sleep = null) {
        return return this._changeParticipants(participantIds, 'demote', sleep);
    }

    /**
     * Updates the group subject
     * @param {string} subject 
     * @returns {Promise<boolean>} Returns true if the subject was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setSubject(subject) {
        const success = await this.client.pupPage.evaluate(async (chatId, subject) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                return await window.Store.GroupUtils.sendSetGroupSubject(chatWid, subject);
            } catch (err) {
                if(err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, this.id._serialized, subject);

        if(!success) return false;
        this.name = subject;
        return true;
    }

    /**
     * Updates the group description
     * @param {string} description 
     * @returns {Promise<boolean>} Returns true if the description was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setDescription(description) {
        const success = await this.client.pupPage.evaluate(async (chatId, description) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            let descId = window.Store.GroupMetadata.get(chatWid).descId;
            try {
                return await window.Store.GroupUtils.sendSetGroupDescription(chatWid, description, window.Store.MsgKey.newId(), descId);
            } catch (err) {
                if(err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, this.id._serialized, description);

        if(!success) return false;
        this.groupMetadata.desc = description;
        return true;
    }
    
    /**
     * Updates the group settings to only allow admins to send messages.
     * @param {boolean} [adminsOnly=true] Enable or disable this option 
     * @returns {Promise<boolean>} Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setMessagesAdminsOnly(adminsOnly=true) {
        const success = await this.client.pupPage.evaluate(async (chatId, adminsOnly) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                return await window.Store.GroupUtils.sendSetGroupProperty(chatWid, 'announcement', adminsOnly ? 1 : 0);
            } catch (err) {
                if(err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, this.id._serialized, adminsOnly);

        if(!success) return false;

        this.groupMetadata.announce = adminsOnly;
        return true;
    }

    /**
     * Updates the group settings to only allow admins to edit group info (title, description, photo).
     * @param {boolean} [adminsOnly=true] Enable or disable this option 
     * @returns {Promise<boolean>} Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setInfoAdminsOnly(adminsOnly=true) {
        const success = await this.client.pupPage.evaluate(async (chatId, adminsOnly) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                return await window.Store.GroupUtils.sendSetGroupProperty(chatWid, 'restrict', adminsOnly ? 1 : 0);
            } catch (err) {
                if(err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, this.id._serialized, adminsOnly);

        if(!success) return false;
        
        this.groupMetadata.restrict = adminsOnly;
        return true;
    }

    /**
     * Gets the invite code for a specific group
     * @returns {Promise<string>} Group's invite code
     */
    async getInviteCode() {
        const code = await this.client.pupPage.evaluate(async chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            return window.Store.Invite.sendQueryGroupInviteCode(chatWid);
        }, this.id._serialized);

        return code;
    }
    
    /**
     * Invalidates the current group invite code and generates a new one
     * @returns {Promise<string>} New invite code
     */
    async revokeInvite() {
        const code = await this.client.pupPage.evaluate(chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            return window.Store.Invite.sendRevokeGroupInviteCode(chatWid);
        }, this.id._serialized);

        return code;
    }

    /**
     * Makes the bot leave the group
     * @returns {Promise}
     */
    async leave() {
        await this.client.pupPage.evaluate(chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            return window.Store.GroupUtils.sendExitGroup(chatWid);
        }, this.id._serialized);
    }

}

module.exports = GroupChat;
