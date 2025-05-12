// presence-manager.js
class PresenceManager {
    constructor(client) {
        this.client = client;
        this.jids = new Set();
        this.history = new Map();
        this.timer = null;
        this.lastFocusTime = 0;
        this.focusInterval = 60000; // 1 minute between focus calls
        this.pollInterval = 15000;  // 15 seconds between polls

        // Add queryPresence method to client if it doesn't exist
        if (!client.queryPresence) {
            client.queryPresence = async (jid) => {
                return await client.pupPage.evaluate(jid => {
                    const utils = window.Store.PresenceUtils || {};
                    const wid = window.Store.WidFactory.createWid(jid);
                    return utils.query?.([wid]) ||       // comet ≥ 2.2403
                 utils.sendSubscribe?.([wid]) || // 2.23xx betas
                 false;
                }, jid);
            };
        }

        // Listen for native presence updates to also store in history
        client.on('presence_update', update => {
            if (!update.isOnline && update.lastSeen) {
                this.storeLastSeen(update.jid, update.lastSeen);
            }
        });
    }

    async openChat(jid) {
        try {
            const normalizedJid = jid.endsWith('@c.us') ? jid : `${jid}@c.us`;

            // First try to find and click the chat in the sidebar
            const clickResult = await this.client.pupPage.evaluate(chatId => {
                try {
                    // Find the chat in the sidebar by phone number
                    const phoneNumber = chatId.replace('@c.us', '');

                    // Look for elements containing the phone number
                    const chatElements = Array.from(document.querySelectorAll('[data-testid="cell-frame-title"]'));
                    const targetChat = chatElements.find(el =>
                        el.textContent.includes(phoneNumber) ||
            el.innerText.includes(phoneNumber)
                    );

                    if (targetChat) {
                        // Find the clickable parent element
                        let clickableElement = targetChat;
                        while (clickableElement && !clickableElement.matches('[role="row"]')) {
                            clickableElement = clickableElement.parentElement;
                        }

                        if (clickableElement) {
                            // Click the chat
                            clickableElement.click();
                            return { success: true, method: 'sidebar_click' };
                        }
                    }

                    return { success: false, error: 'Chat not found in sidebar' };
                } catch (err) {
                    return { success: false, error: err.message };
                }
            }, normalizedJid);

            if (!clickResult.success) {
                // If clicking failed, try alternative methods

                // Try using WhatsApp's internal API
                const apiResult = await this.client.pupPage.evaluate(chatId => {
                    try {
                        if (!window.Store || !window.Store.Chat || !window.Store.Cmd) {
                            return { success: false, error: 'Store not available' };
                        }

                        const chat = window.Store.Chat.get(chatId);
                        if (!chat) {
                            return {
                                success: false,
                                error: 'Chat not found',
                                storeAvailable: true
                            };
                        }

                        // Log chat properties
                        const chatProperties = {
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

                        console.log('Chat properties:', chatProperties);

                        // Try different methods based on WhatsApp version
                        if (typeof window.Store.Cmd.openChatAt === 'function') {
                            window.Store.Cmd.openChatAt(chat);
                            return {
                                success: true,
                                method: 'openChatAt',
                                chatProperties
                            };
                        }

                        if (typeof window.Store.Cmd.openChatFromUnread === 'function') {
                            window.Store.Cmd.openChatFromUnread(chat);
                            return {
                                success: true,
                                method: 'openChatFromUnread',
                                chatProperties
                            };
                        }

                        return {
                            success: false,
                            error: 'No suitable open method found',
                            chatProperties
                        };
                    } catch (err) {
                        return { success: false, error: err.message };
                    }
                }, normalizedJid);

                if (!apiResult.success) {
                    console.log(`Could not open chat: ${apiResult.error}`);
                } else {
                    console.log(`Opened chat using ${apiResult.method}`);
                }
            } else {
                console.log(`Opened chat using ${clickResult.method}`);
            }

            // Wait for the header to load
            await this.client.pupPage.waitForSelector('[data-testid="conversation-header"]', { timeout: 5000 })
                .catch(() => console.log('Header not found after opening chat'));

            // Focus the chat
            await this.softFocus();

            return true;
        } catch (err) {
            console.error(`Error opening chat for ${jid}:`, err);
            return false;
        }
    }

    async add(jid, options = {}) {
    // Normalize JID format
        const normalizedJid = jid.endsWith('@c.us') ? jid : `${jid}@c.us`;
        this.jids.add(normalizedJid);

        try {
            // Initial subscription
            await this.client.subscribePresence(normalizedJid);

            // Open the chat if requested
            if (options.openChat) {
                await this.openChat(normalizedJid);
            }

            // Get initial presence
            const presence = await this.client.getPresence(normalizedJid);
            if (presence && !presence.isOnline && presence.lastSeen) {
                this.storeLastSeen(normalizedJid, presence.lastSeen);
            }
        } catch (err) {
            console.error(`Error adding ${normalizedJid} to presence tracking:`, err);
        }

        return normalizedJid;
    }

    remove(jid) {
        const normalizedJid = jid.endsWith('@c.us') ? jid : `${jid}@c.us`;
        this.jids.delete(normalizedJid);
        return normalizedJid;
    }

    start() {
        if (this.timer) return; // Already running

        this.tick(); // Run immediately
        this.timer = setInterval(() => this.tick(), this.pollInterval);
        return this;
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        return this;
    }

    isRunning() {
        return !!this.timer;
    }

    async softFocus() {
        const now = Date.now();
        if (now < this.lastFocusTime + this.focusInterval) return false;

        try {
            this.lastFocusTime = now;
            await this.client.pupPage.evaluate(() => {
                if (window.Store && window.Store.AppState && typeof window.Store.AppState.sendFocus === 'function') {
                    window.Store.AppState.sendFocus(true);
                    return true;
                }
                return false;
            });
            return true;
        } catch (err) {
            console.error('Error sending focus:', err);
            return false;
        }
    }

    async extractLastSeenFromUI(jid) {
        try {
            // First, make sure the chat is open to see the header
            await this.openChat(jid);

            // Wait a moment for the UI to update
            await new Promise(resolve => setTimeout(resolve, 500));

            return await this.client.pupPage.evaluate(jid => {
                try {
                    // Try multiple sources to get the lastSeen timestamp

                    // 1. Try the chat header (most reliable when chat is open)
                    try {
                        // Look for the status in the header (online/last seen)
                        const headerSelectors = [
                            // Main header status element
                            'span[title*="last seen"]',
                            // Alternative selectors for different WhatsApp versions
                            '[data-testid="conversation-info-header-status"]',
                            '.ggj6brxn[title*="last seen"]',
                            '._3-cMa._3Whw5[title*="last seen"]',
                            // Online status
                            'span[title="online"]',
                            '[data-testid="conversation-info-header-status"]:contains("online")'
                        ];

                        for (const selector of headerSelectors) {
                            try {
                                const elements = document.querySelectorAll(selector);
                                for (const el of elements) {
                                    const text = el.getAttribute('title') || el.textContent;
                                    if (text && (text.includes('last seen') || text.includes('online'))) {
                                        return { source: 'header', text };
                                    }
                                }
                            } catch (err) {
                                console.log(`Error with selector ${selector}:`, err);
                            }
                        }

                        // Try to find any element in the header that might contain last seen info
                        const headerArea = document.querySelector('[data-testid="conversation-header"]');
                        if (headerArea) {
                            const possibleStatusElements = headerArea.querySelectorAll('span, div');
                            for (const el of possibleStatusElements) {
                                const text = el.getAttribute('title') || el.textContent;
                                if (text && (text.includes('last seen') || text.includes('online'))) {
                                    return { source: 'header_scan', text };
                                }
                            }
                        }
                    } catch (e) {
                        console.log('Error checking header lastSeen:', e);
                    }

                    // 2. Try the contact info page
                    try {
                        const contactInfoLastSeen = document.querySelector('div[title*="last seen"]');
                        if (contactInfoLastSeen) {
                            const text = contactInfoLastSeen.getAttribute('title');
                            if (text && text.includes('last seen')) {
                                return { source: 'contact_info', text };
                            }
                        }
                    } catch (e) {
                        console.log('Error checking contact info lastSeen:', e);
                    }

                    // 3. Try the internal data structures - Contact
                    try {
                        if (window.Store && window.Store.Contact && typeof window.Store.Contact.get === 'function') {
                            const contact = window.Store.Contact.get(jid);
                            if (contact && contact.presence && contact.presence.lastSeen) {
                                return { source: 'contact_presence', timestamp: contact.presence.lastSeen };
                            }
                        }
                    } catch (e) {
                        console.log('Error checking Contact model:', e);
                    }

                    // 4. Try the chat object
                    try {
                        if (window.Store && window.Store.Chat && typeof window.Store.Chat.get === 'function') {
                            const chat = window.Store.Chat.get(jid);
                            if (chat && chat.presence && chat.presence.lastSeen) {
                                return { source: 'chat_presence', timestamp: chat.presence.lastSeen };
                            }
                        }
                    } catch (e) {
                        console.log('Error checking Chat model:', e);
                    }

                    // 5. Try the t value in the presence collection
                    try {
                        if (window.Store && window.Store.PresenceCollection &&
                typeof window.Store.PresenceCollection.get === 'function') {
                            const presenceData = window.Store.PresenceCollection.get(jid);
                            if (presenceData && presenceData.chatstate && presenceData.chatstate.t) {
                                return { source: 'chatstate', timestamp: presenceData.chatstate.t };
                            }
                        }
                    } catch (e) {
                        console.log('Error checking PresenceCollection:', e);
                    }

                    return null;
                } catch (err) {
                    console.error('Error in extractLastSeenFromUI:', err);
                    return null;
                }
            }, jid);
        } catch (err) {
            console.error('Error extracting lastSeen from UI:', err);
            return null;
        }
    }

    parseLastSeenText(text) {
        if (!text) return null;

        // Handle "online" case immediately
        if (text.toLowerCase() === 'online') {
            return Math.floor(Date.now() / 1000); // Current timestamp
        }

        // Convert text like "last seen today at 7:21 pm" to a timestamp
        try {
            const now = new Date();
            const lowerText = text.toLowerCase();

            // Extract time components - handle different formats
            let timeMatch = lowerText.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);

            // Try 24-hour format if AM/PM format fails
            if (!timeMatch) {
                timeMatch = lowerText.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                    // Assume 24-hour format
                    const hours = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);

                    // Set the time
                    const date = new Date(now);
                    date.setHours(hours, minutes, 0, 0);

                    // Handle relative day references
                    if (lowerText.includes('yesterday')) {
                        date.setDate(date.getDate() - 1);
                    } else if (lowerText.includes('today')) {
                        // Already set to today
                    } else if (lowerText.match(/\d+\s+days?\s+ago/)) {
                        // Handle "X days ago" format
                        const daysAgoMatch = lowerText.match(/(\d+)\s+days?\s+ago/);
                        if (daysAgoMatch) {
                            const daysAgo = parseInt(daysAgoMatch[1], 10);
                            date.setDate(date.getDate() - daysAgo);
                        }
                    } else if (lowerText.match(/\d+\s+weeks?\s+ago/)) {
                        // Handle "X weeks ago" format
                        const weeksAgoMatch = lowerText.match(/(\d+)\s+weeks?\s+ago/);
                        if (weeksAgoMatch) {
                            const weeksAgo = parseInt(weeksAgoMatch[1], 10);
                            date.setDate(date.getDate() - (weeksAgo * 7));
                        }
                    }

                    // Convert to Unix timestamp (seconds)
                    return Math.floor(date.getTime() / 1000);
                }

                return null; // No time format found
            }

