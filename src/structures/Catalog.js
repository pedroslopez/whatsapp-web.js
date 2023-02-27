'use strict';

const Base = require('./Base');
const Collection = require('./Collection');
const CatalogItem = require('./CatalogItem');

/**
 * Represents Catalog on WhatsApp Business
 * @extends {Base}
 */
class Catalog extends Base {
    constructor(client, data) {
        super(client);
        
        if(data) this._patch(data);
    }
    
    _patch(data) {
        return super._patch(data);
    }
    
    /**
    * List all the products on the Catalog
    * @returns {Promise<Array<CatalogItem>>}
    */
    async getProducts() {
        const res = await this.client.pupPage.evaluate(async () => {
            return await window.WWebJS.getCatalogProducts();
        });
        
        return res.map(el => new CatalogItem(this.client, el));
    }

    /**
     * List all Collections on the Cataloo
     * @returns {Promise<Array<Collection>>}
     */
    async getCollections() { 
        const res = await this.client.pupPage.evaluate(async () => {
            return await window.WWebJS.getCatalogCollections();
        });
        
        return res.map(collection => new Collection(this.client, collection));
    }
}

module.exports = Catalog;