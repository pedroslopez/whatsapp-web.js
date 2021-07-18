'use strict';

const fs = require('fs');
const path = require('path');
const mime = require('mime');
const fetch = require('node-fetch');
const { URL } = require('url');

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

    /**
     * Creates a MessageMedia instance from a URL
     * @param {string} url
     * @param {number} [sizeLimit=0]
     * @returns {Promise<MessageMedia>}
     */
    static fromUrl(url, sizeLimit = 0) {
        return new Promise((resolve, reject) => {
            const pUrl = new URL(url);
            const mimetype = mime.getType(pUrl.pathname);

            if (!mimetype) {
                return reject(new Error('Unable to determine MIME type'));
            }

            fetch(url, { size: sizeLimit, headers: { accept: 'image/* video/* text/* audio/*' } })
                .then(async res => {
                    if (!res.ok) { return reject(new Error('Failed to download media')); }

                    const buf = await res.buffer();
                    const data = buf.toString('base64');
                    const media = new MessageMedia(mimetype, data, null);

                    return resolve(media);
                })
                .catch(err => reject(err));
        });
    }
}

module.exports = MessageMedia;