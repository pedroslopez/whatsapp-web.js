'use strict';

const GroupChat = require('./GroupChat');

/**
 * Chat ID structure
 * @typedef {Object} ChatId
 * @property {string} server
 * @property {string} user
 * @property {string} _serialized
 */

/**
 * Community participant information
 * @typedef {Object} CommunityParticipant
 * @property {ChatId} id
 * @property {boolean} isAdmin
 * @property {boolean} isSuperAdmin
 */

/**
 * Represents a Community on WhatsApp
 * @extends {GroupChat}
 */
class Community extends GroupChat {
    _patch(data) {
        this.groupMetadata = data.groupMetadata;
        this.isCommunity = true;

        return super._patch(data);
    }

    /**
     * The community default subgroup (announcement group)
     * @type {ChatId}
     */
    get defaultSubgroup() {
        return this.groupMetadata.defaultSubgroup;
    }

    /**
     * Gets all current community subgroups in a case when the current user is a community owner/admin,
     * else gets only those subgroups where the current user is a member in
     * @returns {Promise<Array<ChatId>>} Returns an array of @type {ChatId} objects
     */
    async getSubgroups() {
        return await this.client.pupPage.evaluate((communityId) => {
            const communityWid = window.Store.WidFactory.createWid(communityId);
            return window.Store.CommunityUtils.getSubgroups(communityWid);
        }, this.id._serialized);
    }

    /**
     * Gets all community subgroups the current user is a member of
     * @returns {Promise<Array<ChatId>>} Returns an array of @type {ChatId} objects
     */
    async getJoinedSubgroups() {
        return await this.client.pupPage.evaluate((communityId) => {
            const communityWid = window.Store.WidFactory.createWid(communityId);
            return window.Store.CommunityUtils.getJoinedSubgroups(communityWid);
        }, this.id._serialized);
    }

    /**
     * Gets all community subgroups in which the current user is not yet a member,
     * preferable to use in a case when the current user is not a community owner/admin but only a member,
     * otherwise, the result will be an empty array
     * @returns {Promise<Array<ChatId>>} Returns an array of @type {ChatId} objects
     */
    async getUnjoinedSubgroups() {
        return await this.client.pupPage.evaluate((communityId) => {
            const communityWid = window.Store.WidFactory.createWid(communityId);
            return window.Store.CommunityUtils.getUnjoinedSubgroups(communityWid);
        }, this.id._serialized);
    }

    /**
     * Gets the full list of community participants and updates the community groupMetadata
     * @note To get the full result, you need to be a community admin. Otherwise, you will only get the participants that a regular community member can see
     * @returns {Promise<Array<CommunityParticipant>>}
     */
    async getParticipants() {
        const participants = await this.client.pupPage.evaluate(async (communityId) => {
            const communityWid = window.Store.WidFactory.createWid(communityId);

            const community = window.Store.CommunityCollection.get(communityWid);
            if (!community) return [];

            const communityParticipants = community.participants;
            if (!communityParticipants.iAmAdmin()) return this.participants;

            let participants;
            try {
                participants = await window.Store.CommunityUtils.getCommunityParticipants(communityWid);
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return this.participants;
                throw err;
            }

            participants = participants.map((participantWid) => {
                const participant = communityParticipants.get(participantWid);
                return {
                    id: participantWid,
                    isAdmin: !!(participant && participant.isAdmin),
                    isSuperAdmin: !!(participant && participantWid === community.owner)
                };
            });

            const result = Array.from(participants);
            const updatedData = {
                id: communityWid,
                announce: false,
                participants: participants,
                owner: community.owner,
                subject: community.subject,
                creation: community.creation,
                membershipApprovalMode: community.membershipApprovalMode,
                reportToAdminMode: community.reportToAdminMode,
                noFrequentlyForwarded: community.noFrequentlyForwarded,
                restrict: community.restrict
            };

            await window.Store.GroupParticipants.updateGroupParticipantTableWithoutDeviceSyncJob([updatedData]);
            communityParticipants.set(participants);

            return result;
        }, this.id._serialized);

        this.groupMetadata.participants = participants;
        return participants;
    }

    /**
     * An object that handles the result for {@link promoteParticipants} and {@link demoteParticipants} methods
     * @typedef {Object} PromoteDemoteResult
     * @property {ChatId} id The participant ID
     * @property {number} code The code of an error
     * @property {string} message The result message
     */

    /**
     * Promotes community participant/s
     * @param {string|Array<string>} participantIds A single participant ID or an array of IDs to promote
     * @returns {Promise<PromoteDemoteResult[]|[]>} Returns an array with the resulting data
     */
    async promoteParticipants(participantIds) {
        return await this.client.pupPage.evaluate(
            async (communityId, participantIds) => {
                return await window.WWebJS.promoteDemoteCommunityParticipants(communityId, participantIds, true);
            },
            this.id._serialized,
            participantIds
        );
    }

