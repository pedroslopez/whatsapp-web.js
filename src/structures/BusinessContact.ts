'use strict';

import { Contact } from "./Contact";

/**
 * Represents a Business Contact on WhatsApp
 */
export class BusinessContact extends Contact {
    businessProfile: any;
    
    _patch(data: Record<string, any>) {
        /**
         * The contact's business profile
         */
        this.businessProfile = data.businessProfile;

        return super._patch(data);
    }

}
