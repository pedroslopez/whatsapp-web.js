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
        return await this.client.pupPage.evaluate(async (chatId, participantIds) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = await window.Store.Chat.find(chatWid);
            const participants = await Promise.all(participantIds.map(async p => {
                const wid = window.Store.WidFactory.createWid(p);
                return await window.Store.Contact.get(wid);
            }));
            await window.Store.GroupParticipants.addParticipants(chat, participants);
            return { status: 200 };
        }, this.id._serialized, participantIds);
    }

    /**
     * Removes a list of participants by ID to the group
     * @param {Array<string>} participantIds 
     * @returns {Promise<Object>}
     */
    async removeParticipants(participantIds) {
        return await this.client.pupPage.evaluate(async (chatId, participantIds) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = await window.Store.Chat.find(chatWid);
            const participants = participantIds.map(p => {
                return chat.groupMetadata.participants.get(p);
            }).filter(p => Boolean(p));
            await window.Store.GroupParticipants.removeParticipants(chat, participants);
            return { status: 200 };
        }, this.id._serialized, participantIds);
    }

    /**
     * Promotes participants by IDs to admins
     * @param {Array<string>} participantIds 
     * @returns {Promise<{ status: number }>} Object with status code indicating if the operation was successful
     */
    async promoteParticipants(participantIds) {
        return await this.client.pupPage.evaluate(async (chatId, participantIds) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = await window.Store.Chat.find(chatWid);
            const participants = participantIds.map(p => {
                return chat.groupMetadata.participants.get(p);
            }).filter(p => Boolean(p));
            await window.Store.GroupParticipants.promoteParticipants(chat, participants);
            return { status: 200 };
        }, this.id._serialized, participantIds);
    }

    /**
     * Demotes participants by IDs to regular users
     * @param {Array<string>} participantIds 
     * @returns {Promise<{ status: number }>} Object with status code indicating if the operation was successful
     */
    async demoteParticipants(participantIds) {
        return await this.client.pupPage.evaluate(async (chatId, participantIds) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = await window.Store.Chat.find(chatWid);
            const participants = participantIds.map(p => {
                return chat.groupMetadata.participants.get(p);
            }).filter(p => Boolean(p));
            await window.Store.GroupParticipants.demoteParticipants(chat, participants);
            return { status: 200 };
        }, this.id._serialized, participantIds);
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
            let newId = await window.Store.MsgKey.newId();
            try {
                await window.Store.GroupUtils.setGroupDescription(chatWid, description, newId, descId);
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
    async setMessagesAdminsOnly(adminsOnly = true) {
        const result = await this.client.pupPage.evaluate(async (chatId, adminsOnly) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                const response =
                    await window.Store.GroupUtils.setGroupProperty(chatWid, 'announcement', adminsOnly ? 1 : 0);
                return response.name === 'SetPropertyResponseSuccess';
            } catch (err) {
                if (err.name === 'SmaxParsingFailure') return false;
                throw err;
            }
        }, this.id._serialized, adminsOnly);

        this.groupMetadata.announce = result;
        return result;
    }

    /**
     * Updates the group settings to only allow admins to edit group info (title, description, photo).
     * @param {boolean} [adminsOnly=true] Enable or disable this option 
     * @returns {Promise<boolean>} Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setInfoAdminsOnly(adminsOnly = true) {
        const result = await this.client.pupPage.evaluate(async (chatId, adminsOnly) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                const response =
                    await window.Store.GroupUtils.setGroupProperty(chatWid, 'restrict', adminsOnly ? 1 : 0);
                return response.name === 'SetPropertyResponseSuccess';
            } catch (err) {
                if (err.name === 'SmaxParsingFailure') return false;
                throw err;
            }
        }, this.id._serialized, adminsOnly);

        this.groupMetadata.restrict = result;
        return result;
    }

    /**
     * Updates message expiration timer for the group
     * Valid values for passing to the method are:
     * 0 for message expiration removal,
     * 1 for 24 hours message expiration,
     * 2 for 7 days message expiration,
     * 3 for 90 days message expiration
     * @param {number} value The value to set the message expiration for
     * @returns {Promise<boolean} Returns true if the operation completed successfully, false otherwise
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
            throw class _ extends Error {
                constructor(m) { super(m); this.name = 'SetMessageExpirationError'; }
            }(`Invalid message expiration value = ${value} is provided\nValid values are:\n0 for message expiration removal,\n1 for 24 hours message expiration,\n2 for 7 days message expiration,\n3 for 90 days message expiration`);
        }

        const result = await this.client.pupPage.evaluate(async (chatId, value) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                const response =
                    await window.Store.GroupUtils.setGroupProperty(chatWid, 'ephemeral', value);
                return response.name === 'SetPropertyResponseSuccess';
            } catch (err) {
                if (err.name === 'SmaxParsingFailure') return false;
                throw err;
            }
        }, this.id._serialized, value);

        return result;
    }

    /**
     * Sets the 'Report To Admin Mode', if turned on, every group participant could
     * report every message sent in the group, these reports will be sent to group admins for review,
     * group admin could see those reports in 'Sent for admin review' section in the group
     * @param {boolean} value True for turning the 'Report To Admin Mode' on, false fot turning it off
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async setReportToAdminMode(value) {
        const result = await this.client.pupPage.evaluate(async (chatId, value) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                const response =
                    await window.Store.GroupUtils.setGroupProperty(chatWid, 'report_to_admin_mode', value);
                return response.name === 'SetPropertyResponseSuccess';
            } catch (err) {
                if (err.name === 'SmaxParsingFailure') return false;
                throw err;
            }
        }, this.id._serialized, value ? 1 : 0);

        return result;
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
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async leave() {
        return await this.client.pupPage.evaluate(async groupId => {
            const groupWid = window.Store.WidFactory.createWid(groupId);
            const group = await window.Store.Chat.find(groupWid);
            try {
                const result = group.groupMetadata.defaultSubgroup
                    ? await window.Store.GroupUtils.leaveCommunity(groupWid)
                    : await window.Store.GroupUtils.leaveGroup(groupWid);
                return result.code === 200
                    ? true
                    : false;
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, this.id._serialized);
    }
}

module.exports = GroupChat;
