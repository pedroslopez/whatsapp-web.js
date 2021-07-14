'use strict';

/**
 * Message type buttons
 */
class Buttons {
    /**
     * @param {string|MessageMedia} body
     * @param {string?} title
     * @param {string?} footer
     * @param {Array<Array<string>>} buttons
     */
    constructor(body, title, footer, buttons) {
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