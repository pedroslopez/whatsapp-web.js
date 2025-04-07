'use strict';

const PrivateChat = require('../structures/PrivateChat');
const GroupChat = require('../structures/GroupChat');
const Channel = require('../structures/Channel');

class ChatFactory {
    static create(client, data) {
        if (data.isGroup) {
            return new GroupChat(client, data);
        }
        
        if (data.isChannel) {
            return new Channel(client, data);
        }

        return new PrivateChat(client, data);
    }
}

module.exports = ChatFactory;
