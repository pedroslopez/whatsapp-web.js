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
     * An object that handles the result of {@link addParticipants} method
     * @typedef {Object} AddParticipantsResult
     * @property {number} [code] The code of the result
     * @property {string} [message] The result message
     */

    /**
     * Adds a list of participants by ID to the group
     * @param {Array<string>} participantIds 
     * @returns {Promise<AddParticipantsResult>}
     */
    async addParticipants(participantIds) {
        try {
            return await this.client.pupPage.evaluate(async (chatId, participantIds) => {
                const groupWid = window.Store.WidFactory.createWid(chatId);
                const group = await window.Store.Chat.find(groupWid);
                !Array.isArray(participantIds) && (participantIds = [participantIds]);
                let participantsToAdd = await Promise.all(participantIds.map(async p => {
                    const wid = window.Store.WidFactory.createWid(p);
                    return await window.Store.Contact.find(wid);
                }));
                const resultCodes = {
                    200: 'OK',
                    403: 'The user can be added by sending private invitation only',
                    409: 'The user is already a group member',
                    417: 'User/s can\'t be added to the community. You can invite them privately to join this group through its invite link',
                    419: 'User/s can\'t be added because the community is full',
                    isGroupEmpty: 'You can\'t add participants to an empty group',
                    iAmNotAdmin: 'You have no admin rights to add participants to a group',
                    default: 'An error occupied while adding participant/s'
                };
                const groupParticipants = group.groupMetadata?.participants;
                if (!groupParticipants) {
                    throw new Error(resultCodes.isGroupEmpty);
                }
                if (!(await groupParticipants.canAdd())) {
                    throw new Error(resultCodes.iAmNotAdmin);
                }
                const data = {};
                participantsToAdd = participantsToAdd.filter(participant => {
                    const participantId = participant.id._serialized;
                    if (groupParticipants.some(p => p.id._serialized === participantId)) {
                        data[participantId] = {
                            code: 409,
                            message: resultCodes[409]
                        };
                        return false;
                    }
                    return true;
                });
                const participantsToBeAdded = group.groupMetadata?.isLidAddressingMode
                    ? participantsToAdd.map((p) => ({
                        phoneNumber: p.id,
                        lid: window.Store.LidManipulations.getCurrentLid(p.id)
                    }))
                    : participantsToAdd.map((e) => ({
                        phoneNumber: e.id
                    }));
                const preResult =
                    await window.Store.GroupParticipantsImpl.addGroupParticipants(group.id, participantsToBeAdded);
                if (!preResult.status === 207) {
                    throw new Error(resultCodes.default);
                }
                for (const p of preResult.participants) {
                    try {
                        window.Store.GroupUtils.sendForNeededAddRequest(groupParticipants, preResult);
                    } catch (err) {
                        throw new Error(resultCodes[err.status] ?? resultCodes.default);
                    }
                    data[p.userWid._serialized] = {
                        code: parseInt(p.code, 10),
                        message: resultCodes[p.code]
                    };
                }
                return data;
            }, this.id._serialized, participantIds);
        } catch (err) {
            return err;
        }
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