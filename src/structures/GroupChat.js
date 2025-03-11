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
     * An object that handles the result for {@link addParticipants} method
     * @typedef {Object} AddParticipantsResult
     * @property {number} code The code of the result
     * @property {string} message The result message
     * @property {boolean} isInviteV4Sent Indicates if the inviteV4 was sent to the partitipant
     */

    /**
     * An object that handles options for adding participants
     * @typedef {Object} AddParticipnatsOptions
     * @property {Array<number>|number} [sleep = [250, 500]] The number of milliseconds to wait before adding the next participant. If it is an array, a random sleep time between the sleep[0] and sleep[1] values will be added (the difference must be >=100 ms, otherwise, a random sleep time between sleep[1] and sleep[1] + 100 will be added). If sleep is a number, a sleep time equal to its value will be added. By default, sleep is an array with a value of [250, 500]
     * @property {boolean} [autoSendInviteV4 = true] If true, the inviteV4 will be sent to those participants who have restricted others from being automatically added to groups, otherwise the inviteV4 won't be sent (true by default)
     * @property {string} [comment = ''] The comment to be added to an inviteV4 (empty string by default)
     */

    /**
     * Adds a list of participants by ID to the group
     * @param {string|Array<string>} participantIds 
     * @param {AddParticipnatsOptions} options An object thay handles options for adding participants
     * @returns {Promise<Object.<string, AddParticipantsResult>|string>} Returns an object with the resulting data or an error message as a string
     */
    async addParticipants(participantIds, options = {}) {
        return await this.client.pupPage.evaluate(async (groupId, participantIds, options) => {
            const { sleep = [250, 500], autoSendInviteV4 = true, comment = '' } = options;
            const participantData = {};

            !Array.isArray(participantIds) && (participantIds = [participantIds]);
            const groupWid = window.Store.WidFactory.createWid(groupId);
            const group = await window.Store.Chat.find(groupWid);
            const participantWids = participantIds.map((p) => window.Store.WidFactory.createWid(p));

            const errorCodes = {
                default: 'An unknown error occupied while adding a participant',
                isGroupEmpty: 'AddParticipantsError: The participant can\'t be added to an empty group',
                iAmNotAdmin: 'AddParticipantsError: You have no admin rights to add a participant to a group',
                200: 'The participant was added successfully',
                403: 'The participant can be added by sending private invitation only',
                404: 'The phone number is not registered on WhatsApp',
                408: 'You cannot add this participant because they recently left the group',
                409: 'The participant is already a group member',
                417: 'The participant can\'t be added to the community. You can invite them privately to join this group through its invite link',
                419: 'The participant can\'t be added because the group is full'
            };

            await window.Store.GroupQueryAndUpdate(groupWid);
            const groupMetadata = group.groupMetadata;
            const groupParticipants = groupMetadata?.participants;

            if (!groupParticipants) {
                return errorCodes.isGroupEmpty;
            }

            if (!group.iAmAdmin()) {
                return errorCodes.iAmNotAdmin;
            }

            const _getSleepTime = (sleep) => {
                if (!Array.isArray(sleep) || sleep.length === 2 && sleep[0] === sleep[1]) {
                    return sleep;
                }
                if (sleep.length === 1) {
                    return sleep[0];
                }
                (sleep[1] - sleep[0]) < 100 && (sleep[0] = sleep[1]) && (sleep[1] += 100);
                return Math.floor(Math.random() * (sleep[1] - sleep[0] + 1)) + sleep[0];
            };

            for (const pWid of participantWids) {
                const pId = pWid._serialized;

                participantData[pId] = {
                    code: undefined,
                    message: undefined,
                    isInviteV4Sent: false
                };

                if (groupParticipants.some(p => p.id._serialized === pId)) {
                    participantData[pId].code = 409;
                    participantData[pId].message = errorCodes[409];
                    continue;
                }

                if (!(await window.Store.QueryExist(pWid))?.wid) {
                    participantData[pId].code = 404;
                    participantData[pId].message = errorCodes[404];
                    continue;
                }

                const rpcResult =
                    await window.WWebJS.getAddParticipantsRpcResult(groupMetadata, groupWid, pWid);
                const { code: rpcResultCode } = rpcResult;

                participantData[pId].code = rpcResultCode;
                participantData[pId].message =
                    errorCodes[rpcResultCode] || errorCodes.default;

                if (autoSendInviteV4 && rpcResultCode === 403) {
                    let userChat, isInviteV4Sent = false;
                    window.Store.Contact.gadd(pWid, { silent: true });

                    if (rpcResult.name === 'ParticipantRequestCodeCanBeSent' &&
                        (userChat = await window.Store.Chat.find(pWid))) {
                        const groupName = group.formattedTitle || group.name;
                        const res = await window.Store.GroupInviteV4.sendGroupInviteMessage(
                            userChat,
                            group.id._serialized,
                            groupName,
                            rpcResult.inviteV4Code,
                            rpcResult.inviteV4CodeExp,
                            comment,
                            await window.WWebJS.getProfilePicThumbToBase64(groupWid)
                        );
                        isInviteV4Sent = window.compareWwebVersions(window.Debug.VERSION, '<', '2.2335.6')
                            ? res === 'OK'
                            : res.messageSendResult === 'OK';
                    }

                    participantData[pId].isInviteV4Sent = isInviteV4Sent;
                }

                sleep &&
                    participantWids.length > 1 &&
                    participantWids.indexOf(pWid) !== participantWids.length - 1 &&
                    (await new Promise((resolve) => setTimeout(resolve, _getSleepTime(sleep))));
            }

            return participantData;
        }, this.id._serialized, participantIds, options);
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
     * Updates the group setting to allow only admins to add members to the group.
     * @param {boolean} [adminsOnly=true] Enable or disable this option 
     * @returns {Promise<boolean>} Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setAddMembersAdminsOnly(adminsOnly=true) {
        const success = await this.client.pupPage.evaluate(async (groupId, adminsOnly) => {
            const chatWid = window.Store.WidFactory.createWid(groupId);
            try {
                const response = await window.Store.GroupUtils.setGroupMemberAddMode(chatWid, 'member_add_mode', adminsOnly ? 0 : 1);
                return response.name === 'SetMemberAddModeResponseSuccess';
            } catch (err) {
                if(err.name === 'SmaxParsingFailure') return false;
                throw err;
            }
        }, this.id._serialized, adminsOnly);

        success && (this.groupMetadata.memberAddMode = adminsOnly ? 'admin_add' : 'all_member_add');
        return success;
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
            try {
                return window.compareWwebVersions(window.Debug.VERSION, '>=', '2.3000.1020730154')
                    ? await window.Store.GroupInvite.fetchMexGroupInviteCode(chatId)
                    : await window.Store.GroupInvite.queryGroupInviteCode(chatWid, true);
            }
            catch (err) {
                if(err.name === 'ServerStatusCodeError') return undefined;
                throw err;
            }
        }, this.id._serialized);

        return codeRes?.code
            ? codeRes?.code
            : codeRes;
    }
    
    /**
     * Invalidates the current group invite code and generates a new one
     * @returns {Promise<string>} New invite code
     */
    async revokeInvite() {
        const codeRes = await this.client.pupPage.evaluate(chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            return window.Store.GroupInvite.resetGroupInviteCode(chatWid);
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
