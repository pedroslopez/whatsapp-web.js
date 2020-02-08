'use strict';

/**
 * Location information
 */
class Location {
    /**
     * @param {number} latitude
     * @param {number} longitude
     * @param {?string} descriptionon 
     */
    constructor(latitude, longitude, description) {
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
         * @type {?string}
         */
        this.description = description;
    }
}

module.exports = Location;