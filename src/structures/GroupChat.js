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
        return await this.client.pupPage.evaluate(async (chatId, participantIds, type, sleep) => {
            if (type != 'add' && type != 'remove' && type != 'promote' && type != 'demote') return null;
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const participantWids = participantIds.map(p => window.Store.WidFactory.createWid(p));
            const status = [];
            for (const participantWid of participantWids) {
                status.push(await window.Store.GroupParticipants['send'+type.charAt(0).toUpperCase() + type.slice(1)+'Participants'](chatWid, [participantWid]));
                if (sleep) {
                    await Util.sleep(sleep);
                }
            }
            return status;
        }, this.id._serialized, participantIds, type, sleep);
    }

    /**
     * Adds a list of participants by ID to the group
     * @param {Array<string>} participantIds
     * @param {?number} default 100ms, amount to sleep in milliseconds before adding the next participant
     * @returns {Promise<Array<Object>>}
     */
    async addParticipants(participantIds, sleep = 100) {
        return this._changeParticipants(participantIds, 'add', sleep);
    }

    /**
     * Removes a list of participants by ID to the group
     * @param {Array<string>} participantIds
     * @param {?number} default 100ms, amount to sleep in milliseconds before removing the next participant
     * @returns {Promise<Array<Object>>}
     */
    async removeParticipants(participantIds, sleep = 100) {
        return this._changeParticipants(participantIds, 'remove', sleep);
    }

    /**
     * Promote participants to admins by IDs
     * @param {Array<string>} participantIds
     * @param {?number} default 100ms, amount to sleep in milliseconds before promoting the next participant
     * @returns {Promise<Array<Object>>}
     */
    async promoteParticipants(participantIds, sleep = 100) {
        return this._changeParticipants(participantIds, 'promote', sleep);
    }

    /**
     * Demotes admins to regular participants by IDs 
     * @param {Array<string>} participantIds
     * @param {?number} default 100ms, amount to sleep in milliseconds before demoting the next participant
     * @returns {Promise<Array<Object>>}
     */
    async demoteParticipants(participantIds, sleep = 100) {
        return this._changeParticipants(participantIds, 'demote', sleep);
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
                await window.Store.GroupUtils.setGroupSubject(chatWid, subject);
                return true;
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
                await window.Store.GroupUtils.setGroupDescription(chatWid, description, window.Store.MsgKey.newId(), descId);
                return true;
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
                await window.Store.GroupUtils.setGroupProperty(chatWid, 'announcement', adminsOnly ? 1 : 0);
                return true;
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
                await window.Store.GroupUtils.setGroupProperty(chatWid, 'restrict', adminsOnly ? 1 : 0);
                return true;
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
     * Deletes the group's picture.
     * @returns {Promise<boolean>} Returns true if the picture was properly deleted. This can return false if the user does not have the necessary permissions.
     */
    async deletePicture() {
        const success = await this.client.pupPage.evaluate((chatid) => {
            return window.WWebJS.deletePicture(chatid);
        }, this.id._serialized);

        return success;
    }

    /**
     * Sets the group's picture.
     * @param {MessageMedia} media
     * @returns {Promise<boolean>} Returns true if the picture was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setPicture(media) {
        const success = await this.client.pupPage.evaluate((chatid, media) => {
            return window.WWebJS.setPicture(chatid, media);
        }, this.id._serialized, media);

        return success;
    }

    /**
     * Gets the invite code for a specific group
     * @returns {Promise<string>} Group's invite code
     */
    async getInviteCode() {
        const codeRes = await this.client.pupPage.evaluate(async chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            return window.Store.Invite.queryGroupInviteCode(chatWid);
        }, this.id._serialized);

        return codeRes.code;
    }
    
    /**
     * Invalidates the current group invite code and generates a new one
     * @returns {Promise<string>} New invite code
     */
    async revokeInvite() {
        const codeRes = await this.client.pupPage.evaluate(chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            return window.Store.Invite.resetGroupInviteCode(chatWid);
        }, this.id._serialized);

        return codeRes.code;
    }

    /**
     * Makes the bot leave the group
     * @returns {Promise}
     */
    async leave() {
        await this.client.pupPage.evaluate(async chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = await window.Store.Chat.find(chatWid);
            return window.Store.GroupUtils.sendExitGroup(chat);
        }, this.id._serialized);
    }

}

module.exports = GroupChat;
