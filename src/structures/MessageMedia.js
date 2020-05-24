'use strict';

const fs = require('fs');
const path = require('path');
const mime = require('mime');

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

    /**
     * Creates a MessageMedia instance from a local file path
     * @param {string} filePath 
     * @returns {MessageMedia}
     */
    static fromFilePath(filePath) {
        const b64data = fs.readFileSync(filePath, {encoding: 'base64'});
        const mimetype = mime.getType(filePath); 
        const filename = path.basename(filePath);

        return new MessageMedia(mimetype, b64data, filename);
    }
}

module.exports = MessageMedia;