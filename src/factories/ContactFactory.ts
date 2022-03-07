'use strict';

import { Client } from "../Client";
import { PrivateContact, BusinessContact } from "../structures";

export class ContactFactory {
    static create(client: Client, data: Record<string, any>) {
        if(data.isBusiness) {
            return new BusinessContact(client, data);
        }

        return new PrivateContact(client, data);
    }
}
