'use strict';

const GroupChat = require('./GroupChat');

/**
 * Chat ID
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
        return await this.client.pupPage.evaluate(communityId => {
            const communityWid = window.Store.WidFactory.createWid(communityId);
            return window.Store.CommunityUtils.getSubgroups(communityWid);
        }, this.id._serialized);
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
