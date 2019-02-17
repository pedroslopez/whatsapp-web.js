'use strict';

/**
 * Represents a data model
 */
class Base {
    constructor(client) {
        /**
         * The client that instantiated this
         * @readonly
         */
        Object.defineProperty(this, 'client', { value: client });
    }
}

module.exports = Base;