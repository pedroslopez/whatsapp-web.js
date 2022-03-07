'use strict';

import { Client } from "../Client";
import { Base } from "./Base";

/**
 * Represents a Call on WhatsApp
 * @extends {Base}
 */
export class Call extends Base {
    id: string;
    from: string;
    timestamp: number;
    isVideo: boolean;
    isGroup: boolean;
    fromMe: boolean;
    canHandleLocally: boolean;
    webClientShouldHandle: boolean;
    participants: any;

    constructor(client: Client, data: Record<string, any>) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data: Record<string, any>) {
        /**
         * Call ID
         */
        this.id = data.id;
        /**
         * From
         */
        this.from = data.peerJid;
        /**
         * Unix timestamp for when the call was created
         */
        this.timestamp = data.offerTime;
        /**
         * Is video
         */
        this.isVideo = data.isVideo;
        /**
         * Is Group
         */
        this.isGroup = data.isGroup;
        /**
         * Indicates if the call was sent by the current user
         */
        this.fromMe = data.outgoing;
        /**
         * Indicates if the call can be handled in waweb
         */
        this.canHandleLocally = data.canHandleLocally;
        /**
         * Indicates if the call Should be handled in waweb
         */
        this.webClientShouldHandle = data.webClientShouldHandle;
        /**
         * Object with participants
         */
        this.participants = data.participants;
        
        return super._patch(data);
    }
    
}
