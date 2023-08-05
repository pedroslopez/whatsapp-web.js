'use strict';

/**
 * Poll send options
 * @typedef {Object} PollSendOptions
 * @property {boolean} [allowMultipleAnswers=false] If false it is a single choice poll, otherwise it is a multiple choice poll (false by default)
 */

/**
 * Poll information
 */
class Poll {
    /**
     * @param {string} pollName
     * @param {Array<string>} pollOptions
     * @param {PollSendOptions} pollSendOptions
     */
    constructor(pollName, pollOptions, pollSendOptions = {}) {
        /**
         * Poll name
         * @type {string}
         */
        this.pollName = pollName.trim();

        /**
         * Poll options
         * @type {Array<Object<string, number>>}
         */
        this.pollOptions = pollOptions.map((option, index) => ({
            name: option.trim(),
            localId: index
        }));

        /**
         * @type {PollSendOptions}
         */
        this.pollSendOptions = {
            allowMultipleAnswers: pollSendOptions.allowMultipleAnswers === true
        };
    }
}

module.exports = Poll;