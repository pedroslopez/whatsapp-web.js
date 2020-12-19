'use strict';

const sharp = require('sharp');
const path = require('path');
const Crypto = require('crypto');
const { tmpdir } = require('os');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;

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

    /**
     * Formats a image to webp
     * @param {MessageMedia} media
     * 
     * @returns {Promise<MessageMedia>} media in webp format
     */
    static async formatImageToWebpSticker(media) {
        if (!media.mimetype.includes('image'))
            throw new Error('media is not a image');
      
        if (media.mimetype.includes('webp')) {
            return media;
        }
      
        const buff = Buffer.from(media.data, 'base64');
      
        let sharpImg = sharp(buff);
        sharpImg = sharpImg.webp();
      
        sharpImg = sharpImg.resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        });
      
        let webpBase64 = (await sharpImg.toBuffer()).toString('base64');
      
        return {             
            mimetype: 'image/webp',
            data: webpBase64,
            filename: media.filename,
        };
    }
      
    /**
     * Formats a video to webp
     * @param {MessageMedia} media
     * 
     * @returns {Promise<MessageMedia>} media in webp format
     */
    static async formatVideoToWebpSticker(media) {
        if (!media.mimetype.includes('video'))
            throw new Error('media is not a video');
      
        const videoType = media.mimetype.split('/')[1];

        const tempFile = path.join(
            tmpdir(),
            `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
        );
      
        const stream = new (require('stream').Readable)();
        const buffer = Buffer.from(
            media.data.replace(`data:${media.mimetype};base64,`, ''),
            'base64'
        );
        stream.push(buffer);
        stream.push(null);

        await new Promise((resolve, reject) => {
            ffmpeg(stream)
                .inputFormat(videoType)
                .on('error', reject)
                .on('end', () => resolve(true))
                .addOutputOptions([
                    '-vcodec',
                    'libwebp',
                    '-vf',
                    // eslint-disable-next-line no-useless-escape
                    'scale=\'iw*min(300/iw\,300/ih)\':\'ih*min(300/iw\,300/ih)\',format=rgba,pad=300:300:\'(300-iw)/2\':\'(300-ih)/2\':\'#00000000\',setsar=1,fps=10',
                    '-loop',
                    '0',
                    '-ss',
                    '00:00:00.0',
                    '-t',
                    '00:00:05.0',
                    '-preset',
                    'default',
                    '-an',
                    '-vsync',
                    '0',
                    '-s',
                    '512:512',
                ])
                .toFormat('webp')
                .save(tempFile);
        });
      
        const data = await fs.readFile(tempFile, 'base64');
        await fs.unlink(tempFile);
      
        return {             
            mimetype: 'image/webp',
            data: data,
            filename: media.filename,
        };
    }
      
    /**
     * Formats a media to webp
     * @param {MessageMedia} media
     * 
     * @returns {Promise<MessageMedia>} media in webp format
     */
    static async formatToWebpSticker(media) {
        if (media.mimetype.includes('image')) return this.formatImageToWebpSticker(media);
        else if (media.mimetype.includes('video')) return this.formatVideoToWebpSticker(media);
        else throw new Error('Invalid media format');
    }

    /**
     * Configure ffmpeg path
     * @param {string} path
     */
    static setFfmpegPath(path) {
        ffmpeg.setFfmpegPath(path);
    }
}

module.exports = Util;