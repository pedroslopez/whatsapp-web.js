'use strict';

const PrivateChat = require(`${__dirname}/structures/PrivateChat`);
const GroupChat = require(`${__dirname}/structures/GroupChat`);

class ChatFactory {
    static create(client, data) {
        if(data.isGroup) {
            return new GroupChat(client, data);
        }

        return new PrivateChat(client, data);
    }
}

module.exports = ChatFactory;
