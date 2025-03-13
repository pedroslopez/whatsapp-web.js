'use strict';

const PrivateChat = require('../structures/PrivateChat');
const GroupChat = require('../structures/GroupChat');

class ChatFactory {
    static create(client, data) {
        if(data.isGroup || data.id.server === 'g.us' ) {
            return new GroupChat(client, data);
        }

        return new PrivateChat(client, data);
    }
}

module.exports = ChatFactory;
