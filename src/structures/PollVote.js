'use strict';

const Base = require('./Base');

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
        /** The options selected in this Poll vote */
        this.selectedOptions = data.selectedOptionLocalIds.filter(value => value == 1).map((value, selectedOptionLocalId) => {
            return data.pollCreationMessage.pollOptions.find(a => a.localId == selectedOptionLocalId).name;
        });

        /** Sender of the Poll vote */
        this.sender = data.sender;

        /** Timestamp of the time it was sent in milliseconds */
        this.senderTimestampMs = data.senderTimestampMs;

        return super._patch(data);
    }
}

module.exports = PollVote;