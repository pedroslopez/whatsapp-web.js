'use strict';

const Base = require('./Base');

/**
 * Represents a Contact on WhatsApp
 * @extends {Base}
 */
class Contact extends Base {
    constructor(client, data) {
        super(client);

        if(data) this._patch(data);
    }

    _patch(data) {
        this.id = data.id;
        this.isBusiness = data.isBusiness;
        this.isEnterprise = data.isEnterprise;
        this.labels = data.labels;
        this.name = data.name;
        this.pushname = data.pushname;
        this.sectionHeader = data.sectionHeader;
        this.shortName = data.shortName;
        this.statusMute = data.statusMute;
        this.type = data.type;
        this.verifiedLevel = data.verifiedLevel;
        this.verifiedName = data.verifiedName;

        return super._patch(data);
    }
    
}

module.exports = Contact;