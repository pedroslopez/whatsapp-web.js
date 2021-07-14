'use strict';

/**
 * Message type List
 */
class List {
    /**
     * @param {string} body
     * @param {string} buttonText
     * @param {string?} title
     * @param {string?} footer
     * @param {Array<Array<string>>} sections
     */
    constructor(body,buttonText, title, footer, sections) {
        /**
         * Message body
         * @type {string}
         */
        this.body = body;

        /**
         * List button text
         * @type {string}
         */
        this.buttonText = buttonText;
        
        /**
         * title of message
         * @type {string}
         */
        this.title = title;

        /**
         * footer of message
         * @type {string}
         */
        this.footer = footer;

        /**
         * sections of message
         * @type {Array<Array<string>>}
         */
        this.sections = sections;
        

    }
}

module.exports = List;