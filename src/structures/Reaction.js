'use strict';

const Base = require('./Base');

/**
 * Represents a Reaction on WhatsApp
 * @extends {Base}
 */
class Reaction{
    constructor(reaction) {
        this.reaction = reaction;
    }
}

module.exports = Reaction;