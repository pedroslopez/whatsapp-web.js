'use strict';

const Chat = require('./Chat');

/**
 * Represents a Private Chat on WhatsApp
 * @extends {Chat}
 */
class PrivateChat extends Chat {
	_patch(data) {
		this.isOnline = data.isOnline;
		return super._patch(data);
	}
}

module.exports = PrivateChat;