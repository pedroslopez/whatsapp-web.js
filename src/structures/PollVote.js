'use strict';

const Message = require('./Message');
const Base = require('./Base');

/**
 * Selected poll option structure
 * @typedef {Object} SelectedPollOption
 * @property {number} id The local selected option ID
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
         * The selected poll option
         * @type {SelectedPollOption}
         */
        this.selectedOption = {
            id: data.selectedOptionLocalIds[0],
            name: data.parentMessage.pollOptions.find((x) => x.localId === data.selectedOptionLocalIds[0]).name
        };

        /**
         * The person who voted
         * @type {string}
         */
        this.voter = data.sender;

        /**
         * Timestamp the the poll was voted
         * @type {number}
         */
        this.senderTimestampMs = data.senderTimestampMs;

        /**
         * The poll creation message associated with the poll vote
         * @type {Message}
         */
        this.parentMessage = new Message(this.client, data.parentMessage);

        return super._patch(data);
    }
}

module.exports = PollVote;
