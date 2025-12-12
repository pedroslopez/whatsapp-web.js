'use strict';

/**
 * Test script for fix/critical-issues and fix/additional-issues branches
 * Tests error handling improvements and input validation
 *
 * Run: node tests/test-fixes.js
 */

const { Buttons, List, Client } = require('../index.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        passed++;
    } catch (e) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Error: ${e.message}`);
        failed++;
    }
}

async function testAsync(name, fn) {
    try {
        await fn();
        console.log(`✅ PASS: ${name}`);
        passed++;
    } catch (e) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Error: ${e.message}`);
        failed++;
    }
}

function expectError(fn, expectedMessage) {
    try {
        fn();
        throw new Error('Expected an error to be thrown');
    } catch (e) {
        if (!(e instanceof Error)) {
            throw new Error(`Expected Error object, got ${typeof e}`);
        }
        if (!e.stack) {
            throw new Error('Error should have stack trace');
        }
        if (expectedMessage && !e.message.includes(expectedMessage)) {
            throw new Error(`Expected message containing "${expectedMessage}", got "${e.message}"`);
        }
    }
}

async function expectErrorAsync(fn, expectedMessage) {
    try {
        await fn();
        throw new Error('Expected an error to be thrown');
    } catch (e) {
        if (!(e instanceof Error)) {
            throw new Error(`Expected Error object, got ${typeof e}`);
        }
        if (!e.stack) {
            throw new Error('Error should have stack trace');
        }
        if (expectedMessage && !e.message.includes(expectedMessage)) {
            throw new Error(`Expected message containing "${expectedMessage}", got "${e.message}"`);
        }
    }
}

async function runTests() {
    console.log('=== Testing Error Handling Improvements ===\n');

    // Test Buttons
    test('Buttons: throws Error object (not string) when empty', () => {
        expectError(() => new Buttons('body', [], 'title', 'footer'), '[BT01]');
    });

    // Test List - empty sections
    test('List: throws Error for empty sections', () => {
        expectError(() => new List('body', 'button', [], 'title', 'footer'), '[LT02]');
    });

    // Test List - section without rows
    test('List: throws Error for section without rows', () => {
        expectError(
            () => new List('body', 'button', [{ title: 'Section', rows: [] }], 'title', 'footer'),
            '[LT03]'
        );
    });

    // Test List - row without title
    test('List: throws Error for row without title', () => {
        expectError(
            () => new List('body', 'button', [{ title: 'Section', rows: [{ id: '1' }] }], 'title', 'footer'),
            '[LT04]'
        );
    });

    // Test List - multiple empty titles
    test('List: throws Error for multiple empty titles', () => {
        expectError(
            () => new List('body', 'button', [
                { rows: [{ title: 'Row1' }] },
                { rows: [{ title: 'Row2' }] }
            ], 'title', 'footer'),
            '[LT05]'
        );
    });

    // Test input validation
    console.log('\n=== Testing Input Validation ===\n');

    // Mock client for testing validation (without initializing browser)
    const mockClient = Object.create(Client.prototype);

    await testAsync('sendMessage: throws Error for missing chatId', async () => {
        await expectErrorAsync(() => mockClient.sendMessage(null, 'test'), 'chatId is required');
    });

    await testAsync('sendMessage: throws Error for non-string chatId', async () => {
        await expectErrorAsync(() => mockClient.sendMessage(123, 'test'), 'chatId is required');
    });

    await testAsync('sendMessage: throws Error for missing content', async () => {
        await expectErrorAsync(() => mockClient.sendMessage('123@c.us', null), 'content is required');
    });

    await testAsync('getChatById: throws Error for missing chatId', async () => {
        await expectErrorAsync(() => mockClient.getChatById(null), 'chatId is required');
    });

    await testAsync('getContactById: throws Error for missing contactId', async () => {
        await expectErrorAsync(() => mockClient.getContactById(null), 'contactId is required');
    });

    await testAsync('getMessageById: throws Error for missing messageId', async () => {
        await expectErrorAsync(() => mockClient.getMessageById(null), 'messageId is required');
    });

    await testAsync('createGroup: throws Error for missing title', async () => {
        await expectErrorAsync(() => mockClient.createGroup(null), 'title is required');
    });

    await testAsync('createGroup: throws Error for non-string title', async () => {
        await expectErrorAsync(() => mockClient.createGroup(123), 'title is required');
    });

    console.log(`\n=== Final Results: ${passed} passed, ${failed} failed ===`);

    if (failed > 0) {
        process.exit(1);
    }

    console.log('\n✅ All offline tests passed!');
    console.log('\nNote: The following fixes require a real WhatsApp account to test:');
    console.log('  - deleteChannel() reference fix');
    console.log('  - LegacyAuthStore eval() → new Function()');
    console.log('  - framenavigated try-catch error handling');
    console.log('  - destroy() event listener cleanup');
    console.log('\nSee tests/test-fixes-online.js for online testing.');
}

runTests().catch(e => {
    console.error('Test runner error:', e);
    process.exit(1);
});
