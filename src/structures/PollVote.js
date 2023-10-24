'use strict';

const Message = require('./Message');
const Base = require('./Base');

/**
 * Selected poll option structure
 * @typedef {Object} SelectedPollOption
 * @property {number} id The local selected or deselected option ID
 * @property {string} name The option name
 */

/**
 * Represents a Poll Vote on WhatsApp
 * @extends {Base}
 */
class PollVote extends Base {
    constructor(client, data) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data) {
        /**
         * The person who voted
         * @type {string}
         */
        this.voter = data.sender;

        /**
         * The selected poll option(s)
         * If it's an empty array, the user hasn't selected any options on the poll,
         * may occur when they deselected all poll options
         * @type {SelectedPollOption[]}
         */
        this.selectedOptions =
            data.selectedOptionLocalIds.length > 0
                ? data.selectedOptionLocalIds.map((e) => ({
                    id: e,
                    name: data.parentMessage.pollOptions.find((x) => x.localId === e).name
                }))
                : [];

        /**
         * Timestamp the option was selected or deselected
         * @type {number}
         */
        this.interractedAt = data.senderTimestampMs;

        /**
         * The message secret key of a poll creation message
         * @type {Array}
         */
        this.messageSecret = Object.keys(data.parentMessage.messageSecret).map((key) =>  data.parentMessage.messageSecret[key]);

        /**
         * The poll creation message associated with the poll vote
         * @type {Message}
         */
        this.parentMessage = new Message(this.client, data.parentMessage);

        return super._patch(data);
    }
}

module.exports = PollVote;
