const Base = require('./Base');

class ProductMetadata extends Base {
    constructor(client, data) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data) {
        /** Product ID */
        this.id = data.id;
        /** Retailer ID */
        this.retailer_id = data.retailer_id || data.retailerId || '';
        /** Product Name  */
        this.name = data.name || '';
        /** Product Description */
        this.description = data.description || '';

        // Additional catalog fields
        /** Product availability in catalog */
        this.availability = data.availability || '';
        /** Product review status in catalog */
        this.reviewStatus = data.reviewStatus || '';
        /** Additional image URLs */
        this.additionalImageCdnUrl = data.additionalImageCdnUrl || [];
        /** Product URL */
        this.url = data.url || '';
        /** Whether the product is hidden */
        this.isHidden = data.isHidden || false;
        /** Main image URL from catalog */
        this.imageCdnUrl = data.imageCdnUrl || '';
        /** Price in amount * 1000 format (used internally by WhatsApp) */
        this.priceAmount1000 = data.priceAmount1000 || 0;
        /** Currency */
        this.currency = data.currency || '';
        /** Price */
        this.price = data.price || '';
        /** Sale price in amount * 1000 format */
        this.salePriceAmount1000 = data.salePriceAmount1000 || 0;
        /** Product image count */
        this.productImageCount = data.productImageCount || 1;
        /** Retailer ID (alternative field name) */
        this.retailerId = data.retailerId || this.retailer_id || '';

        return super._patch(data);
    }

    /**
     * Gets the formatted price from priceAmount1000
     * @returns {string} Formatted price with currency
     */
    getFormattedPrice() {
        if (this.priceAmount1000 && this.priceAmount1000 > 0) {
            const price = (this.priceAmount1000 / 1000).toFixed(2);
            return `${price} ${this.currency}`;
        }
        return this.price || 'Price not available';
    }

    /**
     * Gets the actual price value from priceAmount1000
     * @returns {number} Actual price value
     */
    getPriceValue() {
        return this.priceAmount1000 ? this.priceAmount1000 / 1000 : 0;
    }

}

module.exports = ProductMetadata;