'use strict';

const MessageMedia = require('./MessageMedia');

/**
 * Button spec used in Buttons constructor
 * @typedef {Object} ButtonSpec
 * @property {string} body - The text to show on the button.
 * @property {string=} id - Custom ID to set on the button. A random one will be generated if one is not passed.
 * @property {string=} url - Custom URL to set on the button. Optional and will change the type of the button
 * @property {string=} number - Custom URL to set on the button. Optional and will change the type of the button
 */

/**
 * @typedef {Object} FormattedButtonSpec
 * @property {number} index
 * @property {{displayText: string, url: string}=} urlButton
 * @property {{displayText: string, phoneNumber: string}=} callButton
 * @property {{displayText: string, id: string}=} quickReplyButton
 */

/**
 * Message type buttons
 */
class Buttons {
    /**
     * @param {string|MessageMedia} body
     * @param {ButtonSpec[]} buttons - See {@link ButtonSpec}
     * @param {string?} title
     * @param {string?} footer
     */
    constructor(body, buttons, title, footer) {
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

        if (body instanceof MessageMedia) {
            this.type = 'media';
            this.title = '';
        }else{
            this.type = 'chat';
        }

        /**
         * buttons of message
         * @type {FormattedButtonSpec[]}
         */
        this.buttons = this._format(buttons);
        if(!this.buttons.length){ throw '[BT01] No buttons';}
                
    }

    /**
     * Creates button array from simple array
     * @param {ButtonSpec[]} buttons
     * @returns {FormattedButtonSpec[]}
     */
    _format(buttons){
        // Limit the buttons (max 3 of regular and 2 of special buttons)
        const templateButtons = buttons.filter(button => button.url || button.number).slice(0,2);
        const regularButtons = buttons.filter(button => !button.url && !button.number).slice(0,3);
        buttons = templateButtons.concat(regularButtons);

        return buttons.map((button, index) => {
            if (button.url && button.number && button.id) throw 'Only pick one of the following (url/number/id)';
            if (button.number) {
                return {
                    index,
                    callButton: {
                        displayText: button.body, 
                        phoneNumber: button.number || ''
                    }
                };
            } else if (button.url) {
                return {
                    index,
                    urlButton: {
                        displayText: button.body, 
                        url: button.url || ''
                    }
                };
            } else {
                return {
                    index,
                    quickReplyButton: {
                        displayText: button.body, 
                        id: button.id || `${index}`
                    }
                };
            }

        });
    }
    
}

module.exports = Buttons;