    /**
     * Demotes community participant/s
     * @param {string|Array<string>} participantIds A single participant ID or an array of IDs to demote
     * @returns {Promise<PromoteDemoteResult[]|[]>} Returns an array with the resulting data
     */
    async demoteParticipants(participantIds) {
        return await this.client.pupPage.evaluate(
            async (communityId, participantIds) => {
                return await window.WWebJS.promoteDemoteCommunityParticipants(communityId, participantIds, false);
            },
            this.id._serialized,
            participantIds
        );
    }

    /**
     * Allows or disallows for non admin community members to add groups to the community
     * @see https://faq.whatsapp.com/205306122327447
     * @param {boolean} [value=false] True to allow all community members to add groups to the community, false to allow only community admins to add groups to the community
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async setNonAdminSubGroupCreation(value = false) {
        return await this._setGroupProperty('allow_non_admin_sub_group_creation', value);
    }

    async setMessagesAdminsOnly() {
        console.warn('Setting this property will not have any effect on the community');
        return false;
    }

    async setInfoAdminsOnly() {
        console.warn('Setting this property will not have any effect on the community');
        return false;
    }

    /**
     * An object that handles the result for {@link linkSubgroups} method
     * @typedef {Object} LinkSubGroupsResult
     * @property {Array<string>} linkedGroupIds An array of group IDs that were successfully linked
     * @property {Array<Object>} failedGroups An array of objects that handles groups that failed to be linked to the community and an information about it
     * @property {string} failedGroups[].groupId The group ID, in a format of 'xxxxxxxxxx@g.us'
     * @property {number} failedGroups[].code The code of an error
     * @property {string} failedGroups[].message The message that describes an error
     */

    /**
     * Links a single subgroup or an array of subgroups to the community
     * @param {string|Array<string>} subGroupIds The single group ID or an array of group IDs to link to the created community
     * @returns {Promise<LinkSubGroupsResult>} Returns an object that handles the result for the linking subgroups action
     */
    async linkSubgroups(subGroupIds) {
        return await this.client.pupPage.evaluate(
            async (parentGroupId, subGroupIds) => {
                return await window.WWebJS.linkUnlinkSubgroups(
                    'LinkSubgroups',
                    parentGroupId,
                    subGroupIds
                );
            },
            this.id._serialized,
            subGroupIds
        );
    }

    /**
     * An object that handles the result for {@link unlinkSubgroups} method
     * @typedef {Object} UnlinkSubGroupsResult
     * @property {Array<string>} unlinkedGroupIds An array of group IDs that were successfully unlinked
     * @property {Array<Object>} failedGroups An array of objects that handles groups that failed to be unlinked from the community and an information about it
     * @property {string} failedGroups[].groupId The group ID, in a format of 'xxxxxxxxxx@g.us'
     * @property {number} failedGroups[].code The code of an error
     * @property {string} failedGroups[].message The message that describes an error
     */

    /**
     * An object that handles options for unlinking subgroups
     * @typedef {Object} UnlinkSubGroupsOptions
     * @property {boolean} [removeOrphanMembers = false] If true, the method will remove specified subgroups along with their members who are not part of any other subgroups within the community. False by default
     */

    /**
     * Links a single subgroup or an array of subgroups to the community
     * @param {string|Array<string>} subGroupIds The single group ID or an array of group IDs to link to the created community
     * @param {UnlinkSubGroupsOptions} options Options to unlink subgroups
     * @returns {Promise<UnlinkSubGroupsResult>} Returns an object that handles the result for the unlinking subgroups action
     */
    async unlinkSubgroups(subGroupIds, options = {}) {
        return await this.client.pupPage.evaluate(
            async (parentGroupId, subGroupIds, options) => {
                return await window.WWebJS.linkUnlinkSubgroups(
                    'UnlinkSubgroups',
                    parentGroupId,
                    subGroupIds,
                    options
                );
            },
            this.id._serialized,
            subGroupIds,
            options
        );
    }

    /**
     * @typedef {Object} JoinGroupResponse
     * @property {?ChatId} gid The group ID object
     * @property {number} code A response code
     * @property {string} message The message that explains a response
     */

    /**
     * Joins a community subgroup by community ID and a subgroup ID
     * @param {string} subGroupId The subgroup ID to join
     * @returns {Promise<JoinGroupResponse>} Returns an object that handles the result of an operation
     */
    async joinSubgroup(subGroupId) {
        return this.client.joinSubgroup(this.id._serialized, subGroupId);
    }

    /**
     * An object that handles the result for {@link removeParticipants} method
     * @typedef {Object} RemoveParticipantsResult
     * @property {number} code The code of the result
     * @property {string} message The result message
     */

    /**
     * An object that handles options for removing participants
     * @typedef {Object} RemoveParticipantsOptions
     * @property {Array<number>|number} [sleep = [250, 500]] The number of milliseconds to wait before removing the next participant. If it is an array, a random sleep time between the sleep[0] and sleep[1] values will be added (the difference must be >=100 ms, otherwise, a random sleep time between sleep[1] and sleep[1] + 100 will be added). If sleep is a number, a sleep time equal to its value will be added. By default, sleep is an array with a value of [250, 500]
     */

