'use strict';

const Base = require('./Base');
const Message = require('./Message');

/**
 * Channel ID structure
 * @typedef {Object} ChannelId
 * @property {string} server
 * @property {string} user
 * @property {string} _serialized
 */

/**
 * Represents a Channel on WhatsApp
 * @extends {Base}
 */
class Channel extends Base {
    constructor(client, data) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data) {
        this.channelMetadata = data.channelMetadata;

        /**
         * ID that represents the channel
         * @type {ChannelId}
         */
        this.id = data.id;

        /**
         * Title of the channel
         * @type {string}
         */
        this.name = data.name;

        /** 
         * The channel description
         * @type {string}
         */
        this.description = data.description;

        /**
         * Indicates if it is a Channel
         * @type {boolean}
         */
        this.isChannel = data.isChannel;

        /**
         * Indicates if it is a Group
         * @type {boolean}
         */
        this.isGroup = data.isGroup;

        /**
         * Indicates if the channel is readonly
         * @type {boolean}
         */
        this.isReadOnly = data.isReadOnly;

        /**
         * Indicates if it is possible to send messages to the channel
         * @type {boolean}
         */
        this.canSend = data.canSend;

        /**
         * Amount of messages unread
         * @type {number}
         */
        this.unreadCount = data.unreadCount;

        /**
         * Unix timestamp for when the last activity occurred
         * @type {number}
         */
        this.timestamp = data.t;

        /**
         * Indicates if the channel is muted or not
         * @type {boolean}
         */
        this.isMuted = data.isMuted;

        /**
         * Unix timestamp for when the mute expires
         * @type {number}
         */
        this.muteExpiration = data.muteExpiration;

        /**
         * Last message in the channel
         * @type {Message}
         */
        this.lastMessage = data.lastMessage ? new Message(super.client, data.lastMessage) : undefined;

        return super._patch(data);
    }
}

module.exports = Channel;