            // Process 12-hour format
            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const isPM = timeMatch[3].toLowerCase() === 'pm';

            // Convert to 24-hour format
            if (isPM && hours < 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;

            // Set the time
            const date = new Date(now);
            date.setHours(hours, minutes, 0, 0);

            // Handle different date references
            if (lowerText.includes('yesterday')) {
                date.setDate(date.getDate() - 1);
            } else if (lowerText.includes('today')) {
                // Already set to today
            } else if (lowerText.match(/\d+\s+days?\s+ago/)) {
                // Handle "X days ago" format
                const daysAgoMatch = lowerText.match(/(\d+)\s+days?\s+ago/);
                if (daysAgoMatch) {
                    const daysAgo = parseInt(daysAgoMatch[1], 10);
                    date.setDate(date.getDate() - daysAgo);
                }
            } else if (lowerText.match(/\d+\s+weeks?\s+ago/)) {
                // Handle "X weeks ago" format
                const weeksAgoMatch = lowerText.match(/(\d+)\s+weeks?\s+ago/);
                if (weeksAgoMatch) {
                    const weeksAgo = parseInt(weeksAgoMatch[1], 10);
                    date.setDate(date.getDate() - (weeksAgo * 7));
                }
            }
            // Handle month names (e.g., "last seen January 15 at 7:21 pm")
            else if (lowerText.match(/january|february|march|april|may|june|july|august|september|october|november|december/)) {
                const months = {
                    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
                    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
                };

                // Try to extract month and day
                for (const [monthName, monthIndex] of Object.entries(months)) {
                    if (lowerText.includes(monthName)) {
                        const dayMatch = lowerText.match(new RegExp(`${monthName}\\s+(\\d{1,2})`));
                        if (dayMatch) {
                            const day = parseInt(dayMatch[1], 10);
                            date.setMonth(monthIndex, day);

                            // If the resulting date is in the future, assume it's from last year
                            if (date > now) {
                                date.setFullYear(date.getFullYear() - 1);
                            }

                            break;
                        }
                    }
                }
            }
            // Handle specific date case (e.g., "last seen 5/12/2023 at 7:21 pm")
            else if (lowerText.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
                const dateMatch = lowerText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (dateMatch) {
                    const month = parseInt(dateMatch[1], 10) - 1; // JS months are 0-indexed
                    const day = parseInt(dateMatch[2], 10);
                    const year = parseInt(dateMatch[3], 10);
                    date.setFullYear(year, month, day);
                }
            }
            // Handle specific date case (e.g., "last seen 12-05-2023 at 7:21 pm")
            else if (lowerText.match(/\d{1,2}-\d{1,2}-\d{4}/)) {
                const dateMatch = lowerText.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
                if (dateMatch) {
                    const day = parseInt(dateMatch[1], 10);
                    const month = parseInt(dateMatch[2], 10) - 1; // JS months are 0-indexed
                    const year = parseInt(dateMatch[3], 10);
                    date.setFullYear(year, month, day);
                }
            }

            // Convert to Unix timestamp (seconds)
            return Math.floor(date.getTime() / 1000);
        } catch (err) {
            console.error('Error parsing lastSeen text:', err, text);
            return null;
        }
    }

    async tick() {
        try {
            // Check if client is still connected
            if (!this.client.pupPage || this.client.pupPage.isClosed()) {
                console.log('Browser page is closed, stopping presence manager');
                this.stop();
                return;
            }

            // Send focus to keep connection alive (throttled internally)
            await this.softFocus();

            // Group JIDs by online status to optimize processing
            const jidsToProcess = Array.from(this.jids);
            const onlineJids = [];
            const offlineJidsWithLastSeen = [];
            const offlineJidsWithoutLastSeen = [];

            // First pass: categorize JIDs by current presence status
            for (const jid of jidsToProcess) {
                try {
                    const currentPresence = await this.client.getPresence(jid).catch(() => null);
                    if (!currentPresence) continue;

                    if (currentPresence.isOnline) {
                        onlineJids.push(jid);
                    } else if (currentPresence.lastSeen) {
                        offlineJidsWithLastSeen.push(jid);
                    } else {
                        offlineJidsWithoutLastSeen.push(jid);
                    }
                } catch (err) {
                    console.log(`Could not get presence for ${jid}, skipping this cycle`);
                }
            }

            // Process online JIDs (just emit events, no need to query)
            for (const jid of onlineJids) {
                try {
                    const presence = { jid, isOnline: true };
                    this.client.emit('enhanced_presence', presence);
                    this.client.emit('presence_update', presence);
                } catch (err) {
                    console.error(`Error processing online presence for ${jid}:`, err);
                }
            }

            // Process offline JIDs with lastSeen (query for updates but don't need UI extraction)
            for (const jid of offlineJidsWithLastSeen) {
                try {
                    // Query for fresh data
                    await this.client.queryPresence(jid).catch(() => {});

                    // Get updated presence
                    const presence = await this.client.getPresence(jid).catch(() => null);
                    if (!presence) continue;

                    // Store lastSeen if available
                    if (!presence.isOnline && presence.lastSeen) {
                        this.storeLastSeen(jid, presence.lastSeen);
                    }

                    // Enhance and emit events
                    const enhanced = this.enhancePresence(jid, presence);
                    this.client.emit('enhanced_presence', enhanced);
                    this.client.emit('presence_update', {
                        jid,
                        isOnline: enhanced.isOnline,
                        lastSeen: enhanced.lastSeen
                    });
                } catch (err) {
                    console.error(`Error processing presence for ${jid}:`, err);
                }
            }

            // Process offline JIDs without lastSeen (need UI extraction)
            // Only process a few per cycle to avoid too many chat openings
            const maxUiExtractionsPerCycle = 2;
            const jidsToExtract = offlineJidsWithoutLastSeen.slice(0, maxUiExtractionsPerCycle);

            for (const jid of jidsToExtract) {
                try {
                    // Query for fresh data
                    await this.client.queryPresence(jid).catch(() => {});

                    // Get updated presence
                    let presence = await this.client.getPresence(jid).catch(() => null);
                    if (!presence) continue;

                    // If still no lastSeen, try to extract from UI
                    if (!presence.isOnline && !presence.lastSeen) {
                        try {
                            // Open the chat to see the header
                            await this.openChat(jid);

                            const uiLastSeen = await this.extractLastSeenFromUI(jid);
                            if (uiLastSeen) {
                                console.log(`Extracted lastSeen for ${jid} from ${uiLastSeen.source}:`, uiLastSeen);

                                // If we got a timestamp directly, use it
                                if (uiLastSeen.timestamp) {
                                    presence.lastSeen = uiLastSeen.timestamp;
                                    presence.lastSeenSource = uiLastSeen.source;
                                }
                                // If we got text, parse it
                                else if (uiLastSeen.text) {
                                    const parsedTimestamp = this.parseLastSeenText(uiLastSeen.text);
                                    if (parsedTimestamp) {
                                        presence.lastSeen = parsedTimestamp;
                                        presence.lastSeenSource = `${uiLastSeen.source}_parsed`;
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('Error extracting lastSeen from UI:', err);
                        }
                    }

                    // Store lastSeen if available
                    if (!presence.isOnline && presence.lastSeen) {
                        this.storeLastSeen(jid, presence.lastSeen);
                    }

                    // Enhance and emit both events for backward compatibility
                    const enhanced = this.enhancePresence(jid, presence);
                    this.client.emit('enhanced_presence', enhanced);
                    this.client.emit('presence_update', {
                        jid,
                        isOnline: enhanced.isOnline,
                        lastSeen: enhanced.lastSeen
                    });
                } catch (err) {
                    console.error(`Error processing presence for ${jid}:`, err);
                }
            }
        } catch (err) {
            console.error('Error in presence tick:', err);

            // If we get a fatal error, stop the manager
            if (err.message && (
                err.message.includes('Session closed') ||
          err.message.includes('Target closed') ||
          err.message.includes('has been closed')
            )) {
                console.log('Browser session closed, stopping presence manager');
                this.stop();
            }
        }
    }

    storeLastSeen(jid, timestamp) {
        if (!this.history.has(jid)) {
            this.history.set(jid, []);
        }

        const history = this.history.get(jid);
        history.push(timestamp);

        // Keep only last 20 entries
        while (history.length > 20) history.shift();
    }

    enhancePresence(jid, presence) {
    // If we already have lastSeen, no need to enhance
        if (presence.lastSeen) return { jid, ...presence };

        // Try to get historical lastSeen
        const history = this.history.get(jid) || [];
        if (history.length === 0) return { jid, ...presence };

        // Use the most recent historical lastSeen
        return {
            jid,
            ...presence,
            lastSeen: history[history.length - 1],
            historical: true
        };
    }

    getLastSeen(jid) {
        const normalizedJid = jid.endsWith('@c.us') ? jid : `${jid}@c.us`;
        const history = this.history.get(normalizedJid) || [];
        return history.length > 0 ? history[history.length - 1] : null;
    }

    // Optional: Persistence methods
    saveToStorage() {
    // Convert history Map to serializable object
        const historyObj = {};
        for (const [jid, timestamps] of this.history.entries()) {
            historyObj[jid] = timestamps;
        }

        return {
            jids: Array.from(this.jids),
            history: historyObj
        };
    }

    loadFromStorage(data) {
        if (!data) return this;

        // Restore JIDs
        if (Array.isArray(data.jids)) {
            data.jids.forEach(jid => this.jids.add(jid));
        }

        // Restore history
        if (data.history && typeof data.history === 'object') {
            for (const [jid, timestamps] of Object.entries(data.history)) {
                if (Array.isArray(timestamps)) {
                    this.history.set(jid, timestamps);
                }
            }
        }

        return this;
    }

    getStatus() {
        return {
            isRunning: !!this.timer,
            trackedContacts: Array.from(this.jids),
            contactCount: this.jids.size,
            historySize: this.history.size,
            lastFocusTime: this.lastFocusTime ? new Date(this.lastFocusTime).toLocaleString() : 'Never',
            pollInterval: this.pollInterval,
            focusInterval: this.focusInterval
        };
    }
}

module.exports = PresenceManager;
