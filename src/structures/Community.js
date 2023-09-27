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
 * Represents a Community on WhatsApp
 * @extends {GroupChat}
 */
class Community extends GroupChat {
    _patch(data) {
        this.groupMetadata = data.groupMetadata;

        return super._patch(data);
    }

    /**
     * Gets all current community subgroups
     * @returns {Promise<Array<ChatId>>} Returns an array of @type {ChatId} objects
     */
    async getSubgroups() {
        return await this.client.pupPage.evaluate((communityId) => {
            const communityWid = window.Store.WidFactory.createWid(communityId);
            return window.Store.CommunityUtils.getSubgroups(communityWid);
        }, this.id._serialized);
    }

    /**
     * An object that handles the result for {@link linkSubgroups} method
     * @typedef {Object} LinkSubGroupsResult
     * @property {Array<string>} linkedGroupIds An array of group IDs that were successfully linked
     * @property {Array<Object>} failedGroups An array of objects that handles groups that failed to be linked to the community and an information about it
     * @property {string} failedGroups[].groupId The group ID, in a format of 'xxxxxxxxxx@g.us'
     * @property {number} failedGroups[].error The code of an error
     * @property {string} failedGroups[].message The message that describes an error
     */

    /**
     * Links a single subgroup or an array of subgroups to the community
     * @param {string} parentGroupId The ID of a community parent group
     * @param {string|Array<string>} subGroupIds The single group ID or an array of group IDs to link to the created community
     * @returns {Promise<LinkSubGroupsResult>} Returns an object that handles the result for the linking subgroups action
     */
    async linkSubgroups(parentGroupId, subGroupIds) {
        return await this.client.pupPage.evaluate(
            async (parentGroupId, subGroupIds) => {
                return await window.WWebJS.linkUnlinkSubgroups(
                    'LinkSubgroups',
                    parentGroupId,
                    subGroupIds
                );
            },
            parentGroupId,
            subGroupIds
        );
    }

    /**
     * An object that handles the result for {@link unlinkSubgroups} method
     * @typedef {Object} UnlinkSubGroupsResult
     * @property {Array<string>} unlinkedGroupIds An array of group IDs that were successfully unlinked
     * @property {Array<Object>} failedGroups An array of objects that handles groups that failed to be unlinked from the community and an information about it
     * @property {string} failedGroups[].groupId The group ID, in a format of 'xxxxxxxxxx@g.us'
     * @property {number} failedGroups[].error The code of an error
     * @property {string} failedGroups[].message The message that describes an error
     */

    /**
     * Links a single subgroup or an array of subgroups to the community
     * @param {string} parentGroupId The ID of a community parent group
     * @param {string|Array<string>} subGroupIds The single group ID or an array of group IDs to link to the created community
     * @param {boolean} [removeOrphanMembers = false] An optional parameter. If true, the method will remove specified subgroups along with their members who are not part of any other subgroups within the community. False by default
     * @returns {Promise<UnlinkSubGroupsResult>} Returns an object that handles the result for the unlinking subgroups action
     */
    async unlinkSubgroups(parentGroupId, subGroupIds, removeOrphanMembers) {
        return await this.client.pupPage.evaluate(
            async (parentGroupId, subGroupIds, removeOrphanMembers) => {
                return await window.WWebJS.linkUnlinkSubgroups(
                    'UnlinkSubgroups',
                    parentGroupId,
                    subGroupIds,
                    removeOrphanMembers
                );
            },
            parentGroupId,
            subGroupIds,
            removeOrphanMembers
        );
    }

    /**
     * Allows or disallows for non admin community members to add groups to the community
     * @see https://faq.whatsapp.com/205306122327447
     * @param {boolean} [value=true] True to allow all community members to add groups to the community, false to disallow
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async setNonAdminSubGroupCreation(value = true) {
        if (!this.groupMetadata.isParentGroup) return false;
        const result = await this._setGroupProperty('allow_non_admin_sub_group_creation', value);
        result && (this.groupMetadata.allowNonAdminSubGroupCreation = value);
        return result;
    }
}

module.exports = Community;
