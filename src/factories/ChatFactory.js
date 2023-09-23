'use strict';

const PrivateChat = require('../structures/PrivateChat');
const GroupChat = require('../structures/GroupChat');
const Community = require('../structures/Community');

class ChatFactory {
    static create(client, data) {
        if (data.isGroup) {
            return data.groupMetadata.isParentGroup
                ? new Community(client, data)
                : new GroupChat(client, data);
        }

        return new PrivateChat(client, data);
    }
}

module.exports = ChatFactory;
