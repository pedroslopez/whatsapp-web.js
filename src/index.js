'use strict';

module.exports = {
    Client: require('./client/Client'),
    version: require('../package.json').version,

    // Models
    Chat: require('./models/Chat'),
    Message: require('./models/Message')
};