'use strict';

/**
 * Poll information
 */
class Poll {
    /**
     * @param {string} pollName
     * @param {Array<string>} pollOptions
     * @param {?boolean} [allowMultipleAnswers=false] 
     */
    constructor(pollName, pollOptions, allowMultipleAnswers) {
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
         * Boolean parameter,
         * if false it is a single choice poll,
         * otherwise it is a multiple choice poll (false by default)
         * @type {?boolean}
         * @default false
         */
        this.allowMultipleAnswers = allowMultipleAnswers === undefined ? false : allowMultipleAnswers;
    }
}

module.exports = Poll;