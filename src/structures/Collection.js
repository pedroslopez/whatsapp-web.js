'use strict';

const Base = require('./Base');
const Product = require('./Product');

/**
 * Represents Catalog Collection on Whatsapp Business
 * @extends {Base}
 */
class Collection extends Base {
    constructor(client, data) {
        super(client);

        if(data) this._patch(data);
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

        return super._patch(data);
    }

    /**
     * Get all products of this Collection
     * @returns {Promise<Array<Product>>}
     */
    async getProducts() {
        // We need both userid and collectionId
        const res = await this.client.pupPage.evaluate(async (data) => {
            return window.WWebJS.getCollectionProducts(data.userid, data.collectionId);
        }, { userid: this.client.info.wid._serialized, collectionId: this.id });

        return res.map(productData => {
            const product = new Product(this.client, productData);
            product._initializeWithCatalogData(productData);
            return product;
        });
    }

}

module.exports = Collection; 