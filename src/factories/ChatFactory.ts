'use strict';

import { Client } from "../Client";
import { PrivateChat, GroupChat } from "../structures";

export class ChatFactory {
    static create(client: Client, data: Record<string, any>) {
        if(data.isGroup) {
            return new GroupChat(client, data);
        }

        return new PrivateChat(client, data);
    }
}
