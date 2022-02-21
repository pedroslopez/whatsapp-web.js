'use strict';

const AuthStrategy = require('./AuthStrategy');

/**
 * No session restoring functionality
 * Will need to authenticate via QR code every time
*/
class NoAuth extends AuthStrategy { }


module.exports = NoAuth;