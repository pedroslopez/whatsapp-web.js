// presence-manager.js
class PresenceManager {
    constructor(client) {
        this.client = client;
        this.jids = new Set();
        this.history = new Map();
        this.timer = null;
        this.clickTimer = null;
        this.lastFocusTime = 0;
        this.lastClickTime = 0;
        this.focusInterval = 30000; // 30 seconds between focus calls (reduced from 60s)
        this.clickInterval = 30000; // 30 seconds between chat area clicks
        this.pollInterval = 20000;  // 10 seconds between polls (reduced from 15s)
        this.lastOpenedChat = null;
        this.lastOpenTime = 0;
        this.chatRotationInterval = 120000; // 2 minutes between rotating chats
        this.debugMode = false; // Set to true to enable verbose logging
        this.primaryJid = null; // The primary JID to focus on

        // Track online status changes to detect transitions
        this.onlineStatus = new Map();

        // Track data sources for comparison
        this.lastSeenSources = new Map();

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
            const phoneNumber = normalizedJid.replace('@c.us', '');


            // First check if we're already on a chat page
            const alreadyOnChat = await this.client.pupPage.evaluate(() => {
                return !!document.querySelector('[data-testid="conversation-panel-body"]');
            });

            if (alreadyOnChat) {
                // If we're already on a chat, check if it's the right one
                const currentChatTitle = await this.client.pupPage.evaluate(() => {
                    const titleElement = document.querySelector('[data-testid="conversation-header"] [data-testid="conversation-info-header-chat-title"]');
                    return titleElement ? titleElement.textContent : null;
                });

                if (currentChatTitle && currentChatTitle.includes(phoneNumber)) {

                    // Just focus on the input box
                    const inputBox = await this.client.pupPage.$('[data-testid="conversation-compose-box-input"]');
                    if (inputBox) {
                        await inputBox.click();
                        return true;
                    }
                }
            }

            // Use direct hash navigation - the most reliable method
            // Use the phone number from the JID
            const numberToUse = phoneNumber;

            await this.client.pupPage.evaluate((phone) => {
                window.location.hash = `#/p/${phone}`;
            }, numberToUse);

            // Wait for navigation
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Focus on the input box to ensure we can see presence info
            const inputBox = await this.client.pupPage.$('[data-testid="conversation-compose-box-input"]');
            if (inputBox) {
                await inputBox.click();
            }

            return true;
        } catch (err) {
            console.error(`[PresenceManager] Error opening chat for ${jid}:`, err);
            return false;
        }
    }

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled Whether to enable debug mode
     */
    setDebugMode(enabled = true) {
        this.debugMode = enabled;
        return this;
    }

    /**
     * Set the primary JID to focus on
     * @param {string} jid The JID to set as primary
     * @returns {this} The PresenceManager instance for chaining
     */
    setPrimaryJid(jid) {
        const normalizedJid = jid.endsWith('@c.us') ? jid : `${jid}@c.us`;
        this.primaryJid = normalizedJid;


        return this;
    }

    /**
     * Get the primary JID
     * @returns {string|null} The primary JID or null if not set
     */
    getPrimaryJid() {
        return this.primaryJid;
    }

    /**
     * Set the click interval in milliseconds
     * @param {number} interval The interval in milliseconds
     * @returns {this} The PresenceManager instance for chaining
     */
    setClickInterval(interval) {
        this.clickInterval = interval;

        // Restart the click timer if it's already running
        if (this.clickTimer) {
            clearInterval(this.clickTimer);
            this.clickTimer = setInterval(() => this.simulateChatClick(), this.clickInterval);

        }

        return this;
    }



    /**
     * Add a contact to presence tracking
     * @param {string} jid The JID to track
     * @param {object} options Options for tracking
     * @param {boolean} options.openChat Whether to open the chat immediately
     * @param {boolean} options.forceQuery Whether to force a presence query
     * @param {boolean} options.setPrimary Whether to set this as the primary JID for focus
     * @returns {string} The normalized JID
     */
    async add(jid, options = {}) {
        // Normalize JID format
        const normalizedJid = jid.endsWith('@c.us') ? jid : `${jid}@c.us`;
        this.jids.add(normalizedJid);

        try {

            // Set as primary JID if requested or if this is the first JID added
            if (options.setPrimary || this.jids.size === 1) {
                this.setPrimaryJid(normalizedJid);
            }



            // Open the chat if requested
            if (options.openChat) {
                const opened = await this.openChat(normalizedJid);


                // If this is the first chat we're opening, set it as the last opened chat
                if (opened && !this.lastOpenedChat) {
                    this.lastOpenedChat = normalizedJid;
                    this.lastOpenTime = Date.now();
                }
            }

            // Force a presence query if requested or if openChat is true
            if (options.forceQuery || options.openChat) {
                try {
                    // Attempt to query presence
                    await this.client.queryPresence(normalizedJid);

                    // Optional: Add a small delay to allow WhatsApp to process the query
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch {
                    // Silently ignore errors - query failures shouldn't stop the process
                    // If debugging is needed in the future, add a comment here explaining
                    // what types of errors might occur and how to handle them
                }
            }

            // Get initial presence
            const presence = await this.client.getPresence(normalizedJid);


            if (presence && !presence.isOnline && presence.lastSeen) {
                this.storeLastSeen(normalizedJid, presence.lastSeen);
            }

            // If no lastSeen is available, try to extract it from the UI
            if (presence && !presence.isOnline && !presence.lastSeen && options.openChat) {
                try {
                    const uiLastSeen = await this.extractLastSeenFromUI(normalizedJid);
                    if (uiLastSeen) {

                        // Process the UI last seen data
                        if (uiLastSeen.timestamp) {
                            this.storeLastSeen(normalizedJid, uiLastSeen.timestamp);
                        } else if (uiLastSeen.text) {
                            const parsedTimestamp = this.parseLastSeenText(uiLastSeen.text);
                            if (parsedTimestamp) {
                                this.storeLastSeen(normalizedJid, parsedTimestamp);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Error extracting initial lastSeen for ${normalizedJid}:`, err);
                }
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

        // Start the chat click timer
        this.simulateChatClick(); // Run immediately
        this.clickTimer = setInterval(() => this.simulateChatClick(), this.clickInterval);


        return this;
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        if (this.clickTimer) {
            clearInterval(this.clickTimer);
            this.clickTimer = null;
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
            const result = await this.client.pupPage.evaluate(() => {
                if (window.Store && window.Store.AppState && typeof window.Store.AppState.sendFocus === 'function') {
                    window.Store.AppState.sendFocus(true);
                    return true;
                }
                return false;
            });


            return result;
        } catch (err) {
            console.error('Error sending focus:', err);
            return false;
        }
    }

    /**
     * Performs multiple UI interactions to keep WhatsApp Web active and prevent idle state
     * This is crucial for maintaining presence detection
     * @returns {Promise<boolean>} Whether the interactions were successful
     */
    async simulateChatClick() {
        const now = Date.now();
        if (now < this.lastClickTime + this.clickInterval) return false;

        try {
            this.lastClickTime = now;

            // First check if we're on a chat page
            const onChatPage = await this.client.pupPage.evaluate(() => {
                return !!document.querySelector('[data-testid="conversation-panel-body"]');
            });

            if (!onChatPage) {

                // If we're not on a chat page, try to open the primary chat
                if (this.primaryJid) {
                    await this.openChat(this.primaryJid);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for navigation

                    // Check again if we're on a chat page
                    const nowOnChatPage = await this.client.pupPage.evaluate(() => {
                        return !!document.querySelector('[data-testid="conversation-panel-body"]');
                    });

                    if (!nowOnChatPage) {

                        // Try direct navigation as a fallback
                        const phoneNumber = this.primaryJid.replace('@c.us', '');
                        await this.client.pupPage.evaluate((phone) => {
                            window.location.hash = `#/p/${phone}`;
                        }, phoneNumber);

                        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait longer for navigation
                    }
                }
            }

            // Get all the important UI elements we need to interact with
            const uiElements = await this.client.pupPage.evaluate(() => {
                try {
                    const elements = {
                        header: document.querySelector('[data-testid="conversation-header"]'),
                        chatTitle: document.querySelector('[data-testid="conversation-info-header-chat-title"]'),
                        chatArea: document.querySelector('[data-testid="conversation-panel-body"]'),
                        inputBox: document.querySelector('[data-testid="conversation-compose-box-input"]'),
                        bubbles: Array.from(document.querySelectorAll('[data-testid="msg-container"]')),
                        statusElement: document.querySelector('span[title*="last seen"], span[title="online"]'),
                        searchBox: document.querySelector('[data-testid="chat-list-search"]')
                    };

                    // Get positions for each element
                    const positions = {};
                    for (const [key, element] of Object.entries(elements)) {
                        if (!element || (Array.isArray(element) && element.length === 0)) {
                            positions[key] = null;
                            continue;
                        }

                        if (Array.isArray(element)) {
                            // For bubbles, get the middle one
                            if (element.length > 0) {
                                const middleIndex = Math.floor(element.length / 2);
                                const rect = element[middleIndex].getBoundingClientRect();
                                positions[key] = {
                                    x: rect.left + (rect.width / 2),
                                    y: rect.top + (rect.height / 2),
                                    width: rect.width,
                                    height: rect.height,
                                    index: middleIndex,
                                    total: element.length
                                };
                            }
                        } else {
                            const rect = element.getBoundingClientRect();
                            positions[key] = {
                                x: rect.left + (rect.width / 2),
                                y: rect.top + (rect.height / 2),
                                width: rect.width,
                                height: rect.height
                            };
                        }
                    }

                    return {
                        success: true,
                        positions
                    };
                } catch (err) {
                    return { success: false, error: err.message };
                }
            });

            if (!uiElements.success) {
                return false;
            }

            const positions = uiElements.positions;
            let interactionCount = 0;

            // 1. Click on the header if available
            if (positions.header) {
                await this.client.pupPage.mouse.move(positions.header.x, positions.header.y);
                await this.client.pupPage.mouse.down();
                await new Promise(resolve => setTimeout(resolve, 100));
                await this.client.pupPage.mouse.up();

                interactionCount++;

                // Move mouse across header to trigger any hover effects
                await this.client.pupPage.mouse.move(
                    positions.header.x - (positions.header.width * 0.3),
                    positions.header.y
                );
                await new Promise(resolve => setTimeout(resolve, 100));
                await this.client.pupPage.mouse.move(
                    positions.header.x + (positions.header.width * 0.3),
                    positions.header.y
                );

                // Press Escape key to close any dialogs that might have opened after clicking the header
                await this.client.pupPage.keyboard.press('Escape');
            }

            // 2. Click on chat title if available
            if (positions.chatTitle) {
                await this.client.pupPage.mouse.move(positions.chatTitle.x, positions.chatTitle.y);
                await this.client.pupPage.mouse.down();
                await new Promise(resolve => setTimeout(resolve, 100));
                await this.client.pupPage.mouse.up();

                interactionCount++;
            }

            // 3. Click on a chat bubble if available
            if (positions.bubbles) {
                await this.client.pupPage.mouse.move(positions.bubbles.x, positions.bubbles.y);
                await this.client.pupPage.mouse.down();
                await new Promise(resolve => setTimeout(resolve, 100));
                await this.client.pupPage.mouse.up();

                interactionCount++;
            }

            // 4. Click on the chat area and scroll if available
            if (positions.chatArea) {
                // Click in the chat area
                await this.client.pupPage.mouse.move(positions.chatArea.x, positions.chatArea.y);
                await this.client.pupPage.mouse.down();
                await new Promise(resolve => setTimeout(resolve, 100));
                await this.client.pupPage.mouse.up();


                interactionCount++;


            }

            // 5. Click on the input box
            if (positions.inputBox) {
                // Click the input box
                await this.client.pupPage.mouse.move(positions.inputBox.x, positions.inputBox.y);
                await this.client.pupPage.mouse.down();
                await new Promise(resolve => setTimeout(resolve, 100));
                await this.client.pupPage.mouse.up();


                interactionCount++;
            }

            // 6. Click on the status element if available
            if (positions.statusElement) {
                await this.client.pupPage.mouse.move(positions.statusElement.x, positions.statusElement.y);
                await this.client.pupPage.mouse.down();
                await new Promise(resolve => setTimeout(resolve, 100));
                await this.client.pupPage.mouse.up();


                interactionCount++;
            }





            return interactionCount > 0;
        } catch (err) {
            console.error('Error performing UI interactions:', err);
            return false;
        }
    }

    /**
     * Focuses on the primary chat to keep presence subscription active
     * This is crucial for maintaining online status detection
     */
    async rotateFocusedChat() {
        if (this.jids.size === 0) return false;

        const now = Date.now();
        if (now < this.lastOpenTime + this.chatRotationInterval) return false;

        try {
            // Get all JIDs we're tracking
            const jidsArray = Array.from(this.jids);

            // If we have a primary JID that was previously set, use it
            // Otherwise use the first JID in the list
            const targetJid = this.primaryJid || jidsArray[0];

            this.lastOpenedChat = targetJid;
            this.lastOpenTime = now;



            // Open the chat and resubscribe to presence
            await this.openChat(targetJid);
            await this.client.subscribePresence(targetJid);

            // Force a presence query
            await this.client.queryPresence(targetJid).catch(() => {});

            return true;
        } catch (err) {
            console.error('Error focusing on primary chat:', err);
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
                                console.error(`Error with selector ${selector}:`, err);
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
                        console.error('Error checking header lastSeen:', e);
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
                        console.error('Error checking Contact model:', e);
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
                        console.error('Error checking Chat model:', e);
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
                        console.error('Error checking PresenceCollection:', e);
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
                this.stop();
                return;
            }

            // Send focus to keep connection alive (throttled internally)
            await this.softFocus();

            // Rotate focused chat to maintain active presence subscriptions
            // This is crucial for getting consistent online status updates
            await this.rotateFocusedChat();


            // Group JIDs by online status to optimize processing
            const jidsToProcess = Array.from(this.jids);
            const onlineJids = [];
            const offlineJidsWithLastSeen = [];
            const offlineJidsWithoutLastSeen = [];

            // First pass: categorize JIDs by current presence status
            for (const jid of jidsToProcess) {
                try {
                    // Force a presence query before getting status
                    await this.client.queryPresence(jid).catch(() => {
                    });

                    const currentPresence = await this.client.getPresence(jid).catch(() => null);
                    if (!currentPresence) {
                        continue;
                    }


                    if (currentPresence.isOnline) {
                        onlineJids.push(jid);
                    } else if (currentPresence.lastSeen) {
                        offlineJidsWithLastSeen.push(jid);
                    } else {
                        offlineJidsWithoutLastSeen.push(jid);
                    }
                } catch (err) {
                    console.log(`Could not get presence for ${jid}, skipping this cycle:`, err.message);
                }
            }

            // Process online JIDs (just emit events, no need to query)
            for (const jid of onlineJids) {
                try {
                    const normalizedJid = jid.endsWith('@c.us') ? jid : `${jid}@c.us`;

                    // Check if this is a transition from offline to online
                    const wasOnline = this.onlineStatus.get(normalizedJid);
                    const isStatusChange = wasOnline !== undefined && wasOnline !== true;

                    // For online users, always set lastSeen to null
                    const presence = {
                        jid: normalizedJid,
                        isOnline: true,
                        lastSeen: null,  // Explicitly set to null for online users
                        statusChanged: isStatusChange,
                        previousStatus: wasOnline
                    };

                    // Store current status
                    this.onlineStatus.set(normalizedJid, true);

                    this.client.emit('enhanced_presence', presence);
                    this.client.emit('presence_update', {
                        jid: normalizedJid,
                        isOnline: true,
                        lastSeen: null
                    });
                } catch (err) {
                    console.error(`Error processing online presence for ${jid}:`, err);
                }
            }

            // Process offline JIDs with lastSeen (query for updates but don't need UI extraction)
            for (const jid of offlineJidsWithLastSeen) {
                try {
                    const normalizedJid = jid.endsWith('@c.us') ? jid : `${jid}@c.us`;

                    // Check if this is a transition from online to offline
                    const wasOnline = this.onlineStatus.get(normalizedJid);
                    const isStatusChange = wasOnline === true; // Was online, now offline

                    // Query for fresh data
                    await this.client.queryPresence(jid).catch(() => {
                    });

                    // Get updated presence
                    const presence = await this.client.getPresence(jid).catch(() => null);
                    if (!presence) {
                        continue;
                    }

                    // If this is a status change (online -> offline), try to extract from UI
                    let uiLastSeen = null;
                    let uiSource = null;

                    if (isStatusChange) {

                        // Open the chat to see the header
                        await this.openChat(normalizedJid);

                        // Wait for UI to update
                        await new Promise(resolve => setTimeout(resolve, 1500));

                        // Extract from UI
                        const uiData = await this.extractLastSeenFromUI(normalizedJid);
                        if (uiData) {

                            // Process the UI data
                            if (uiData.timestamp) {
                                uiLastSeen = uiData.timestamp;
                                uiSource = uiData.source;
                            } else if (uiData.text) {
                                const parsedTimestamp = this.parseLastSeenText(uiData.text);
                                if (parsedTimestamp) {
                                    uiLastSeen = parsedTimestamp;
                                    uiSource = `${uiData.source}_parsed`;
                                }
                            }
                        }
                    }

                    // Store lastSeen if available from API
                    if (!presence.isOnline && presence.lastSeen) {
                        this.storeLastSeen(normalizedJid, presence.lastSeen);
                    }

                    // Store UI lastSeen if available and newer than API
                    if (uiLastSeen) {
                        // Only store UI lastSeen if it's newer than API lastSeen or if API lastSeen is not available
                        if (!presence.lastSeen || uiLastSeen > presence.lastSeen) {
                            this.storeLastSeen(normalizedJid, uiLastSeen);
                        }
                    }

                    // Enhance and emit events with both API and UI data
                    const enhanced = await this.enhancePresence(normalizedJid, presence, {
                        uiLastSeen,
                        uiSource
                    });

                    this.client.emit('enhanced_presence', enhanced);
                    this.client.emit('presence_update', {
                        jid: normalizedJid,
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
                    const normalizedJid = jid.endsWith('@c.us') ? jid : `${jid}@c.us`;

                    // Check if this is a transition from online to offline
                    const wasOnline = this.onlineStatus.get(normalizedJid);
                    const isStatusChange = wasOnline === true; // Was online, now offline


                    // Query for fresh data again
                    await this.client.queryPresence(jid).catch(() => {
                    });

                    // Get updated presence
                    let presence = await this.client.getPresence(jid).catch(() => null);
                    if (!presence) {
                        continue;
                    }

                    // Variables to store UI extraction results
                    let uiLastSeen = null;
                    let uiSource = null;

                    // Always try to extract from UI for offline contacts without lastSeen
                    // This is especially important for status changes
                    try {

                        // Open the chat to see the header
                        const chatOpened = await this.openChat(normalizedJid);

                        // If chat couldn't be opened, skip UI extraction
                        if (!chatOpened) {
                            // Skip UI extraction but continue with other processing
                            // We could potentially try an alternative method here in the future
                            return; // Early return to avoid nested conditionals
                        }

                        try {
                            // Wait longer for the UI to update, especially for status changes
                            const waitTime = isStatusChange ? 2000 : 1000;
                            await new Promise(resolve => setTimeout(resolve, waitTime));

                            // Extract data from UI
                            const uiData = await this.extractLastSeenFromUI(normalizedJid);
                            if (!uiData) {
                                return; // No UI data available, early return
                            }

                            // Process the UI data - direct timestamp
                            if (uiData.timestamp) {
                                uiLastSeen = uiData.timestamp;
                                uiSource = uiData.source;

                                // For status changes, immediately update the presence object
                                if (isStatusChange) {
                                    presence.lastSeen = uiData.timestamp;
                                    presence.lastSeenSource = uiData.source;
                                }
                                return; // Early return after successful processing
                            }

                            // Process the UI data - text that needs parsing
                            if (uiData.text) {
                                const parsedTimestamp = this.parseLastSeenText(uiData.text);
                                if (parsedTimestamp) {
                                    uiLastSeen = parsedTimestamp;
                                    uiSource = `${uiData.source}_parsed`;

                                    // For status changes, immediately update the presence object
                                    if (isStatusChange) {
                                        presence.lastSeen = parsedTimestamp;
                                        presence.lastSeenSource = `${uiData.source}_parsed`;
                                    }
                                }
                            }
                        } catch (extractionError) {
                            // Silent error handling since we removed console.log
                            // If debugging is needed, uncomment:
                            // console.error('Error during UI data extraction:', extractionError);
                        }
                    } catch (err) {
                        // Silent error handling since we removed console.log
                        // If debugging is needed, uncomment:
                        // console.error('Error extracting lastSeen from UI:', err);
                    }

                    // Store lastSeen if available from API
                    if (!presence.isOnline && presence.lastSeen) {
                        this.storeLastSeen(normalizedJid, presence.lastSeen);


                    }

                    // Store UI lastSeen if available and newer than API
                    if (uiLastSeen) {
                        // Only store UI lastSeen if it's newer than API lastSeen or if API lastSeen is not available
                        if (!presence.lastSeen || uiLastSeen > presence.lastSeen) {
                            this.storeLastSeen(normalizedJid, uiLastSeen);


                        }
                    }

                    // Update online status tracking
                    this.onlineStatus.set(normalizedJid, false);

                    // Enhance and emit both events with all data sources
                    const enhanced = await this.enhancePresence(normalizedJid, presence, {
                        uiLastSeen,
                        uiSource
                    });

                    this.client.emit('enhanced_presence', enhanced);
                    this.client.emit('presence_update', {
                        jid: normalizedJid,
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

    async enhancePresence(jid, presence, options = {}) {
        const normalizedJid = jid.endsWith('@c.us') ? jid : `${jid}@c.us`;

        // Get current status tracking
        const wasOnline = this.onlineStatus.get(normalizedJid);
        const isStatusChange = wasOnline !== undefined && wasOnline !== presence.isOnline;

        // Store current online status
        this.onlineStatus.set(normalizedJid, presence.isOnline);

        // If user is online, set lastSeen to null
        if (presence.isOnline) {


            return {
                jid: normalizedJid,
                ...presence,
                lastSeen: null,
                statusChanged: isStatusChange,
                previousStatus: wasOnline
            };
        }

        // Get all available lastSeen sources for comparison
        const sources = {
            api: presence.lastSeen || null,
            apiSource: presence.lastSeenSource || null,
            ui: options.uiLastSeen || null,
            uiSource: options.uiSource || null,
            historical: null,
            historicalTimestamp: null
        };

        // Get historical data
        const history = this.history.get(normalizedJid) || [];
        if (history.length > 0) {
            sources.historical = history[history.length - 1];
            sources.historicalTimestamp = new Date(sources.historical * 1000).toLocaleString();
        }

        // Store all sources for debugging
        this.lastSeenSources.set(normalizedJid, sources);

        // If we already have lastSeen from API, use it
        if (presence.lastSeen) {


            return {
                jid: normalizedJid,
                ...presence,
                statusChanged: isStatusChange,
                previousStatus: wasOnline,
                lastSeenSources: sources
            };
        }

        // If we have UI lastSeen and this is a status change (online -> offline), use it
        if (options.uiLastSeen && isStatusChange && wasOnline === true) {


            return {
                jid: normalizedJid,
                ...presence,
                lastSeen: options.uiLastSeen,
                lastSeenSource: options.uiSource || 'ui_extraction',
                statusChanged: isStatusChange,
                previousStatus: wasOnline,
                lastSeenSources: sources
            };
        }

        // If this is a status change, try to extract from UI one more time
        if (isStatusChange && wasOnline === true) {


            // Force UI extraction one more time
            try {
                // Open the chat to see the header
                await this.openChat(normalizedJid);

                // Wait longer for UI to update after status change
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Extract from UI
                const uiData = await this.extractLastSeenFromUI(normalizedJid);
                if (uiData) {


                    // Process the UI data
                    if (uiData.timestamp) {
                        sources.ui = uiData.timestamp;
                        sources.uiSource = uiData.source;

                        // Use this as the lastSeen
                        return {
                            jid: normalizedJid,
                            ...presence,
                            lastSeen: uiData.timestamp,
                            statusChanged: isStatusChange,
                            previousStatus: wasOnline,
                            lastSeenSources: sources
                        };
                    } else if (uiData.text) {
                        const parsedTimestamp = this.parseLastSeenText(uiData.text);
                        if (parsedTimestamp) {
                            sources.ui = parsedTimestamp;
                            sources.uiSource = `${uiData.source}_parsed`;

                            // Use this as the lastSeen
                            return {
                                jid: normalizedJid,
                                ...presence,
                                lastSeen: parsedTimestamp,
                                statusChanged: isStatusChange,
                                previousStatus: wasOnline,
                                lastSeenSources: sources
                            };
                        }
                    }
                }
            } catch (err) {
                console.error(`Error extracting lastSeen after status change for ${normalizedJid}:`, err);
            }

            // If we still don't have lastSeen, return without it


            return {
                jid: normalizedJid,
                ...presence,
                statusChanged: isStatusChange,
                previousStatus: wasOnline,
                lastSeenSources: sources
            };
        }

        // If we have historical data and no status change, use it
        if (history.length > 0) {


            return {
                jid: normalizedJid,
                ...presence,
                lastSeen: history[history.length - 1],
                historical: true,
                statusChanged: isStatusChange,
                previousStatus: wasOnline,
                lastSeenSources: sources
            };
        }

        // No lastSeen available from any source


        return {
            jid: normalizedJid,
            ...presence,
            statusChanged: isStatusChange,
            previousStatus: wasOnline,
            lastSeenSources: sources
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
        // Prepare lastSeen sources data for display
        const lastSeenSourcesData = {};
        for (const [jid, sources] of this.lastSeenSources.entries()) {
            lastSeenSourcesData[jid] = {
                api: sources.api ? new Date(sources.api * 1000).toLocaleString() : null,
                apiSource: sources.apiSource,
                ui: sources.ui ? new Date(sources.ui * 1000).toLocaleString() : null,
                uiSource: sources.uiSource,
                historical: sources.historical ? new Date(sources.historical * 1000).toLocaleString() : null
            };
        }

        // Prepare online status data
        const onlineStatusData = {};
        for (const [jid, isOnline] of this.onlineStatus.entries()) {
            onlineStatusData[jid] = isOnline;
        }

        // Prepare history data
        const historyData = {};
        for (const [jid, timestamps] of this.history.entries()) {
            if (timestamps.length > 0) {
                const lastTimestamp = timestamps[timestamps.length - 1];
                historyData[jid] = {
                    count: timestamps.length,
                    latest: new Date(lastTimestamp * 1000).toLocaleString(),
                    latestTimestamp: lastTimestamp
                };
            }
        }

        return {
            isRunning: !!this.timer,
            clickTimerActive: !!this.clickTimer,
            trackedContacts: Array.from(this.jids),
            contactCount: this.jids.size,
            historySize: this.history.size,
            primaryJid: this.primaryJid,
            lastFocusTime: this.lastFocusTime ? new Date(this.lastFocusTime).toLocaleString() : 'Never',
            lastClickTime: this.lastClickTime ? new Date(this.lastClickTime).toLocaleString() : 'Never',
            lastOpenedChat: this.lastOpenedChat,
            lastOpenTime: this.lastOpenTime ? new Date(this.lastOpenTime).toLocaleString() : 'Never',
            pollInterval: this.pollInterval,
            focusInterval: this.focusInterval,
            clickInterval: this.clickInterval,
            chatRotationInterval: this.chatRotationInterval,
            debugMode: this.debugMode,
            onlineStatus: onlineStatusData,
            lastSeenSources: lastSeenSourcesData,
            history: historyData
        };
    }
}

module.exports = PresenceManager;