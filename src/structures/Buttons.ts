"use strict";

import { Util } from "../util/Util";
import { MessageMedia } from "./MessageMedia";

/**
 * Button spec used in Buttons constructor
 * @typedef {Object} ButtonSpec
 * @property {string=} id - Custom ID to set on the button. A random one will be generated if one is not passed.
 * @property {string} body - The text to show on the button.
 */

/**
 * @typedef {Object} FormattedButtonSpec
 * @property {string} buttonId
 * @property {number} type
 * @property {Object} buttonText
 */

export interface ButtonSpec {
    id?: string;
    body: string;
}

export interface FormattedButtonSpec {
    buttonId: string;
    type: number;
    buttonText: {
        displayText: string;
    };
}

/**
 * Message type buttons
 */
export class Buttons {
    body: string | MessageMedia;
    buttons: FormattedButtonSpec[];
    title?: string;
    footer?: string;
    type: "media" | "chat";

    /**
     * @param {string|MessageMedia} body
     * @param {ButtonSpec[]} buttons - See {@link ButtonSpec}
     * @param {string?} title
     * @param {string?} footer
     */
    constructor(
        body: string | MessageMedia,
        buttons: ButtonSpec[],
        title?: string,
        footer?: string
    ) {
        /**
         * Message body
         */
        this.body = body;

        /**
         * title of message
         */
        this.title = title;

        /**
         * footer of message
         * @type {string}
         */
        this.footer = footer;

        if (body instanceof MessageMedia) {
            this.type = "media";
            this.title = "";
        } else {
            this.type = "chat";
        }

        /**
         * buttons of message
         * @type {FormattedButtonSpec[]}
         */
        this.buttons = this._format(buttons);
        if (!this.buttons.length) {
            throw "[BT01] No buttons";
        }
    }

    /**
     * Creates formatted button array from simple array
     * @example
     * Input: [{id:'customId',body:'button1'},{body:'button2'},{body:'button3'},{body:'button4'}]
     * Returns: [{ buttonId:'customId',buttonText:{'displayText':'button1'},type: 1 },{buttonId:'n3XKsL',buttonText:{'displayText':'button2'},type:1},{buttonId:'NDJk0a',buttonText:{'displayText':'button3'},type:1}]
     */
    _format(buttons: ButtonSpec[]): FormattedButtonSpec[] {
        buttons = buttons.slice(0, 3); // phone users can only see 3 buttons, so lets limit this
        return buttons.map((btn) => {
            return {
                buttonId: btn.id ? String(btn.id) : Util.generateHash(6),
                buttonText: { displayText: btn.body },
                type: 1,
            };
        });
    }
}
