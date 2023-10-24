'use strict';

/**
 * Location send options
 * @typedef {Object} LocationSendOptions
 * @property {string} [name] Location name
 * @property {string} [address] Location address
 * @property {string} [url] URL address to be shown within a location message
 */

/**
 * Location information
 */
class Location {
    /**
     * @param {number} latitude
     * @param {number} longitude
     * @param {LocationSendOptions} [options] Location send options
     */
    constructor(latitude, longitude, options = {}) {
        /**
         * Location latitude
         * @type {number}
         */
        this.latitude = latitude;

        /**
         * Location longitude
         * @type {number}
         */
        this.longitude = longitude;

        /**
         * Location full options
         * @type {LocationSendOptions}
         */
        this.options = {
            address: options.address,
            name: options.name,
            url: options.url,
        };
    }
}

module.exports = Location;