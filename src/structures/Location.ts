"use strict";

/**
 * Location information
 */
export class Location {
    latitude: number;
    longitude: number;
    description?: string;

    constructor(latitude: number, longitude: number, description?: string) {
        /**
         * Location latitude
         */
        this.latitude = latitude;

        /**
         * Location longitude
         */
        this.longitude = longitude;

        /**
         * Name for the location
         */
        this.description = description;
    }
}