    /**
     * Removes participants from the community
     * @note Provided participants will be also remove from all community subgroups
     * @param {string|Array<string>} participantIds A single participant ID or an array of participant IDs to remove from the community
     * @param {RemoveParticipantsOptions} options Options to remove participants
     * @returns {Promise<Object.<string, RemoveParticipantsResult>|string} Returns an object with the resulting data or an error message as a string
     */
    async removeParticipants(participantIds, options = {}) {
        return await this.client.pupPage.evaluate(
            async (communityId, participantIds, options) => {
                const { sleep = [250, 500] } = options;
                const communityWid = window.Store.WidFactory.createWid(communityId);
                const community = await window.Store.Chat.find(communityWid);
                const participantData = {};

                !Array.isArray(participantIds) && (participantIds = [participantIds]);
                const participantWids = participantIds.map((p) => window.Store.WidFactory.createWid(p));

                const errorCodes = {
                    default: 'An unknown error occupied while removing a participant',
                    iAmNotAdmin:
                        'RemoveParticipantsError: You have no admin rights to remove participants from the community',
                    200: 'The participant was removed successfully from the community and its subgroups',
                    404: 'The phone number is not registered on WhatsApp',
                    405: 'The participant is not allowed to be removed from the community',
                    406: 'The participant can\'t be removed from the community because they created this community',
                    409: 'The participant is not a community member',
                    500: 'A server error occupied while removing the participant from community subgroups'
                };

                if (!community.iAmAdmin()) {
                    return errorCodes.iAmNotAdmin;
                }

                await window.Store.CommunityUtils.queryAndUpdateCommunityParticipants(communityWid);
                const communityParticipants = community.groupMetadata?.participants._models;

                const _getSleepTime = (sleep) => {
                    if (!Array.isArray(sleep) || (sleep.length === 2 && sleep[0] === sleep[1])) {
                        return sleep;
                    }
                    if (sleep.length === 1) {
                        return sleep[0];
                    }
                    sleep[1] - sleep[0] < 100 && (sleep[0] = sleep[1]) && (sleep[1] += 100);
                    return Math.floor(Math.random() * (sleep[1] - sleep[0] + 1)) + sleep[0];
                };

                for (const pWid of participantWids) {
                    const pId = pWid._serialized;
                    let rpcResult;

                    if (!(await window.Store.QueryExist(pWid))?.wid) {
                        participantData[pId] = {
                            code: 404,
                            message: errorCodes[404]
                        };
                        continue;
                    }

                    if (communityParticipants.every((p) => p.id._serialized !== pId)) {
                        participantData[pId] = {
                            code: 409,
                            message: errorCodes[409]
                        };
                        continue;
                    }

                    try {
                        rpcResult = await window.Store.GroupParticipants.sendRemoveParticipantsRPC({
                            participantArgs: [
                                {
                                    participantJid: window.Store.WidToJid.widToUserJid(pWid)
                                }
                            ],
                            iqTo: window.Store.WidToJid.widToGroupJid(communityWid),
                            hasRemoveLinkedGroupsTrue: true
                        });
                    } catch (err) {
                        participantData[pId] = {
                            code: 400,
                            message: errorCodes.default
                        };
                        continue;
                    } finally {
                        sleep &&
                            participantIds.length > 1 &&
                            participantIds.indexOf(pWid) !== participantIds.length - 1 &&
                            (await new Promise((resolve) => setTimeout(resolve, _getSleepTime(sleep))));
                    }

                    if (rpcResult.name === 'RemoveParticipantsResponseSuccess') {
                        const errorCode =
                            +rpcResult.value.removeParticipant[0]
                                .participantNotInGroupOrParticipantNotAllowedOrParticipantNotAcceptableOrRemoveParticipantsLinkedGroupsServerErrorMixinGroup
                                ?.value.error || 200;

                        participantData[pId] = {
                            code: errorCode,
                            message: errorCodes[errorCode] || errorCodes.default
                        };
                    } else if (rpcResult.name === 'RemoveParticipantsResponseClientError') {
                        const { code: code } = rpcResult.value.errorRemoveParticipantsClientErrors.value;
                        participantData[pId] = {
                            code: +code,
                            message: errorCodes[code] || errorCodes.default
                        };
                    } else if (rpcResult.name === 'RemoveParticipantsResponseServerError') {
                        const { code: code } = rpcResult.value.errorServerErrors.value;
                        participantData[pId] = {
                            code: +code,
                            message: errorCodes[code] || errorCodes.default
                        };
                    }
                }
                return participantData;
            },
            this.id._serialized,
            participantIds,
            options
        );
    }

    /**
     * Deactivates the community
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async deactivate() {
        return await this.client.deactivateCommunity(this.id._serialized);
    }
}

module.exports = Community;
