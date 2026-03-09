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
 * @param {?number} filesize Document file size in bytes. Value can be null
 */
class MessageMedia {
    constructor(mimetype, data, filename, filesize) {
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
         * Document file name. Value can be null
         * @type {?string}
         */
        this.filename = filename;
        
        /**
         * Document file size in bytes. Value can be null
         * @type {?number}
         */
        this.filesize = filesize;
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

        try {
            const headResponse = await fetch(url, { method: 'HEAD' });
            const contentLength = headResponse.headers.get('Content-Length');

            if (contentLength) {
                const fileSizeBytes = parseInt(contentLength);
                const fileSizeMB = fileSizeBytes / (1024 * 1024);

                const whatsappLimits = {
                    'image/': 16,
                    'video/': 64,
                    'audio/': 16,
                    'application/': 100,
                    'text/': 100,
                    'default': 64
                };

                const preliminaryMimetype = mimetype || headResponse.headers.get('Content-Type') || '';
                let maxSizeMB = whatsappLimits.default;

                for (const [type, limit] of Object.entries(whatsappLimits)) {
                    if (type !== 'default' && preliminaryMimetype.startsWith(type)) {
                        maxSizeMB = limit;
                        break;
                    }
                }

                if (fileSizeMB > maxSizeMB) {
                    const error = new Error(
                        `File size (${fileSizeMB.toFixed(2)}MB) exceeds WhatsApp limit for ${preliminaryMimetype} (${maxSizeMB}MB). ` +
                        `Maximum allowed: ${maxSizeMB}MB, Got: ${fileSizeMB.toFixed(2)}MB`
                    );
                    error.code = 'FILE_TOO_LARGE';
                    error.fileSize = fileSizeMB;
                    error.maxSize = maxSizeMB;
                    error.mimetype = preliminaryMimetype;
                    throw error;
                }

                if (fileSizeMB > 50) {
                    console.warn(`⚠️  Large file detected (${fileSizeMB.toFixed(2)}MB). This may take longer to process.`);
                }
            } else {
                console.warn('⚠️  Could not determine file size from headers. Proceeding with download...');
            }
        } catch (headError) {
            if (headError.code === 'FILE_TOO_LARGE') {
                throw headError;
            }
            console.warn('⚠️  HEAD request failed, proceeding with download:', headError.message);
        }
        
        async function fetchData (url, options) {
            const reqOptions = Object.assign({ headers: { accept: 'image/* video/* text/* audio/*' } }, options);
            const response = await fetch(url, reqOptions);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const mime = response.headers.get('Content-Type');
            const size = response.headers.get('Content-Length');

            const contentDisposition = response.headers.get('Content-Disposition');
            const name = contentDisposition ? contentDisposition.match(/((?<=filename=")(.*)(?="))/) : null;

            let data = '';

            if (response.buffer) {
                const buffer = await response.buffer();

                const actualSizeMB = buffer.length / (1024 * 1024);

                if (actualSizeMB > 64) {
                    const error = new Error(
                        `Downloaded file size (${actualSizeMB.toFixed(2)}MB) exceeds WhatsApp general limit (64MB)`
                    );
                    error.code = 'DOWNLOADED_FILE_TOO_LARGE';
                    error.actualSize = actualSizeMB;
                    throw error;
                }

                data = buffer.toString('base64');
            } else {
                const arrayBuffer = await response.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                const actualSizeMB = uint8Array.length / (1024 * 1024);

                if (actualSizeMB > 64) {
                    const error = new Error(
                        `Downloaded file size (${actualSizeMB.toFixed(2)}MB) exceeds WhatsApp general limit (64MB)`
                    );
                    error.code = 'DOWNLOADED_FILE_TOO_LARGE';
                    error.actualSize = actualSizeMB;
                    throw error;
                }

                let binary = '';
                uint8Array.forEach((byte) => {
                    binary += String.fromCharCode(byte);
                });
                data = btoa(binary);
            }

            return { data, mime, name, size };
        }

        const res = options.client
            ? (await options.client.pupPage.evaluate(fetchData, url, options.reqOptions))
            : (await fetchData(url, options.reqOptions));

        const filename = options.filename ||
            (res.name ? res.name[0] : (pUrl.pathname.split('/').pop() || 'file'));

        if (!mimetype)
            mimetype = res.mime;

        const filesize = res.size ? parseInt(res.size) : null;

        if (!res.data || !res.data.length) {
            throw new Error('Downloaded file is empty or invalid');
        }

        const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(res.data);
        if (!isValidBase64) {
            throw new Error('Downloaded file data is not valid base64');
        }
        
        return new MessageMedia(mimetype, res.data, filename, filesize);
    }
}

module.exports = MessageMedia;
