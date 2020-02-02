'use strict';

module.exports = {
    Client: require('./src/Client'),
    
    version: require('./package.json').version,

    // Structures
    Chat: require('./src/structures/Chat'),
    PrivateChat: require('./src/structures/PrivateChat'),
    GroupChat: require('./src/structures/GroupChat'),
    Message: require('./src/structures/Message'),
    ClientInfo: require('./src/structures/ClientInfo')
};