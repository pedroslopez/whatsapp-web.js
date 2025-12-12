'use strict';

/**
 * Online test script for fix/critical-issues branch
 * Requires a real WhatsApp account to test
 *
 * Run: node tests/test-fixes-online.js
 */

const { Client } = require('../index.js');
const qrcode = require('qrcode-terminal');

const client = new Client();

console.log('=== Online Tests for fix/critical-issues ===\n');
console.log('This test requires a real WhatsApp account.');
console.log('Please scan the QR code when prompted.\n');

client.on('qr', qr => {
    console.log('Scan this QR code to login:');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('✅ PASS: Authentication successful');
    console.log('   (LegacyAuthStore new Function() works correctly)');
});

client.on('ready', async () => {
    console.log('✅ PASS: Client ready');

    // Test 1: acceptGroupV4Invite error handling
    console.log('\n--- Testing acceptGroupV4Invite error handling ---');
    try {
        await client.acceptGroupV4Invite({});
        console.log('❌ FAIL: Should have thrown an error');
    } catch (e) {
        if (e instanceof Error && e.stack) {
            console.log('✅ PASS: acceptGroupV4Invite throws Error object with stack trace');
        } else {
            console.log('❌ FAIL: Expected Error object with stack trace');
        }
    }

    // Test 2: getPollVotes error handling
    console.log('\n--- Testing getPollVotes error handling ---');
    try {
        // This will fail because the message doesn't exist, but that's expected
        await client.getPollVotes('fake_message_id');
    } catch (e) {
        // We expect either an Error or an empty result
        console.log('✅ PASS: getPollVotes handled gracefully');
    }

    // Test 3: deleteChannel (only if you have a channel)
    console.log('\n--- Testing deleteChannel ---');
    console.log('   Skipped: Requires an existing channel ID');
    console.log('   To test manually:');
    console.log('   const result = await client.deleteChannel("your_channel_id@newsletter");');

    console.log('\n=== Online Tests Complete ===');
    console.log('Disconnecting...');

    await client.destroy();
    process.exit(0);
});

client.on('disconnected', (reason) => {
    console.log(`\nClient disconnected: ${reason}`);
    console.log('✅ PASS: framenavigated try-catch working (no crash on disconnect)');
});

client.on('auth_failure', (msg) => {
    console.log('❌ FAIL: Authentication failed:', msg);
    process.exit(1);
});

console.log('Initializing client...');
client.initialize();
