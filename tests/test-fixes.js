'use strict';

/**
 * Test script for fix/critical-issues branch
 * Tests the error handling improvements (throw string → throw Error)
 *
 * Run: node tests/test-fixes.js
 */

const { Buttons, List } = require('../index.js');

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

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

if (failed > 0) {
    process.exit(1);
}

console.log('\n✅ All offline tests passed!');
console.log('\nNote: The following fixes require a real WhatsApp account to test:');
console.log('  - deleteChannel() reference fix');
console.log('  - LegacyAuthStore eval() → new Function()');
console.log('  - framenavigated try-catch error handling');
console.log('\nSee tests/test-fixes-online.js for online testing.');
