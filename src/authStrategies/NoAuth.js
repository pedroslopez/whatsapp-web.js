'use strict';

const BaseAuthStrategy = require('./BaseAuthStrategy');

/**
 * No session restoring functionality
 * Will need to authenticate via QR code every time
*/
class NoAuth extends BaseAuthStrategy { }


module.exports = NoAuth;