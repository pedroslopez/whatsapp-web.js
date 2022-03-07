"use strict";

import fs from "fs/promises";
import path from "path";
import webp from "node-webpmux";
import { tmpdir } from "os";
import Crypto from "crypto";
import ffmpeg from "fluent-ffmpeg";
import { Page } from "puppeteer";
import { Readable } from "stream";
import { MessageMedia } from "../structures";

const has = (o: Object, k: string) =>
    Object.prototype.hasOwnProperty.call(o, k);

/**
 * Utility methods
 */
export class Util {
    constructor() {
        throw new Error(
            `The ${this.constructor.name} class may not be instantiated.`
        );
    }

    static generateHash(length: number) {
        var result = "";
        var characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }
        return result;
    }

    /**
     * Sets default properties on an object that aren't already specified.
     * @param {Object} def Default properties
     * @param {Object} given Object to assign defaults to
     */
    static mergeDefault(def: Object, given: Object) {
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
     * @returns media in webp format
     */
    static async formatImageToWebpSticker(media: MessageMedia, pupPage: Page) {
        if (!media.mimetype.includes("image"))
            throw new Error("media is not a image");

        if (media.mimetype.includes("webp")) {
            return media;
        }

        const stickerData = await pupPage.evaluate((media) => {
            return window.WWebJS.toStickerData(media);
        }, media.serialize());

        return new MessageMedia(stickerData.mimetype, stickerData.data);
    }

    /**
     * Formats a video to webp
     * @param {MessageMedia} media
     *
     * @returns media in webp format
     */
    static async formatVideoToWebpSticker(media: MessageMedia) {
        if (!media.mimetype.includes("video"))
            throw new Error("media is not a video");

        const videoType = media.mimetype.split("/")[1];

        const tempFile = path.join(
            tmpdir(),
            `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
        );

        const stream = new Readable();
        const buffer = Buffer.from(
            media.data.replace(`data:${media.mimetype};base64,`, ""),
            "base64"
        );
        stream.push(buffer);
        stream.push(null);

        await new Promise((resolve, reject) => {
            ffmpeg(stream)
                .inputFormat(videoType)
                .on("error", reject)
                .on("end", () => resolve(true))
                .addOutputOptions([
                    "-vcodec",
                    "libwebp",
                    "-vf",
                    // eslint-disable-next-line no-useless-escape
                    "scale='iw*min(300/iw,300/ih)':'ih*min(300/iw,300/ih)',format=rgba,pad=300:300:'(300-iw)/2':'(300-ih)/2':'#00000000',setsar=1,fps=10",
                    "-loop",
                    "0",
                    "-ss",
                    "00:00:00.0",
                    "-t",
                    "00:00:05.0",
                    "-preset",
                    "default",
                    "-an",
                    "-vsync",
                    "0",
                    "-s",
                    "512:512",
                ])
                .toFormat("webp")
                .save(tempFile);
        });

        const data = await fs.readFile(tempFile, "base64");
        await fs.unlink(tempFile);

        return new MessageMedia("image/webp", data, media.filename);
    }

    /**
     * Sticker metadata.
     * @typedef {Object} StickerMetadata
     * @property {string} [name]
     * @property {string} [author]
     * @property {string[]} [categories]
     */

    /**
     * Formats a media to webp
     * @param {MessageMedia} media
     * @param {StickerMetadata} metadata
     *
     * @returns media in webp format
     */
    static async formatToWebpSticker(
        media: MessageMedia,
        metadata: { name?: string; author?: string; categories?: string[] },
        pupPage: Page
    ) {
        let webpMedia: MessageMedia;

        if (media.mimetype.includes("image"))
            webpMedia = await this.formatImageToWebpSticker(media, pupPage);
        else if (media.mimetype.includes("video"))
            webpMedia = await this.formatVideoToWebpSticker(media);
        else throw new Error("Invalid media format");

        if (metadata?.name || metadata?.author) {
            const img = new webp.Image();
            const hash = this.generateHash(32);
            const stickerPackId = hash;
            const packname = metadata.name;
            const author = metadata.author;
            const categories = metadata.categories || [""];
            const json = {
                "sticker-pack-id": stickerPackId,
                "sticker-pack-name": packname,
                "sticker-pack-publisher": author,
                emojis: categories,
            };
            let exifAttr = Buffer.from([
                0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00,
                0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00,
                0x00, 0x00,
            ]);
            let jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");
            let exif = Buffer.concat([exifAttr, jsonBuffer]);
            exif.writeUIntLE(jsonBuffer.length, 14, 4);
            await img.load(Buffer.from(webpMedia.data, "base64"));
            img.exif = exif;
            webpMedia.data = (await img.save(null)).toString("base64");
        }

        return webpMedia;
    }

    /**
     * Configure ffmpeg path
     * @param {string} path
     */
    static setFfmpegPath(path: string) {
        ffmpeg.setFfmpegPath(path);
    }
}
