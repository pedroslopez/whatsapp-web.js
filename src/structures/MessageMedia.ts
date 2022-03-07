"use strict";

import fs from "fs";
import path from "path";
import mime from "mime";
import fetch from "node-fetch";
import { URL } from "url";
import { Client } from "../Client";

/**
 * Media attached to a message
 * @param {string} mimetype MIME type of the attachment
 * @param {string} data Base64-encoded data of the file
 * @param {?string} filename Document file name
 */
export class MessageMedia {
    mimetype: string;
    data: string;
    filename?: string;

    constructor(mimetype: string, data: string, filename?: string) {
        /**
         * MIME type of the attachment
         */
        this.mimetype = mimetype;

        /**
         * Base64 encoded data that represents the file
         */
        this.data = data;

        /**
         * Name of the file (for documents)
         */
        this.filename = filename;
    }

    serialize() { return JSON.parse(JSON.stringify(this)); }

    /**
     * Creates a MessageMedia instance from a local file path
     * @param {string} filePath
     */
    static fromFilePath(filePath: string) {
        const b64data = fs.readFileSync(filePath, { encoding: "base64" });
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
     */
    static async fromUrl(
        url: string,
        options: {
            unsafeMime?: boolean;
            filename?: string;
            client?: Client;
            reqOptions?: any;
        } = {}
    ) {
        const pUrl = new URL(url);
        let mimetype = mime.getType(pUrl.pathname);

        if (!mimetype && !options.unsafeMime)
            throw new Error(
                "Unable to determine MIME type using URL. Set unsafeMime to true to download it anyway."
            );

        async function fetchData(url: string, options: any) {
            const reqOptions = Object.assign(
                { headers: { accept: "image/* video/* text/* audio/*" } },
                options
            );
            const response = await fetch(url, reqOptions);
            const mime = response.headers.get("Content-Type");

            const contentDisposition = response.headers.get(
                "Content-Disposition"
            );
            const name = contentDisposition
                ? contentDisposition.match(/((?<=filename=")(.*)(?="))/)
                : null;

            let data = "";
            if (response.buffer) {
                data = (await response.buffer()).toString("base64");
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
            ? await options.client.pupPage.evaluate(
                  fetchData,
                  url,
                  options.reqOptions
              )
            : await fetchData(url, options.reqOptions);

        const filename =
            options.filename ||
            (res.name ? res.name[0] : pUrl.pathname.split("/").pop() || "file");

        if (!mimetype) mimetype = res.mime;

        return new MessageMedia(mimetype, res.data, filename);
    }
}
