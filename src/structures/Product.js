'use strict';

const Base = require('./Base');
const ProductMetadata = require('./ProductMetadata');

/**
 * Represents a Product on WhatsAppBusiness
 * @extends {Base}
 */
class Product extends Base {
    constructor(client, data) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data) {
        /**
         * Product ID
         * @type {string}
         */
        this.id = data.id;
        /**
         * Price
         * @type {string}
         */
        this.price = data.price ? data.price : '';
        /**
         * Product Thumbnail
         * @type {string}
         */
        this.thumbnailUrl = data.thumbnailUrl;
        /**
         * Currency
         * @type {string}
         */
        this.currency = data.currency || '';
        /**
         * Product Name
         * @type {string}
         */
        this.name = data.name || '';
        /**
         * Product Quantity
         * @type {number}
         */
        this.quantity = data.quantity;

        /** Product metadata - contains detailed catalog information */
        this.data = null;
        return super._patch(data);
    }

    async getData() {
        if (this.data === null) {
            let result = await this.client.pupPage.evaluate((productId) => {
                return window.WWebJS.getProductMetadata(productId);
            }, this.id);
            if (!result) {
                this.data = undefined;
            } else {
                this.data = new ProductMetadata(this.client, result);
            }
        }
        return this.data;
    }

    /**
     * Initialize product with catalog data directly (for catalog products)
     * @param {Object} catalogData - Catalog data from WhatsApp
     */
    _initializeWithCatalogData(catalogData) {
        this.data = new ProductMetadata(this.client, catalogData);
    }

    /**
     * Gets the formatted price from priceAmount1000 (from metadata if available)
     * @returns {string} Formatted price with currency
     */
    async getFormattedPrice() {
        const metadata = await this.getData();
        if (metadata && metadata.getFormattedPrice) {
            return metadata.getFormattedPrice();
        }
        return this.price || 'Price not available';
    }

    /**
     * Gets the actual price value from priceAmount1000 (from metadata if available)
     * @returns {number} Actual price value
     */
    async getPriceValue() {
        const metadata = await this.getData();
        if (metadata && metadata.getPriceValue) {
            return metadata.getPriceValue();
        }
        return 0;
    }
}

module.exports = Product;