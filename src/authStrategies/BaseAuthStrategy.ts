"use strict";

import { Client } from "../Client";

/**
 * Base class which all authentication strategies extend
 */
export abstract class BaseAuthStrategy {
    client: Client;

    constructor() {}
    setup(client: Client) {
        this.client = client;
    }
    async beforeBrowserInitialized() {}
    async afterBrowserInitialized() {}
    async onAuthenticationNeeded(): Promise<{
        failed?: boolean;
        restart?: boolean;
        failureEventPayload?: any;
    }> {
        return {
            failed: false,
            restart: false,
            failureEventPayload: undefined,
        };
    }
    async getAuthEventPayload(): Promise<any> {}
    async logout() {}
}
