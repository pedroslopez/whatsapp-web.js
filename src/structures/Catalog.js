'use strict';

const Base = require('./Base');

/**
 * Represents Catalog on WhatsApp Business
 * @extends {Base}
 */
class Catalog extends Base {
    constructor(client, data) {
        super(client);

        if(data) this._patch(data);
    }

    _patch(data) {
        this.userid = data.userid;
        return super._patch(data);
    }
}

module.exports = Catalog; 