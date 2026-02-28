/**
 * A/B Comparison: Old inject vs New inject during navigation
 *
 * Reproduces the exact error: "Execution context was destroyed"
 *
 * Uses a local HTTP server to serve real pages with working scripts.
 * Navigation is triggered from Node.js (same effect as Chrome's internal navigation).
 */

const http = require('http');
const puppeteer = require('puppeteer');
const chai = require('chai');
const expect = chai.expect;

// Page that sets Debug.VERSION after a delay
function makePage(delayMs) {
    return `<html><body><div id="app">WhatsApp Web</div>
<script>
    setTimeout(function() {
        window.Debug = { VERSION: '2.3000.0' };
    }, ${delayMs});
</script>
</body></html>`;
}

// Old inject: manual polling with page.evaluate (commit 6f909bc, lines 105-112)
async function oldInjectPolling(page, timeout = 10000) {
    const start = Date.now();
    let res = false;
    while (start > (Date.now() - timeout)) {
        res = await page.evaluate('window.Debug?.VERSION != undefined');
        if (res) break;
        await new Promise(r => setTimeout(r, 200));
    }
    if (!res) throw new Error('auth timeout');
    return true;
}

// New inject: waitForFunction (current fork main, line 98)
async function newInjectPolling(page, timeout = 10000) {
    await page.waitForFunction('window.Debug?.VERSION != undefined', { timeout });
    return true;
}

describe('A/B: Old vs New inject during navigation', function () {
    this.timeout(30000);
    let browser;
    let server;
    let serverUrl;

    before(async function () {
        // Start local HTTP server
        server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            // Page sets Debug.VERSION after 800ms
            res.end(makePage(800));
        });
        await new Promise(resolve => {
            server.listen(0, '127.0.0.1', () => {
                serverUrl = `http://127.0.0.1:${server.address().port}`;
                resolve();
            });
        });

        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    });

    after(async function () {
        if (browser) await browser.close();
        if (server) await new Promise(resolve => server.close(resolve));
    });

    // ──────────────────────────────────────────────────────────
    // A: page.evaluate FAILS when context is destroyed (deterministic proof)
    // ──────────────────────────────────────────────────────────
    it('A (PROOF): page.evaluate throws "context destroyed" during navigation', async function () {
        const page = await browser.newPage();
        try {
            await page.goto(serverUrl, { waitUntil: 'load' });

            // Start a long-running evaluate (simulates an evaluate in-flight during navigation)
            const evalPromise = page.evaluate(async () => {
                await new Promise(r => setTimeout(r, 5000));
                return window.Debug?.VERSION;
            });

            // Navigate while evaluate is running (like IndexedDB recovery)
            await new Promise(r => setTimeout(r, 300));
            await page.goto(serverUrl, { waitUntil: 'load' });

            let error = null;
            try {
                await evalPromise;
            } catch (err) {
                error = err;
            }

            // evaluate should have thrown with context-destroyed
            expect(error).to.not.be.null;
            expect(error.message.toLowerCase()).to.satisfy(msg =>
                msg.includes('context') ||
                msg.includes('navigat') ||
                msg.includes('detach') ||
                msg.includes('target')
            );
            console.log('      [A] page.evaluate threw:', error.message);
        } finally {
            await page.close();
        }
    });

    // ──────────────────────────────────────────────────────────
    // B: NEW CODE - waitForFunction SURVIVES navigation
    // ──────────────────────────────────────────────────────────
    it('B (NEW CODE): waitForFunction SURVIVES navigation', async function () {
        const page = await browser.newPage();
        try {
            await page.goto(serverUrl, { waitUntil: 'load' });

            // Start new-style polling
            const pollPromise = newInjectPolling(page, 15000);

            // Same navigation trigger
            await new Promise(r => setTimeout(r, 300));
            page.evaluate(() => {
                window.location.reload();
            }).catch(() => {});

            // Should survive and resolve
            const result = await pollPromise;
            expect(result).to.equal(true);

            const version = await page.evaluate('window.Debug.VERSION');
            expect(version).to.equal('2.3000.0');
            console.log('      [B] Survived navigation! Got version:', version);
        } finally {
            await page.close();
        }
    });

    // ──────────────────────────────────────────────────────────
    // C: FULL FIX - both mechanisms together
    // ──────────────────────────────────────────────────────────
    it('C (FULL FIX): framenavigated + waitForFunction', async function () {
        const page = await browser.newPage();
        try {
            let framenavigatedCount = 0;
            let injectViaListenerOk = false;

            // Register BEFORE inject (our fix)
            page.on('framenavigated', async () => {
                framenavigatedCount++;
                try {
                    await page.waitForFunction('window.Debug?.VERSION != undefined', { timeout: 10000 });
                    await page.evaluate('window.Debug.VERSION');
                    injectViaListenerOk = true;
                } catch (e) { /* ignore */ }
            });

            await page.goto(serverUrl, { waitUntil: 'load' });

            const pollPromise = newInjectPolling(page, 15000);

            // Navigation mid-inject
            await new Promise(r => setTimeout(r, 300));
            page.evaluate(() => {
                window.location.reload();
            }).catch(() => {});

            await pollPromise;
            await new Promise(r => setTimeout(r, 2000));

            expect(framenavigatedCount).to.be.greaterThan(0);
            expect(injectViaListenerOk).to.equal(true);
            console.log('      [C] framenavigated:', framenavigatedCount, '| inject via listener:', injectViaListenerOk);
        } finally {
            await page.close();
        }
    });

    // ──────────────────────────────────────────────────────────
    // D: SANITY - both work WITHOUT navigation
    // ──────────────────────────────────────────────────────────
    it('D (SANITY): both work when there is no navigation', async function () {
        const page1 = await browser.newPage();
        try {
            await page1.goto(serverUrl, { waitUntil: 'load' });
            await oldInjectPolling(page1, 10000);
            console.log('      [D] Old code works without navigation');
        } finally {
            await page1.close();
        }

        const page2 = await browser.newPage();
        try {
            await page2.goto(serverUrl, { waitUntil: 'load' });
            await newInjectPolling(page2, 10000);
            console.log('      [D] New code works without navigation');
        } finally {
            await page2.close();
        }
    });
});
