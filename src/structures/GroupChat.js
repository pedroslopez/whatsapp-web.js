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
     * An object that handles the information about the group membership request
     * @typedef {Object} GroupMembershipRequest
     * @property {Object} id The wid of a user who requests to enter the group
     * @property {Object} addedBy The wid of a user who created that request
     * @property {Object|null} parentGroupId The wid of a community parent group to which the current group is linked
     * @property {string} requestMethod The method used to create the request: NonAdminAdd/InviteLink/LinkedGroupJoin
     * @property {number} t The timestamp the request was created at
     */
    
    /**
     * Gets an array of membership requests
     * @returns {Promise<Array<GroupMembershipRequest>>} An array of membership requests
     */
    async getGroupMembershipRequests() {
        return await this.client.getGroupMembershipRequests(this.id._serialized);
    }

    /**
     * An object that handles the result for membership request action
     * @typedef {Object} MembershipRequestActionResult
     * @property {string} requesterId User ID whos membership request was approved/rejected
     * @property {number} error An error code that occurred during the operation for the participant
     * @property {string} message A message with a result of membership request action
     */

    /**
     * An object that handles options for {@link approveGroupMembershipRequests} and {@link rejectGroupMembershipRequests} methods
     * @typedef {Object} MembershipRequestActionOptions
     * @property {Array<string>|string|null} requesterIds User ID/s who requested to join the group, if no value is provided, the method will search for all membership requests for that group
     * @property {Array<number>|number|null} sleep The number of milliseconds to wait before performing an operation for the next requester. If it is an array, a random sleep time between the sleep[0] and sleep[1] values will be added (the difference must be >=100 ms, otherwise, a random sleep time between sleep[1] and sleep[1] + 100 will be added). If sleep is a number, a sleep time equal to its value will be added. By default, sleep is an array with a value of [250, 500]
     */

    /**
     * Approves membership requests if any
     * @param {MembershipRequestActionOptions} options Options for performing a membership request action
     * @returns {Promise<Array<MembershipRequestActionResult>>} Returns an array of requester IDs whose membership requests were approved and an error for each requester, if any occurred during the operation. If there are no requests, an empty array will be returned
     */
    async approveGroupMembershipRequests(options = {}) {
        return await this.client.approveGroupMembershipRequests(this.id._serialized, options);
    }

    /**
     * Rejects membership requests if any
     * @param {MembershipRequestActionOptions} options Options for performing a membership request action
     * @returns {Promise<Array<MembershipRequestActionResult>>} Returns an array of requester IDs whose membership requests were rejected and an error for each requester, if any occurred during the operation. If there are no requests, an empty array will be returned
     */
    async rejectGroupMembershipRequests(options = {}) {
        return await this.client.rejectGroupMembershipRequests(this.id._serialized, options);
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
