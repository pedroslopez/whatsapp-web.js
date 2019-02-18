'use strict';

const Base = require('./Base');

/**
 * Represents a Message on WhatsApp
 * @extends {Base}
 */
class Message extends Base {
    constructor(client, data) {
        super(client);

        if(data) this._patch(data);
    }

    _patch(data) {
        this.id = data.id;
        this.body = data.body;
        this.type = data.type;
        this.timestame = data.t;
        this.from = data.from;
        this.to = data.to;
        this.author = data.author;
        this.isForwarded = data.isForwarded;
        this.broadcast = data.broadcast;
    }

    getChat() {
        return this.client.getChatById(this.from);
    }

    static get WAppModel() {
        return 'Msg';
    }
}

module.exports = Message;