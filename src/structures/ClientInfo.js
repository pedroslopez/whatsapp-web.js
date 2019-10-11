'use strict';

const Base = require('./Base');

/**
 * Current connection information
 * @extends {Base}
 */
class ClientInfo extends Base {
    constructor(client, data) {
        super(client);

        if(data) this._patch(data);
    }

    _patch(data) {
        this.pushname = data.pushname;
        this.me = data.me;
        this.phone = data.phone;
        this.platform = data.platform;

        return super._patch(data);
    }

}

module.exports = ClientInfo;