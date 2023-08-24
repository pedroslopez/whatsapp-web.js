'use strict';

const GroupChat = require('./GroupChat');

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
     * Makes the bot leave the community announcement group
     * @note The community creator cannot leave the announcement group but can only deactivate the community instead
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async leave() {
        return await this.client.pupPage.evaluate(async communityId => {
            const communityWid = window.Store.WidFactory.createWid(communityId);
            try {
                const result = await window.Store.GroupUtils.leaveCommunity(communityWid);
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

module.exports = Community;
