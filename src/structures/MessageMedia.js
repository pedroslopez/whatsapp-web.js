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
 * @param {?string} filename Document file name. Value can be null
 * @param {?number} filesize Document file size in bytes. Value can be 0
 */
class MessageMedia {
    constructor(mimetype, data, filename, filesize = 0) {
        /**
         * MIME type of the attachment
         * @type {string}
         */
        this.mimetype = mimetype;

        /**
         * Base64-encoded data of the file
         * @type {string}
         */
        this.data = data;

        /**
         * Document file name. Value can be null
         * @type {?string}
         */
        this.filename = filename;

        /**
         * Document file size in bytes. Value can be 0
         * @type {?number}
         */
        this.filesize = filesize;
    }

    /**
     * Creates a MessageMedia instance from a local file path
     * @param {string} filePath 
     * @param {?boolean} returnSize if true, gets the file size, defaults to false to save IO
     * @returns {MessageMedia}
     */
    static fromFilePath(filePath, returnSize = false) {
        const b64data = fs.readFileSync(filePath, {encoding: 'base64'});
        const mimetype = mime.getType(filePath); 
        const filename = path.basename(filePath);
        let filesize = 0;
        if (returnSize) filesize = fs.statSync(filePath).size;
        return new MessageMedia(mimetype, b64data, filename, filesize);
    }

    /**
     * Creates a MessageMedia instance from a URL
     * @param {string} url
     * @param {Object} [options]
     * @param {number} [options.unsafeMime=false]
     * @param {object} [options.client]
     * @param {object} [options.reqOptions]
     * @param {number} [options.reqOptions.size=0]
     * @returns {Promise<MessageMedia>}
     */
    static async fromUrl(url, options = {}) {
        let mimetype;

        if (!options.unsafeMime) {
            const pUrl = new URL(url);
            mimetype = mime.getType(pUrl.pathname);

            if (!mimetype)
                throw new Error('Unable to determine MIME type');
        }

        async function fetchData (url, options) {
            const reqOptions = Object.assign({ headers: { accept: 'image/* video/* text/* audio/*' } }, options);
            const response = await fetch(url, reqOptions);
            const mime = response.headers.get('Content-Type');
            const size = response.headers.get('Content-Length');
            let data = '';

            if (response.buffer) {
                data = (await response.buffer()).toString('base64');
            } else {
                const bArray = new Uint8Array(await response.arrayBuffer());
                bArray.forEach((b) => {
                    data += String.fromCharCode(b);
                });
                data = btoa(data);
            }
            
            return { data, mime, size };
        }

        const res = options.client
            ? (await options.client.pupPage.evaluate(fetchData, url, options.reqOptions))
            : (await fetchData(url, options.reqOptions));

        if (!mimetype)
            mimetype = res.mime;

        return new MessageMedia(mimetype, res.data, null, res.size || null);
    }
}

module.exports = MessageMedia;
