'use strict';

const Base = require('./Base');

/**
 * Represents a CatalogItem on WhatsAppBusiness
 * @extends {Base}
 */
class CatalogItem extends Base {
    constructor(client, data) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data) {
        /**
         * CatalogItem ID
         * @type {string}
         */
        this.id = data.id;
        /**
         * Price
         * @type {number}
         */
        this.price = data.priceAmount1000;
        /**
         * CatalogItem Image
         * @type {string}
         */
        this.imageCdnUrl = data.imageCdnUrl;
        /**
         * CatalogItem Currency
         * @type {string}
         */
        this.currency = data.currency;
        /**
         * CatalogItem Name
         * @type {string}
         */
        this.name = data.name;
        /**
         * CatalogItem Quantity
         * @type {number}
         */
        this.quantity = data.quantity;
        /**
         * CatalogItem Description
         * @type {string}
         */
        this.description = data.description;
        /**
         * CatalogItem Availiability
         * @type {string}
         */
        this.availability = data.availability;
        /**
         * CatalogItem RetailerId
         * @type {string}
         */
        this.retailerId = data.retailerId;
        /**
         * CatalogItem Review Status
         * @type {string}
         */
        this.reviewStatus = data.reviewStatus;
        /**
         * CatalogItems Additional Images
         * @type {Array<string>}
         */
        this.additionalImageCdnUrl = data.additionalImageCdnUrl;
        /**
         * CatalogItem Url
         * @type {string}
         */
        this.url = data.url;
        /**
         * CatalogItem IsHidden
         * @type {boolean}
         */
        this.isHidden = data.isHidden;
        
        return super._patch(data);
    }
    
    // TODO - ABM Functions
}

module.exports = CatalogItem;