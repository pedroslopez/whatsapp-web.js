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

    _clone() {
        return Object.assign(Object.create(this), this);
      }
    
    _patch(data) { return data; }

    /**
     * Name that represents this model in the WhatsApp Web Store
     * @readonly
     */
    static get WAppModel() {
        return this.name;
    }

    /**
     * Extra fields to add to model serialization 
     * @readonly
     */
    static get extraFields() {
        return [];
    }

}

module.exports = Base;