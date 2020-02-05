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
        /**
         * Name configured to be shown in push notifications
         * @type {string}
         */
        this.pushname = data.pushname;

        /**
         * Current user ID
         * @type {object}
         */
        this.me = data.me;

        /**
         * Information about the phone this client is connected to
         * @type {object}
         * @property {string} wa_version WhatsApp Version running on the phone
         * @property {string} os_version OS Version running on the phone (iOS or Android version)
         * @property {string} device_manufacturer Device manufacturer
         * @property {string} device_model Device model
         * @property {string} os_build_number OS build number
         */
        this.phone = data.phone;

        /**
         * Platform the phone is running on
         * @type {string}
         */
        this.platform = data.platform;

        return super._patch(data);
    }

}

module.exports = ClientInfo;