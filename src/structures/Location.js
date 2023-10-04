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
         * Name for the location
         * @type {string|undefined}
         */
        this.name = options.name;

        /**
         * Location address
         * @type {string|undefined}
         */
        this.address = options.address;

        /**
         * URL address to be shown within a location message
         * @type {string|undefined}
         */
        this.url = options.url;

        /**
         * Location full description
         * @type {string|undefined}
         */
        this.description = this.name && this.address
            ? `${this.name}\n${this.address}`
            : this.name || this.address || '';
    }
}

module.exports = Location;