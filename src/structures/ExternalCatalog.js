const Collection = require('./Collection');
const Product = require('./Product');
const Catalog = require('./Catalog');

class ExternalCatalog extends Catalog {
    _patch(data) {
        /**
         * The contact's business profile
         */
        this.isMe = false;

        return super._patch(data);
    }

    /**
     * List all the products on the Catalog
     * @returns {Promise<Array<Product>>}
     */
    async getProducts() {
        const res = await this.client.pupPage.evaluate(async (userid) => {
            return await window.WWebJS.getCatalogProducts(userid);
        }, this.userid);

        return res.map(el => {
            const product = new Product(this.client, el);
            product._initializeWithCatalogData(el);
            return product;
        });
    }

    /**
     * List all Collections on the Catalog
     * @returns {Promise<Array<Collection>>}
     */
    async getCollections() {
        const res = await this.client.pupPage.evaluate(async (userid) => {
            return await window.WWebJS.getCatalogCollections(userid);
        }, this.userid);

        return res.map(collection => new Collection(this.client, collection));
    }
}

module.exports = ExternalCatalog; 