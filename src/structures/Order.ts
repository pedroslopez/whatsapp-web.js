"use strict";

import { Client } from "../Client";
import { Base } from "./Base";
import { Product } from "./Product";

/**
 * Represents a Order on WhatsApp
 * @extends {Base}
 */
export class Order extends Base {
    products: Product[];
    subtotal: string;
    total: string;
    currency: string;
    createdAt: number;

    constructor(client: Client, data: Record<string, any>) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data: Record<string, any>) {
        /**
         * List of products
         * @type {Array<Product>}
         */
        if (data.products) {
            this.products = data.products.map(
                (product) => new Product(this.client, product)
            );
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
