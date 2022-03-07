'use strict';

import { Client } from "../Client";

/**
 * Represents a WhatsApp data structure
 */
export class Base {
    readonly client: Client;

    constructor(client: Client) {
        /**
         * The client that instantiated this
         */
        this.client = client;
    }

    _clone() {
        return Object.assign(Object.create(this), this);
    }
    
    _patch(data: Record<string, any>) { return data; }

    serialize() { return JSON.parse(JSON.stringify(this)); }
}
