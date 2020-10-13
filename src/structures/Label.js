'use strict';

/**
 * Whatsapp Business Label information
 */
class Label {
    /**
     * @param {object} label_raw_data
     */
    constructor(labelData){
        /**
         * Label name
         * @type {string}
         */
        this.name = labelData.name;

        /**
         * Label hex color
         * @type {string}
         */
        this.hexColor = labelData.hexColor;

        /**
         * Label id
         * @type {string}
         */
        this.id = labelData.id;
    }

}

module.exports = Label;