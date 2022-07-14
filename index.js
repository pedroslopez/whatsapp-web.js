'use strict';

const Constants = require('./src/util/Constants');

module.exports = {
    Client: require('./src/Client'),

    version: require('./package.json').version,

    // Structures
    BusinessContact: require('./src/structures/BusinessContact'),
    Buttons: require('./src/structures/Buttons'),
    Chat: require('./src/structures/Chat'),
    ClientInfo: require('./src/structures/ClientInfo'),
    Contact: require('./src/structures/Contact'),
    GroupChat: require('./src/structures/GroupChat'),
    List: require('./src/structures/List'),
    Location: require('./src/structures/Location'),
    Message: require('./src/structures/Message'),
    MessageMedia: require('./src/structures/MessageMedia'),
    PrivateChat: require('./src/structures/PrivateChat'),
    PrivateContact: require('./src/structures/PrivateContact'),
    ProductMetadata: require('./src/structures/ProductMetadata'),

    // Auth Strategies
    LegacySessionAuth: require('./src/authStrategies/LegacySessionAuth'),
    LocalAuth: require('./src/authStrategies/LocalAuth'),
    NoAuth: require('./src/authStrategies/NoAuth'),

    ...Constants
};