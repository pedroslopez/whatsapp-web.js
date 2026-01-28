/**
 * Expose a function to the page, handling the case where the CDP binding
 * already exists (e.g., after page navigation where the page context is
 * cleared but the CDP binding persists).
 *
 * @param {object} page - Puppeteer Page instance
 * @param {string} name
 * @param {Function} fn
 */
async function exposeFunctionIfAbsent(page, name, fn) {
    // Check if the function exists in the page context
    const existsInPage = await page.evaluate((name) => {
        return !!window[name];
    }, name);

    if (existsInPage) {
        return;
    }

    // Try to expose the function, handling the case where the CDP binding
    // already exists (can happen after page navigation)
    try {
        await page.exposeFunction(name, fn);
    } catch (err) {
        if (err.message && err.message.includes('already exists')) {
            // CDP binding exists but page context was cleared (after navigation)
            // Remove the old binding and re-add it with the new function
            try {
                await page.removeExposedFunction(name);
                await page.exposeFunction(name, fn);
            } catch (removeErr) {
                // If removal fails, the binding is still usable from the previous expose
                // This can happen in older Puppeteer versions
            }
        } else {
            throw err;
        }
    }
}

module.exports = {exposeFunctionIfAbsent};
