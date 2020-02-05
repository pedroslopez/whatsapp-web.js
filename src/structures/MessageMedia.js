'use strict';

/**
 * Media attached to a message
 * @param {string} mimetype MIME type of the attachment
 * @param {string} data Base64-encoded data of the file
 * @param {?string} filename Document file name
 */
class MessageMedia {
    constructor(mimetype, data, filename) {
        /**
         * MIME type of the attachment
         * @type {string}
         */
        this.mimetype = mimetype;

        /**
         * Base64 encoded data that represents the file
         * @type {string}
         */
        this.data = data;

        /**
         * Name of the file (for documents)
         * @type {?string}
         */
        this.filename = filename;
    }
}

module.exports = MessageMedia;