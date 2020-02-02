'use strict';

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * Utility methods
 */
class Util {

    constructor() {
        throw new Error(`The ${this.constructor.name} class may not be instantiated.`);
    }

    /**
     * Sets default properties on an object that aren't already specified.
     * @param {Object} def Default properties
     * @param {Object} given Object to assign defaults to
     * @returns {Object}
     * @private
     */
    static mergeDefault(def, given) {
        if (!given) return def;
        for (const key in def) {
            if (!has(given, key) || given[key] === undefined) {
                given[key] = def[key];
            } else if (given[key] === Object(given[key])) {
                given[key] = Util.mergeDefault(def[key], given[key]);
            }
        }

        return given;
    }
}

module.exports = Util;