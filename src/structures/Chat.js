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

        this.name = data.formattedTitle;
        this.isGroup = data.isGroup;
        this.isReadOnly = data.isReadOnly;
        this.unreadCount = data.unreadCount;
        this.timestamp = data.t;

        return super._patch(data);
    }

    sendMessage(message) {
        return this.client.sendMessage(this.id._serialized, message);
    }
}

module.exports = Chat;