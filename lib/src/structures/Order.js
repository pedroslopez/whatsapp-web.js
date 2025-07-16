'use strict';

const Base = require('./Base');
const Product = require('./Product');

/**
 * Represents a Order on WhatsApp
 * @extends {Base}
 */
class Order extends Base {
    constructor(client, data) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data) {
        /**
         * List of products
         * @type {Array<Product>}
         */
        if (data.products) {
            this.products = data.products.map(product => new Product(this.client, product));
        }
        /**
         * Order Subtotal
         * @type {string}
         */
        this.subtotal = data.subtotal;
        /**
         * Order Total
         * @type {string}
         */
        this.total = data.total;
        /**
         * Order Currency
         * @type {string}
         */
        this.currency = data.currency;
        /**
         * Order Created At
         * @type {number}
         */
        this.createdAt = data.createdAt;

        return super._patch(data);
    }


}

module.exports = Order;