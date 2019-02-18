'use strict';

const Base = require('./Base');

/**
 * Represents a Chat on WhatsApp
 * @extends {Base}
 */
class Chat extends Base {
    constructor(client, data) {
        super(client);

        if(data) this._patch(data);
    }

    _patch(data) {
        this.id = data.id;

        this.isGroup = data.isGroup;
        this.isReadOnly = data.isReadOnly;
        this.name = data.name;
        this.unreadCount = data.unreadCount;
        this.timestamp = data.t;
    }

    sendMessage(message) {
        return this.client.sendMessage(this.id._serialized, message);
    }

    static get extraFields() {
        return [
            'formattedTitle',
            'isGroup'
        ];
    }
}

module.exports = Chat;