'use strict';

const Base = require('./Base');
const CatalogItem = require('./CatalogItem');

/**
 * Represents Catalog Collection on Whatsapp Business
 * @extends {Base}
 */
class Collection extends Base {
    constructor(client, data) {
        super(client);
        
        if(data) this._patch(data)
    }
    
    _patch(data) {
        /**
         * ID that represents a Collection
         * @type {string}
         */
        this.id = data.id;

        /**
         * Collection's name
         * @type {string}
         */
        this.name = data.name;

        /**
         * Status of Collection
         * @type {string}
         */
        this.reviewStatus = data.reviewStatus;

        /**
         * Show status
         * @type {?boolean}
         */
        this.isHidden = data.isHidden;
        
        /**
         * Reason why cannot approve this collection
         * @type {string}
         */
        this.rejectReason = data.rejectReason;
        
        return super._patch(data)
    }

    /**
     * Get all products of this Collection
     * @returns {Promise<Array<CatalogItem>>}
     */
    async getProducts() {
        const res = await this.client.pupPage.evaluate(async id => {
            return window.WWebJS.getCollectionProducts(id.id);
        }, { id: this.id });
        
        return res.map(product => new CatalogItem(this.client, product));
    }
    
}

module.exports = Collection;