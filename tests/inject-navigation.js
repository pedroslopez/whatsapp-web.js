/**
 * E2E tests: waitForFunction survives page navigation (context destruction)
 *
 * Simulates the real-world scenario:
 *   After sleep/resume, Chrome's IndexedDB recovery causes an internal
 *   page navigation that destroys the execution context.
 *   waitForFunction should continue polling in the new context.
 */

const puppeteer = require('puppeteer');
const chai = require('chai');
const expect = chai.expect;

describe('inject() navigation resilience', function () {
    this.timeout(30000);

    let browser;
    let page;

    beforeEach(async function () {
        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        page = await browser.newPage();
    });

    afterEach(async function () {
        if (browser) await browser.close();
    });

    // ──────────────────────────────────────────────────────────
    // Test 1: waitForFunction survives navigation
    // ──────────────────────────────────────────────────────────
    describe('waitForFunction survives navigation', function () {
        it('should resolve after navigation destroys and recreates the context', async function () {
            // Page 1: variable is NOT set
            await page.setContent('<html><body><div id="app">Page 1</div></body></html>');

            // Start waiting for a variable that doesn't exist yet
            const waitPromise = page.waitForFunction(
                'window.testReady === true',
                { timeout: 15000 }
            );

            // Simulate navigation mid-wait (like IndexedDB recovery)
            await new Promise(r => setTimeout(r, 500));
            await page.goto('data:text/html,<html><body><div id="app">Page 2</div><script>setTimeout(() => { window.testReady = true; }, 500);</script></body></html>');

            // waitForFunction should resolve in the new context
            await waitPromise;

            const result = await page.evaluate('window.testReady');
            expect(result).to.equal(true);
        });

        it('should resolve even with multiple navigations', async function () {
            await page.setContent('<html><body>Page 1</body></html>');

            const waitPromise = page.waitForFunction(
                'window.finalReady === true',
                { timeout: 15000 }
            );

            // Navigation 1
            await new Promise(r => setTimeout(r, 300));
            await page.goto('data:text/html,<html><body>Page 2</body></html>');

            // Navigation 2
            await new Promise(r => setTimeout(r, 300));
            await page.goto('data:text/html,<html><body>Page 3</body></html>');

            // Navigation 3 - finally sets the variable
            await new Promise(r => setTimeout(r, 300));
            await page.goto('data:text/html,<html><body>Page 4<script>setTimeout(() => { window.finalReady = true; }, 300);</script></body></html>');

            await waitPromise;

            const result = await page.evaluate('window.finalReady');
            expect(result).to.equal(true);
        });
    });

    // ──────────────────────────────────────────────────────────
    // Test 2: Simulates the exact WhatsApp inject scenario
    // ──────────────────────────────────────────────────────────
    describe('WhatsApp inject scenario simulation', function () {
        it('should survive IndexedDB-recovery-like navigation during Debug.VERSION wait', async function () {
            // Initial page load - WhatsApp Web loading
            await page.setContent(`<html><body><div id="app">Loading WhatsApp...</div>
                <script>
                    // Simulate: Debug.VERSION will be set, but navigation will interrupt
                    setTimeout(() => { window.Debug = { VERSION: '2.3000.0' }; }, 2000);
                </script>
            </body></html>`);

            // Start the same waitForFunction that inject() uses
            const waitPromise = page.waitForFunction(
                'window.Debug?.VERSION != undefined',
                { timeout: 15000 }
            );

            // Simulate IndexedDB recovery navigation after 500ms
            await new Promise(r => setTimeout(r, 500));
            await page.goto(`data:text/html,<html><body><div id="app">WhatsApp Recovered</div>
                <script>
                    // After recovery, WhatsApp reloads and sets Debug.VERSION
                    setTimeout(function() { window.Debug = { VERSION: '2.3000.0' }; }, 1000);
                </script>
            </body></html>`);

            // waitForFunction should survive the navigation and resolve in new context
            await waitPromise;

            const version = await page.evaluate('window.Debug.VERSION');
            expect(version).to.equal('2.3000.0');
        });
    });

    // ──────────────────────────────────────────────────────────
    // Test 3: framenavigated listener fires after navigation
    // ──────────────────────────────────────────────────────────
    describe('framenavigated listener ordering', function () {
        it('should fire framenavigated when registered before navigation-triggering code', async function () {
            await page.setContent('<html><body><div id="app">Initial</div></body></html>');

            let framenavigatedFired = false;
            let navigatedUrl = '';

            // Register listener BEFORE any inject-like code (our fix)
            page.on('framenavigated', (frame) => {
                framenavigatedFired = true;
                navigatedUrl = frame.url();
            });

            // Simulate navigation (like IndexedDB recovery)
            await page.goto('data:text/html,<html><body><div id="app">After Navigation</div></body></html>');

            expect(framenavigatedFired).to.equal(true);
            expect(navigatedUrl).to.include('data:text/html');
        });

        it('should call inject-like function via framenavigated after context destruction', async function () {
            await page.setContent('<html><body><div id="app">Initial</div></body></html>');

            let injectCallCount = 0;
            const injectFn = async () => {
                await page.evaluate('1 + 1'); // simple evaluate to verify context works
                injectCallCount++;
            };

            // Register framenavigated BEFORE (our fix)
            page.on('framenavigated', async () => {
                await injectFn();
            });

            // Navigate - this destroys old context, creates new one
            await page.goto('data:text/html,<html><body><div id="app">Recovered</div></body></html>');

            // Give the async listener time to run
            await new Promise(r => setTimeout(r, 500));

            expect(injectCallCount).to.be.greaterThan(0);
        });
    });

    // ──────────────────────────────────────────────────────────
    // Test 4: page.evaluate FAILS during navigation (contrast)
    // ──────────────────────────────────────────────────────────
    describe('page.evaluate does NOT survive navigation (contrast test)', function () {
        it('should throw when evaluate runs during navigation', async function () {
            await page.setContent('<html><body>Initial</body></html>');

            let evaluateError = null;

            // Start a long-running evaluate, then navigate mid-way
            const evalPromise = page.evaluate(async () => {
                // Wait inside the browser context
                await new Promise(r => setTimeout(r, 5000));
                return 'done';
            }).catch(err => {
                evaluateError = err;
            });

            // Navigate while evaluate is running
            await new Promise(r => setTimeout(r, 200));
            await page.goto('data:text/html,<html><body>New Page</body></html>');

            await evalPromise;

            // evaluate should have thrown (context destroyed)
            expect(evaluateError).to.not.be.null;
            expect(evaluateError.message.toLowerCase()).to.satisfy(
                msg => msg.includes('context') || msg.includes('navigat') || msg.includes('detach')
            );
        });
    });

    // ──────────────────────────────────────────────────────────
    // Test 5: Full flow - framenavigated + waitForFunction together
    // ──────────────────────────────────────────────────────────
    describe('Full flow: framenavigated + waitForFunction', function () {
        it('should recover fully when combining both mechanisms', async function () {
            await page.setContent(`<html><body><div id="app">Loading</div>
                <script>
                    setTimeout(() => { window.Debug = { VERSION: '2.3000.0' }; }, 3000);
                </script>
            </body></html>`);

            let framenavigatedInjectCalled = false;

            // Step 1: Register framenavigated BEFORE inject (our fix)
            page.on('framenavigated', async () => {
                try {
                    // Simulate inject: wait for Debug.VERSION then do work
                    await page.waitForFunction('window.Debug?.VERSION != undefined', { timeout: 10000 });
                    await page.evaluate('window.Debug.VERSION'); // simulate store injection
                    framenavigatedInjectCalled = true;
                } catch (e) {
                    // Ignore - test will fail on assertion if this doesn't work
                }
            });

            // Step 2: Start inject (waitForFunction)
            const injectPromise = page.waitForFunction(
                'window.Debug?.VERSION != undefined',
                { timeout: 15000 }
            );

            // Step 3: Navigation destroys context mid-wait
            await new Promise(r => setTimeout(r, 500));
            await page.goto(`data:text/html,<html><body><div id="app">Recovered</div>
                <script>
                    setTimeout(function() { window.Debug = { VERSION: '2.3000.0' }; }, 800);
                </script>
            </body></html>`);

            // Step 4: Both should succeed
            await injectPromise; // waitForFunction survives navigation

            // Give framenavigated handler time to complete
            await new Promise(r => setTimeout(r, 2000));
            expect(framenavigatedInjectCalled).to.equal(true);
        });
    });
});
