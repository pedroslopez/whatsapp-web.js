const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { Client, LocalAuth } = require('../index');

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('Session Restoration', function() {
    let client;
    this.timeout(300000); // 5 minutes timeout for the entire test

    before(async function() {
        // Initialize client with LocalAuth
        client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'test-client'
            }),
            puppeteer: {
                headless: false
            }
        });

        // Set up event handlers before initializing
        client.on('qr', (qr) => {
            console.log('QR RECEIVED', qr);
            console.log('Please scan this QR code with your WhatsApp');
        });

        client.on('authenticated', () => {
            console.log('Client authenticated');
        });

        client.on('ready', () => {
            console.log('Client is ready!');
        });

        await client.initialize();
        await new Promise((resolve) => client.once('ready', resolve));
    });

    it('should receive message events after session restoration', async function() {
        this.timeout(120000); // 2 minutes timeout for this specific test
        
        // Store to track received messages
        let messagesReceived = {
            beforeRestart: 0,
            afterRestart: 0
        };

        // Listen for messages before restart
        client.on('message', (msg) => {
            if (msg.body.startsWith('TEST_MESSAGE')) {
                console.log('Received test message before restart:', msg.body);
                messagesReceived.beforeRestart++;
            }
        });

        // Wait for initial message
        console.log('Please send a message starting with "TEST_MESSAGE" to the client...');
        await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('No message received before timeout');
                resolve();
            }, 30000);

            client.on('message', (msg) => {
                if (msg.body.startsWith('TEST_MESSAGE')) {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });

        // Close and reinitialize
        console.log('Closing client...');
        await client.destroy();
        console.log('Client closed');

        // Reinitialize with crypto store reinitialization
        console.log('Reinitializing client...');
        client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'test-client'
            }),
            puppeteer: {
                headless: false
            }
        });

        client.on('authenticated', () => {
            console.log('Client re-authenticated');
        });

        client.on('ready', () => {
            console.log('Client is ready again!');
        });

        client.on('message', (msg) => {
            if (msg.body.startsWith('TEST_MESSAGE')) {
                console.log('Received test message after restart:', msg.body);
                messagesReceived.afterRestart++;
            }
        });

        await client.initialize();
        await client.reinitializeCryptoStore();

        // Wait for another test message
        console.log('Please send another message starting with "TEST_MESSAGE" to the client...');
        await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('No message received after restart before timeout');
                resolve();
            }, 30000);

            client.on('message', (msg) => {
                if (msg.body.startsWith('TEST_MESSAGE')) {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });

        // Assert that messages were received both before and after restart
        expect(messagesReceived.beforeRestart).to.be.above(0, 'Should receive messages before restart');
        expect(messagesReceived.afterRestart).to.be.above(0, 'Should receive messages after restart');
    });

    after(async function() {
        if (client) {
            await client.destroy();
        }
    });
}); 