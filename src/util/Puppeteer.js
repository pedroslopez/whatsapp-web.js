/**
 * Expose a function to the page, replacing it if it already exists.
 * Uses page.removeExposedFunction (available since Puppeteer 20.6) to upsert.
 *
 * @param {import('puppeteer').Page} page
 * @param {string} name
 * @param {Function} fn
 */
async function exposeFunction(page, name, fn) {
    try {
        await page.removeExposedFunction(name);
    } catch (error) {
        // Only ignore if function doesn't exist, rethrow other errors
        if (!error?.message?.includes('No function with name')) {
            throw error;
        }
    }
    await page.exposeFunction(name, fn);
}

module.exports = { exposeFunction };
