'use strict';

const MessageMedia = require('./MessageMedia');

/**
 * Message type buttons
 */
class Buttons {
    /**
     * @param {string|MessageMedia} body
     * @param {Array<Array<string>>} buttons
     * @param {string?} title
     * @param {string?} footer
     */
    constructor(body,buttons , title, footer) {
        /**
         * Message body
         * @type {string|MessageMedia}
         */
        this.body = body;

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
         * buttons of message
         * @type {Array<Array<string>>}
         */
        this.buttons = buttons;
        
        if (body instanceof MessageMedia) {
            this.type = 'image';
            this.title = '';
        }else{
            this.type = 'chat';
        }
        
    }
}

module.exports = Buttons;