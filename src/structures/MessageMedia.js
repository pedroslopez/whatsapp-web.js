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
     * @param {Object} [options]
     * @param {boolean} [options.unsafeMime=false]
     * @param {string} [options.filename]
     * @param {object} [options.client]
     * @param {object} [options.reqOptions]
     * @param {number} [options.reqOptions.size=0]
     * @returns {Promise<MessageMedia>}
     */
    static async fromUrl(url, options = {}) {
        const pUrl = new URL(url);
        let mimetype = mime.getType(pUrl.pathname);

        if (!mimetype && !options.unsafeMime)
            throw new Error('Unable to determine MIME type using URL. Set unsafeMime to true to download it anyway.');

        async function fetchData (url, options) {
            const reqOptions = Object.assign({ headers: { accept: 'image/* video/* text/* audio/*' } }, options);
            const response = await fetch(url, reqOptions);
            const mime = response.headers.get('Content-Type');

            const contentDisposition = response.headers.get('Content-Disposition');
            const name = contentDisposition ? contentDisposition.match(/((?<=filename=")(.*)(?="))/) : null;

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
            
            return { data, mime, name };
        }

        const res = options.client
            ? (await options.client.pupPage.evaluate(fetchData, url, options.reqOptions))
            : (await fetchData(url, options.reqOptions));

        const filename = options.filename ||
            (res.name ? res.name[0] : (pUrl.pathname.split('/').pop() || 'file'));
        
        if (!mimetype)
            mimetype = res.mime;

        return new MessageMedia(mimetype, res.data, filename);
    }
    
    /** 
     * Securely saves the data to a file 
     * @paranm {string} filePath the path to where you want to save the file (no extensions)
     * @example <caption>Example usage of this function</caption>
     * const media = await msg.downloadMedia();
     * media.toFilePath('/home/purpshell/Documents/message') // the code adds the extension for you (if you enter a directory we will use the filename property (if it's null then we'll throw an error))
     * @returns {null} no need to return anything
     */
    async toFilePath(filePath) {
        const ext = mime.getExtension(this.mimetype);
        if (fs.existsSync(filePath)) {
            const stat = await fs.promises.stat(filePath);
            if (stat.isDirectory()) {
                if (this.filename){
                    filePath += this.filename;
                } else {
                    throw Error('You passed in a directory but the filename is empty');
                }
            }
        }
        if (!filePath.includes('.')) {
            filePath += `.${ext}`;   
        }
        await fs.promises.writeFile(filePath, this.data, 'base64');
    }
}

module.exports = MessageMedia;
