# Catalog and Order Documentation - WhatsApp Web.js

## Table of Contents
1. [Catalog Functionality](#catalog-functionality)
2. [Catalog Commands](#catalog-commands)
3. [Order Functionality](#order-functionality)
4. [Product Handling](#product-handling)
5. [Class Structure](#class-structure)
6. [Usage Examples](#usage-examples)

---

## Catalog Functionality

### Overview
The catalog system allows access and display of WhatsApp Business products, both from personal catalogs and external catalogs from other businesses.

### Main Features
- **Personal Catalog**: Access to own products (business accounts only)
- **External Catalog**: View products from other businesses
- **Collections**: Organized product groupings
- **Product Images**: Automatic download and sending of images
- **Detailed Information**: Prices, descriptions, availability, etc.

---

## Catalog Commands

### 1. `!catalog` - Personal Catalog
**Description**: Shows the user's personal catalog (business accounts only)

**Functionality**:
- Gets products from personal catalog
- Shows general catalog information
- Sends product images with detailed information
- Includes formatted prices and descriptions

**Response Example**:
```
*Catalog Info*
Type: Personal
Products: 15

• Product 1 - $25.00 USD
• Product 2 - $45.50 USD
• Product 3 - $12.99 USD
...and 12 more

Sending 15 products from catalog...
[Product images with information]

Catalog complete!
Successfully sent: 15 products
```

### 2. `!catalogof <number>` - External Catalog
**Description**: Shows the catalog of a specific business

**Syntax**: `!catalogof 1234567890` or `!catalogof 1234567890@c.us`

**Functionality**:
- Accesses external business catalog
- Shows available products and collections
- Sends first 3 product images
- Includes source business information

**Response Example**:
```
*External Catalog Info*
Business: 1234567890@c.us
Products: 8
Collections: 2

• Classic Burger - $8.50 USD
• Pizza Margherita - $12.00 USD
• Coca Cola - $2.50 USD
...and 5 more

External Catalog Images:
[Product images with information]
```

### 3. `!collections` - Collections
**Description**: Lists all collections from the personal catalog

**Functionality**:
- Gets organized collections from catalog
- Shows product count per collection
- Lists up to 5 main collections

**Response Example**:
```
*Catalog Collections*
Total: 3

• Food: 8 products
• Drinks: 5 products
• Desserts: 2 products
```

---

## Order Functionality

### Automatic Order Handling
The system automatically handles `order` type messages received by WhatsApp Business.

### Order Features
- **Automatic Detection**: Recognizes order messages automatically
- **Complete Information**: Extracts product details, prices and totals
- **Automatic Confirmation**: Sends confirmation message to customer
- **Error Handling**: Includes fallback responses in case of error

### Order Information Extracted
- **Order ID**: Unique order identifier
- **Products**: Detailed list with names, prices and quantities
- **Totals**: Subtotal and order total
- **Currency**: Currency used
- **Business Information**: Establishment data

### Order Confirmation Example
```
Thank you for your order! Your products will be ready soon.

*Order Details:*
• Order ID: ORD_123456789
• Business: My Restaurant
• Subtotal: $25.50 USD
• Total: $27.50 USD

*Products:*
1. Classic Burger
   Price: $8.50 USD
   Quantity: 2

2. Coca Cola
   Price: $2.50 USD
   Quantity: 1

We will process your order and notify you when it's ready for pickup/delivery.
```

### Quoted Order Handling
When a user quotes an order message, the system:
- Extracts information from quoted order
- Shows complete product details
- Provides order ID and totals

---

## Product Handling

### Quoted Products
When quoting a message containing a product:

**Information Extracted**:
- Product ID
- Name and description
- Formatted price
- Currency
- Availability
- Review status
- Product URL
- Product image

**Functionality**:
- Access to business catalog
- Specific product search
- Image download from CDN
- Complete information sending

### Product Information Example
```
*Product Information*

*Name:* Classic Burger
*Product ID:* PROD_12345
*Description:* Delicious burger with meat, lettuce and tomato
*Business:* restaurant@c.us
*Price:* $8.50 USD
*Currency:* USD
*Availability:* in_stock
*Review Status:* approved
*Product URL:* https://business.whatsapp.com/product/...

[Product image with caption]
```

---

## Class Structure

### `Catalog` Class (Base)
```javascript
class Catalog extends Base {
    constructor(client, data)
    _patch(data) // userid
}
```

### `PersonalCatalog` Class
```javascript
class PersonalCatalog extends Catalog {
    isMe = true
    async getProducts() // Gets own products
    async getCollections() // Gets own collections
}
```

### `ExternalCatalog` Class
```javascript
class ExternalCatalog extends Catalog {
    isMe = false
    async getProducts() // Gets external products
    async getCollections() // Gets external collections
}
```

### `Collection` Class
```javascript
class Collection extends Base {
    id: string
    name: string
    reviewStatus: string
    isHidden: boolean
    rejectReason: string
    
    async getProducts() // Collection products
}
```

### `Product` Class
```javascript
class Product extends Base {
    id: string
    name: string
    currency: string
    price: string
    
    async getFormattedPrice() // Formatted price
    async getData() // Complete metadata
    _initializeWithCatalogData(data) // Initialization
}
```

### `Order` Class
```javascript
class Order extends Base {
    products: Array<Product>
    subtotal: string
    total: string
    currency: string
    createdAt: number
}
```

---

## Usage Examples

### Get Personal Catalog
```javascript
const catalog = await client.getCatalog(client.info.wid._serialized);
if (catalog && catalog.isMe) {
    const products = await catalog.getProducts();
    console.log(`Found ${products.length} products`);
}
```

### Get External Catalog
```javascript
const externalCatalog = await client.getCatalog('1234567890@c.us');
if (externalCatalog && !externalCatalog.isMe) {
    const products = await externalCatalog.getProducts();
    const collections = await externalCatalog.getCollections();
}
```

### Handle Individual Product
```javascript
const product = products[0];
const formattedPrice = await product.getFormattedPrice();
const metadata = await product.getData();

console.log(`${product.name} - ${formattedPrice}`);
if (metadata.imageCdnUrl) {
    const media = await MessageMedia.fromUrl(metadata.imageCdnUrl);
    await client.sendMessage(chatId, media, {
        caption: `*${product.name}*\nPrice: ${formattedPrice}`
    });
}
```

### Process Received Order
```javascript
client.on('message', async msg => {
    if (msg.type === 'order') {
        const order = await msg.getOrder();
        if (order) {
            console.log(`Order ID: ${msg.orderId}`);
            console.log(`Total: ${order.total} ${order.currency}`);
            console.log(`Products: ${order.products.length}`);
            
            // Send confirmation
            await msg.reply(`Order confirmed! Total: ${order.total} ${order.currency}`);
        }
    }
});
```

### Get Collection Products
```javascript
const collections = await catalog.getCollections();
for (const collection of collections) {
    const products = await collection.getProducts();
    console.log(`${collection.name}: ${products.length} products`);
}
```

---

## Utility Functions

### Functions in `Utils.js`
- `window.WWebJS.getMeCatalog()`: Gets personal catalog
- `window.WWebJS.getCatalogProducts(userid)`: External catalog products
- `window.WWebJS.getCatalogCollections(userid)`: Catalog collections
- `window.WWebJS.getCollectionProducts(userid, collectionId)`: Specific collection products
- `window.WWebJS.getOrderDetail(orderId, token, chatId)`: Order details
- `window.WWebJS.discoverCatalog(userid)`: Discovers and loads catalog
- `window.WWebJS.isCatalogReady()`: Checks if catalog is ready

### Factory Pattern
```javascript
// CatalogFactory.js
class CatalogFactory {
    static create(client, data) {
        if(data.isMe) {
            return new PersonalCatalog(client, data);
        }
        return new ExternalCatalog(client, data);
    }
}
```

---

## Technical Considerations

### Limitations
- **Business Accounts**: Some functions only for WhatsApp Business
- **Rate Limiting**: Delays between sends to avoid limits
- **Availability**: External catalogs may not be available
- **Images**: CDN URLs may occasionally fail

### Error Handling
- Automatic retries for network failures
- Fallback messages when main functionality fails
- Detailed logs for debugging
- Data validation before processing

### Performance
- Asynchronous catalog loading
- Cache for already consulted products
- Batch processing for multiple products
- Configurable timeouts for operations

---

## Automatic Testing

The system includes automatic tests that run when initializing the client:

```javascript
// Test catalog functionality automatically
console.log('Testing catalog functionality...');
try {
    const catalog = await client.getCatalog(myNumber);
    if (catalog) {
        const products = await catalog.getProducts();
        const collections = await catalog.getCollections();
        // ... additional tests
    }
} catch (error) {
    console.log(`Error testing catalog: ${error.message}`);
}
```

This documentation covers all implemented functionality for catalogs and orders in WhatsApp Web.js, providing practical examples and technical details for implementation and usage. 