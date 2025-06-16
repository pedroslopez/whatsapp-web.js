'use strict';

const PersonalCatalog = require('../structures/PersonalCatalog');
const ExternalCatalog = require('../structures/ExternalCatalog');

class CatalogFactory {
    static create(client, data) {
        if(data.isMe) {
            return new PersonalCatalog(client, data);
        }

        return new ExternalCatalog(client,data);
    }
}

module.exports = CatalogFactory; 