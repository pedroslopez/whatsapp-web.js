/**
 * Example of using the Enhanced Presence Manager
 * 
 * This example demonstrates how to use the enhanced presence features
 * to get more reliable lastSeen information.
 */

const { Client, LocalAuth } = require('./index');

// Create a new client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false, // Set to true in production
    }
});

// Event handlers
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('ready', async () => {
    console.log('Client is ready!');
    
    // Enable enhanced presence features
    const presenceManager = await client.enableEnhancedPresence();
    console.log('Enhanced presence enabled');
    
    // Replace with a valid contact number
    const contactJid = '1234567890@c.us'; // Replace with your test contact
    
    console.log(`Starting to track presence for ${contactJid}`);
    
    // Add contact to track with enhanced features
    await presenceManager.add(contactJid, { 
        openChat: true // Open the chat to make lastSeen visible in the UI
    });
    
    // Get initial presence
    const initialPresence = await client.getPresence(contactJid);
    if (initialPresence) {
        console.log('Initial presence:', initialPresence);
    }
    
    // Show status every minute
    setInterval(() => {
        const status = presenceManager.getStatus();
        console.log('\n--- Presence Manager Status ---');
        console.log(`Running: ${status.isRunning}`);
        console.log(`Tracking ${status.contactCount} contacts`);
        console.log(`Last focus: ${status.lastFocusTime}`);
        console.log(`Poll interval: ${status.pollInterval}ms`);
        console.log(`Focus interval: ${status.focusInterval}ms`);
        console.log('-------------------------------\n');
    }, 60000);
});

// Listen for enhanced presence updates
client.on('enhanced_presence', (data) => {
    console.log('\nEnhanced presence update:', data);
    console.log(`${data.jid} is ${data.isOnline ? 'online' : 'offline'}`);
    
    if (data.lastSeen) {
        const lastSeenDate = new Date(data.lastSeen * 1000);
        let sourceInfo = '';
        
        if (data.historical) {
            sourceInfo += ' (historical)';
        }
        
        if (data.lastSeenSource) {
            sourceInfo += ` [source: ${data.lastSeenSource}]`;
        }
        
        console.log(`Last seen: ${lastSeenDate.toLocaleString()}${sourceInfo}`);
    }
});

// Also listen for standard presence updates for comparison
client.on('presence_update', (data) => {
    console.log('\nStandard presence update:', data);
    console.log(`${data.jid} is ${data.isOnline ? 'online' : 'offline'}`);
    if (data.lastSeen) {
        console.log(`Last seen: ${new Date(data.lastSeen * 1000).toLocaleString()}`);
    }
});

client.on('auth_failure', (msg) => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected', reason);
});

// Initialize the client
client.initialize();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    
    // Get the presence manager and stop it
    const presenceManager = client.getPresenceManager();
    if (presenceManager) {
        presenceManager.stop();
    }
    
    await client.destroy();
    process.exit(0);
});
