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
     * @property {boolean} [isInviteV4Sent] Indicates if the inviteV4 was sent to the partitipant
     * @property {number} code The code of the result
     * @property {string} message The result message
     */

    /**
     * AddParticipnats options
     * @typedef {Object} AddParticipnatsOptions
     * @property {number} [sleep=500] The amount of milliseconds to wait before adding the next participant
     * @property {boolean} [autoSendInviteV4=true] If true, the inviteV4 will be sent to those participants who have restricted others from being automatically added to groups, otherwise the inviteV4 won't be sent
     * @property {string} [comment] The comment to be added to an inviteV4
     */

    /**
     * Adds a list of participants by ID to the group
     * @param {Array<string>} participantIds 
     * @param {AddParticipnatsOptions} [options] AddPartisipants options
     * @returns {Promise<[AddParticipantsResult]|string>} Object with resulting data or an error message as a string
     */
    async addParticipants(participantIds, options = {}) {
        const data =  await this.client.pupPage.evaluate(async (groupId, participantIds, options) => {
            const { sleep = 500, autoSendInviteV4 = true, comment = '' } = options;
            const groupWid = window.Store.WidFactory.createWid(groupId);
            const group = await window.Store.Chat.find(groupWid);
            !Array.isArray(participantIds) && (participantIds = [participantIds]);

            let participantsToAdd = await Promise.all(participantIds.map(async p => {
                const wid = window.Store.WidFactory.createWid(p);
                return await window.Store.Contact.find(wid);
            }));

            const data = {};

            const resultCodes = {
                default: 'AddParticipantsError: An unknown error occupied while adding a participant',
                isGroupEmpty: 'AddParticipantsError: You can\'t add a participant to an empty group',
                iAmNotAdmin: 'AddParticipantsError: You have no admin rights to add a participant to a group',
                200: 'OK',
                403: 'The participant can be added by sending private invitation only',
                408: 'You cannot add this participant because they recently left the group',
                409: 'The participant is already a group member',
                417: 'The participant can\'t be added to the community. You can invite them privately to join this group through its invite link',
                419: 'AddParticipantsError: The participant can\'t be added because the group is full'
            };

            const groupMetadata = group.groupMetadata;
            const groupParticipants = groupMetadata?.participants;

            if (!groupParticipants) {
                return resultCodes.isGroupEmpty;
            }

            if (!groupParticipants.canAdd()) {
                return resultCodes.iAmNotAdmin;
            }

            for (const participant of participantsToAdd) {
                const participantId = participant.id._serialized;

                data[participantId] = {
                    isInviteV4Sent: autoSendInviteV4 === false ? false : undefined
                };

                if (groupParticipants.some(p => p.id._serialized === participantId)) {
                    data[participantId].code = 409;
                    data[participantId].message = resultCodes[409];
                    continue;
                }

                const result =
                    await window.WWebJS.getAddParticipantsRpcResult(groupMetadata, groupWid, participant.id);
                const code = result.code;

                if (code === 403) {
                    window.Store.ContactCollection.gadd(participant.id, { silent: true });
                }

                data[participantId].code = code;

                data[participantId].message = code === -1
                    ? result.message
                    : resultCodes[code] ?? resultCodes.default;

                if (autoSendInviteV4 && [403, 417].includes(code)) {
                    let isInviteV4Sent = true;

                    result.name !== 'ParticipantRequestCodeCanBeSent' && (isInviteV4Sent = false);
                    const userChat = !isInviteV4Sent && await window.Store.Chat.find(participant.id);

                    if (userChat) {
                        const groupName = group.formattedTitle || group.name;
                        const res = await window.Store.GroupUtils.sendGroupInviteMessage(
                            userChat,
                            group.id,
                            groupName,
                            result.inviteV4,
                            result.inviteV4Exp,
                            comment
                        );
                        isInviteV4Sent = res === 'OK' ? true : false;
                    }
                    else { isInviteV4Sent = false; }

                    data[participantId].isInviteV4Sent = isInviteV4Sent;
                }

                sleep && participantsToAdd.length > 1 &&
                    await (async (ms) => new Promise(resolve => setTimeout(resolve, ms)))(sleep);
            }

            return JSON.stringify(data);
        }, this.id._serialized, participantIds, options);

        return JSON.parse(data);
    }

    /**
     * Removes a list of participants by ID to the group
     * @param {Array<string>} participantIds 
     * @returns {Promise<{ status: number }>}
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