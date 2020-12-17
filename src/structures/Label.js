'use strict';

const Base = require('./Base');
// eslint-disable-next-line no-unused-vars
const Chat = require('./Chat');

/**
 * WhatsApp Business Label information
 */
class Label extends Base {
    /**
     * @param {Base} client
     * @param {object} labelData
     */
    constructor(client, labelData){
        super(client);

        if(labelData) this._patch(labelData);
    }

    _patch(labelData){
        /**
         * Label name
         * @type {string}
         */
        this.name = labelData.name;

        /**
         * Label hex color
         * @type {string}
         */
        this.hexColor = labelData.hexColor;

        /**
         * Label id
         * @type {string}
         */
        this.id = labelData.id;
    }
    /**
     * Get all chats with this label assigned.
     * @returns {Promise<Array<Chat>>>}
     */
    async getChats(){
        return this.client.getChatsByLabelId(this.id);
    }

}

module.exports = Label;