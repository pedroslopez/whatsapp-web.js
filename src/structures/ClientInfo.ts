'use strict';

import { Client } from "../Client";
import { Base } from "./Base";
import { ContactId } from "./Contact";

/**
 * Current connection information
 * @extends {Base}
 */
export class ClientInfo extends Base {
    pushname: string;
    wid: ContactId;
    me: ContactId;
    phone: { 
        wa_version: string; 
        os_version: string; 
        device_manufacturer: string;
        device_model: string;
        os_build_number: string;
    };
    platform: string;

    constructor(client: Client, data: Record<string, any>) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data: Record<string, any>) {
        /**
         * Name configured to be shown in push notifications
         * @type {string}
         */
        this.pushname = data.pushname;

        /**
         * Current user ID
         * @type {object}
         */
        this.wid = data.wid;

        /**
         * @type {object}
         * @deprecated Use .wid instead
         */
        this.me = data.wid;

        /**
         * Information about the phone this client is connected to. Not available in multi-device.
         * @type {object}
         * @property {string} wa_version WhatsApp Version running on the phone
         * @property {string} os_version OS Version running on the phone (iOS or Android version)
         * @property {string} device_manufacturer Device manufacturer
         * @property {string} device_model Device model
         * @property {string} os_build_number OS build number
         * @deprecated
         */
        this.phone = data.phone;

        /**
         * Platform WhatsApp is running on
         * @type {string}
         */
        this.platform = data.platform;

        return super._patch(data);
    }

    /**
     * Get current battery percentage and charging status for the attached device
     * @deprecated
     */
    async getBatteryStatus() {
        return await this.client.pupPage.evaluate(() => {
            const { battery, plugged } = window.Store.Conn;
            return { battery, plugged } as {battery: number; plugged: boolean};
        });
    }
}
