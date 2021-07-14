'use strict';

const MessageMedia = require('./MessageMedia');
const Util = require('../util/Util');
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
            // throw '[BT02] MessageMedia not ready';
            this.type = 'media';
            this.title = '';
        }else{
            this.type = 'chat';
        }

        /**
         * buttons of message
         * @type {Array<Array<string>>}
         */
        this.buttons = this._format(buttons);
        if(!this.buttons.length){ throw '[BT01] No buttons';}
                
    }

    /**
     * Creates button array from simple array
     * @param {Array<Array<string>>} buttons
     * @returns {Array<Array<string>>}
     * @example 
     * Input: [{body:"button1"},{body:"button2"},{body:"button3"},{body:"button4"}]
     * Returns: [{ buttonId:'vwnhjM',buttonText:{"displayText":"button1"},type: 1 },{buttonId:'n3XKsL',buttonText:{"displayText":"button2"},type:1},{buttonId:'NDJk0a',buttonText:{"displayText":"button3"},type:1}]
     */
    _format(buttons){
        buttons = buttons.slice(0,3); // phone users can only see 3 buttons, so lets limit this
        let out = [];
        for (let btn of buttons) { //currently only type '1' is supported so lets just create the new array
            out.push({'buttonId':Util.generateHash(6),'buttonText':{'displayText':btn.body},'type':1})
        }
        return out;
    }
    
}

module.exports = Buttons;