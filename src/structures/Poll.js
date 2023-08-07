'use strict';

/**
 * Poll send options
 * @typedef {Object} PollSendOptions
 * @property {boolean} [allowMultipleAnswers=false] If false it is a single choice poll, otherwise it is a multiple choice poll (false by default)
 */

/** Represents a Poll on WhatsApp */
class Poll {
    /**
     * @param {string} pollName
     * @param {Array<string>} pollOptions
     * @param {PollSendOptions} pollSendOptions
     */
    constructor(pollName, pollOptions, pollSendOptions = {}) {
        /**
         * The name of the poll
         * @type {string}
         */
        this.pollName = pollName.trim();

        /**
         * The array of poll options
         * @type {Array<Object<string, number>>}
         */
        this.pollOptions = pollOptions.map((option, index) => ({
            name: option.trim(),
            localId: index
        }));

        /**
         * The send options for the poll
         * @type {PollSendOptions}
         */
        this.pollSendOptions = {
            allowMultipleAnswers: pollSendOptions.allowMultipleAnswers === true
        };
    }
}

module.exports = Poll;