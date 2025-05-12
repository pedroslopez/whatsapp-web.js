const { Client, LocalAuth } = require('./index');
const integratePresenceManager = require('./client-integration');

// Integrate the PresenceManager with the Client class
integratePresenceManager(Client);

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

client.on('ready', async () => {
    console.log('Client is ready!');

    // Replace with a valid contact number
    const contactJid = '60138373362@c.us'; // Replace with your test contact

    console.log(`Starting to track presence for ${contactJid}`);

    // Enable enhanced presence features
    const presenceManager = await client.enableEnhancedPresence();
    console.log('Enhanced presence enabled');

    // Log chat properties
    const chatProperties = await client.pupPage.evaluate((jid) => {
        try {
            if (!window.Store || !window.Store.Chat) {
                return { error: 'Store not available' };
            }

            const chat = window.Store.Chat.get(jid);
            if (!chat) {
                return { error: 'Chat not found' };
            }

            // Log chat properties
            return {
                hasWid: !!chat.wid,
                hasId: !!chat.id,
                hasXId: !!chat.__x_id,
                widType: chat.wid ? typeof chat.wid : null,
                idType: chat.id ? typeof chat.id : null,
                xIdType: chat.__x_id ? typeof chat.__x_id : null,
                widValue: chat.wid ? (typeof chat.wid === 'object' ? 'object' : chat.wid) : null,
                idValue: chat.id ? chat.id : null,
                xIdValue: chat.__x_id ? chat.__x_id : null
            };
        } catch (err) {
            return { error: err.message };
        }
    }, contactJid);

    console.log('Chat properties:', chatProperties);

    // Add contact to track with enhanced features
    await presenceManager.add(contactJid, { openChat: false }); // Don't open chat through presenceManager

    // Open chat directly using the method from direct-chat-test.js
    console.log(`Attempting to open chat for ${contactJid} directly...`);

    // Method 1: Direct URL navigation (most reliable in newer versions)
    console.log('Method 1: Direct URL navigation');

    // First, make sure we're on the main screen
    await client.pupPage.evaluate(() => {
        // Close any open panels or dialogs
        document.querySelector('[data-testid="x-viewer"]')?.click();
        document.querySelector('[data-testid="drawer-close"]')?.click();
    });

    // Navigate to the chat using hash
    await client.pupPage.evaluate((phone) => {
        // Format: phone@c.us -> /p/phone
        const phoneNumber = phone.replace('@c.us', '');
        console.log(`Setting hash to #/p/${phoneNumber}`);
        window.location.hash = `#/p/${phoneNumber}`;
    }, contactJid);

    // Wait longer for navigation
    console.log('Waiting for navigation...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if chat is open
    const headerVisible = await client.pupPage.evaluate(() => {
        return !!document.querySelector('[data-testid="conversation-header"]');
    });

    console.log('Direct URL navigation result - Header visible:', headerVisible);

    if (!headerVisible) {
        // Method 2: Try using the internal API
        console.log('Method 2: Using internal API');

        const result = await client.pupPage.evaluate(async (jid) => {
            try {
                // Get chat object
                const chat = window.Store.Chat.get(jid);
                if (!chat) {
                    return { success: false, error: 'Chat not found' };
                }

                // Log chat properties
                console.log('Chat properties:', {
                    hasWid: !!chat.wid,
                    hasId: !!chat.id,
                    hasXId: !!chat.__x_id,
                    widType: chat.wid ? typeof chat.wid : null,
                    idType: chat.id ? typeof chat.id : null,
                    xIdType: chat.__x_id ? typeof chat.__x_id : null,
                    widValue: chat.wid ? (typeof chat.wid === 'object' ? 'object' : chat.wid) : null,
                    idValue: chat.id ? chat.id : null,
                    xIdValue: chat.__x_id ? chat.__x_id : null
                });

                // Try different methods to open chat
                let opened = false;
                let method = '';

                // Method 2a: Cmd.openChatAt
                if (!opened && window.Store.Cmd && typeof window.Store.Cmd.openChatAt === 'function') {
                    try {
                        window.Store.Cmd.openChatAt(chat);
                        opened = true;
                        method = 'Cmd.openChatAt';
                    } catch (e) {
                        console.error('Error using Cmd.openChatAt:', e);
                    }
                }

                // Method 2b: Cmd.openChatFromUnread
                if (!opened && window.Store.Cmd && typeof window.Store.Cmd.openChatFromUnread === 'function') {
                    try {
                        window.Store.Cmd.openChatFromUnread(chat);
                        opened = true;
                        method = 'Cmd.openChatFromUnread';
                    } catch (e) {
                        console.error('Error using Cmd.openChatFromUnread:', e);
                    }
                }

                // Method 2c: chat.openChat
                if (!opened && typeof chat.openChat === 'function') {
                    try {
                        await chat.openChat();
                        opened = true;
                        method = 'chat.openChat';
                    } catch (e) {
                        console.error('Error using chat.openChat:', e);
                    }
                }

                return { success: opened, method };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }, contactJid);

        console.log('Method 2 result:', result);
    }

    // Periodically open the chat to refresh lastSeen
    setInterval(async () => {
        console.log('Opening chat to refresh lastSeen...');

        // Use direct URL navigation method instead of presenceManager.openChat
        await client.pupPage.evaluate((phone) => {
            // Close any open panels or dialogs
            document.querySelector('[data-testid="x-viewer"]')?.click();
            document.querySelector('[data-testid="drawer-close"]')?.click();

            // Format: phone@c.us -> /p/phone
            const phoneNumber = phone.replace('@c.us', '');
            console.log(`Setting hash to #/p/${phoneNumber}`);
            window.location.hash = `#/p/${phoneNumber}`;
        }, contactJid);

        // Wait for navigation
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Log chat properties again on each refresh
        const refreshChatProperties = await client.pupPage.evaluate((jid) => {
            try {
                if (!window.Store || !window.Store.Chat) {
                    return { error: 'Store not available' };
                }

                const chat = window.Store.Chat.get(jid);
                if (!chat) {
                    return { error: 'Chat not found' };
                }

                // Log chat properties
                return {
                    hasWid: !!chat.wid,
                    hasId: !!chat.id,
                    hasXId: !!chat.__x_id,
                    widType: chat.wid ? typeof chat.wid : null,
                    idType: chat.id ? typeof chat.id : null,
                    xIdType: chat.__x_id ? typeof chat.__x_id : null
                };
            } catch (err) {
                return { error: err.message };
            }
        }, contactJid);

        console.log('Refreshed chat properties:', refreshChatProperties);
    }, 120000); // Every 2 minutes

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
    console.log('Enhanced presence update:', data);
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

// Also listen for native presence updates for comparison
client.on('presence_update', (data) => {
    console.log('Native presence update:', data);
    console.log(`${data.jid} is ${data.isOnline ? 'online' : 'offline'}`);
    if (!data.isOnline && data.lastSeen) {
        console.log(`Last seen: ${new Date(data.lastSeen * 1000)}`);
    }
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
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
