'use strict';

const Base = require('./Base');

/**
 * Represents a Reaction on WhatsAppBusiness
 * @extends {Base}
 */
class Reaction extends Base {
    constructor(client, data) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data) {
        this.value = data;
        return super._patch(data);
    }
}

module.exports = Reaction;