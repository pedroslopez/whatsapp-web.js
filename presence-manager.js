// presence-manager.js
class PresenceManager {
    constructor(client) {
        this.client = client;
        this.jids = new Set();
        this.history = new Map();
        this.lastUpdateTimes = new Map(); // Track when each JID was last updated
        this.connectionHealth = new Map(); // Track connection health for each JID
        this.timer = null;
        this.healthCheckTimer = null;
        this.lastFocusTime = 0;
        this.focusInterval = 60000; // 1 minute between focus calls
        this.pollInterval = 15000;  // 15 seconds between polls
        this.healthCheckInterval = 60000; // 1 minute between health checks
        this.maxUpdateAge = 120000; // 2 minutes before forcing refresh
        this.subscriptionRenewalInterval = 300000; // 5 minutes before renewing subscription
        this.lastSubscriptionTimes = new Map(); // Track when each JID was last subscribed

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

        // Listen for native presence updates to also store in history and update timestamps
        client.on('presence_update', update => {
            // Record the update time
            this.lastUpdateTimes.set(update.jid, Date.now());

            // Reset connection health counter
            this.connectionHealth.set(update.jid, {
                failedAttempts: 0,
                lastSuccess: Date.now()
            });

            // Store last seen if available
            if (!update.isOnline && update.lastSeen) {
                this.storeLastSeen(update.jid, update.lastSeen);
            }
        });

        // Start health check timer
        this.startHealthCheck();
    }

    async add(jid, options = {}) {
        // Normalize JID format
        const normalizedJid = jid.endsWith('@c.us') ? jid : `${jid}@c.us`;
        this.jids.add(normalizedJid);

        // Initialize tracking data
        this.lastUpdateTimes.set(normalizedJid, Date.now());
        this.lastSubscriptionTimes.set(normalizedJid, Date.now());
        this.connectionHealth.set(normalizedJid, {
            failedAttempts: 0,
            lastSuccess: Date.now()
        });

        try {
            // Initial subscription
            await this.client.subscribePresence(normalizedJid);

            // Get initial presence
            const presence = await this.client.getPresence(normalizedJid);
            if (presence) {
                // Update last update time
                this.lastUpdateTimes.set(normalizedJid, Date.now());

                // Store last seen if available
                if (!presence.isOnline && presence.lastSeen) {
                    this.storeLastSeen(normalizedJid, presence.lastSeen);
                }
            }
        } catch (err) {
            // Silent catch
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

        // Make sure health check is running
        this.startHealthCheck();

        return this;
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.stopHealthCheck();

        return this;
    }

    isRunning() {
        return !!this.timer;
    }

    startHealthCheck() {
        if (this.healthCheckTimer) return; // Already running

        this.healthCheckTimer = setInterval(() => this.runHealthCheck(), this.healthCheckInterval);
        return this;
    }

    stopHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
        return this;
    }

    async runHealthCheck() {
        try {
            // Check if client is still connected
            if (!this.client.pupPage || this.client.pupPage.isClosed()) {
                this.stop();
                return;
            }

            const now = Date.now();

            // Process a subset of JIDs each health check cycle to distribute load
            const jidsToCheck = Array.from(this.jids);
            const batchSize = Math.min(5, jidsToCheck.length); // Check up to 5 JIDs per cycle

            // Randomly select JIDs to check
            const selectedJids = this.getRandomSubset(jidsToCheck, batchSize);

            for (const jid of selectedJids) {
                try {
                    // Check if updates are stale
                    const lastUpdateTime = this.lastUpdateTimes.get(jid) || 0;
                    const lastSubscriptionTime = this.lastSubscriptionTimes.get(jid) || 0;
                    const updateAge = now - lastUpdateTime;
                    const subscriptionAge = now - lastSubscriptionTime;

                    // If subscription is old, renew it
                    if (subscriptionAge > this.subscriptionRenewalInterval) {
                        await this.renewSubscription(jid);
                    }

                    // If updates are stale, force a refresh
                    if (updateAge > this.maxUpdateAge) {
                        await this.forcePresenceRefresh(jid);
                    }
                } catch (err) {
                    // Silent catch for individual JID errors
                }
            }
        } catch (err) {
            // If we get a fatal error, stop the health check
            if (err.message && (
                err.message.includes('Session closed') ||
                err.message.includes('Target closed') ||
                err.message.includes('has been closed')
            )) {
                this.stopHealthCheck();
            }
        }
    }

    getRandomSubset(array, size) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, size);
    }

    async renewSubscription(jid) {
        try {
            // Re-subscribe to presence updates
            await this.client.subscribePresence(jid);

            // Update subscription time
            this.lastSubscriptionTimes.set(jid, Date.now());

            return true;
        } catch (err) {
            return false;
        }
    }

    async forcePresenceRefresh(jid) {
        try {
            // Try multiple strategies to refresh presence

            // 1. Re-subscribe
            await this.renewSubscription(jid);

            // 2. Force a direct query
            await this.client.queryPresence(jid).catch(() => {});

            // 3. Try to open the chat briefly (this often triggers presence updates)
            await this.openAndCloseChat(jid);

            // Get fresh presence data
            const presence = await this.client.getPresence(jid);
            if (presence) {
                // Update last update time
                this.lastUpdateTimes.set(jid, Date.now());

                // Reset connection health
                this.connectionHealth.set(jid, {
                    failedAttempts: 0,
                    lastSuccess: Date.now()
                });

                // Emit the updated presence
                this.client.emit('presence_update', {
                    jid,
                    isOnline: presence.isOnline,
                    lastSeen: presence.lastSeen
                });

                return true;
            }

            return false;
        } catch (err) {
            // Track failed attempts
            const health = this.connectionHealth.get(jid) || { failedAttempts: 0, lastSuccess: 0 };
            health.failedAttempts++;
            this.connectionHealth.set(jid, health);

            return false;
        }
    }

    async openAndCloseChat(jid) {
        try {
            // Open chat to trigger presence updates
            await this.client.pupPage.evaluate(jid => {
                try {
                    const wid = window.Store.WidFactory.createWid(jid);
                    const chat = window.Store.Chat.get(wid);
                    if (chat) {
                        window.Store.Cmd.openChatAt(chat);
                        return true;
                    }
                    return false;
                } catch (e) {
                    return false;
                }
            }, jid);

            // Wait a moment for presence to update
            await new Promise(resolve => setTimeout(resolve, 1000));

            return true;
        } catch (err) {
            return false;
        }
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
            return false;
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

            const now = Date.now();

            // Process each JID
            for (const jid of this.jids) {
                try {
                    // Check if we need to renew subscription
                    const lastSubscriptionTime = this.lastSubscriptionTimes.get(jid) || 0;
                    const subscriptionAge = now - lastSubscriptionTime;

                    // Renew subscription if it's old
                    if (subscriptionAge > this.subscriptionRenewalInterval) {
                        await this.renewSubscription(jid);
                    }

                    // Query for fresh data
                    await this.client.queryPresence(jid).catch(() => {});

                    // Get updated presence
                    const presence = await this.client.getPresence(jid).catch(() => null);
                    if (!presence) {
                        // Track failed attempts
                        const health = this.connectionHealth.get(jid) || { failedAttempts: 0, lastSuccess: 0 };
                        health.failedAttempts++;
                        this.connectionHealth.set(jid, health);

                        // If we've failed multiple times, try to force a refresh
                        if (health.failedAttempts >= 3) {
                            await this.forcePresenceRefresh(jid);
                        }

                        continue;
                    }

                    // Update last update time
                    this.lastUpdateTimes.set(jid, now);

                    // Reset connection health
                    this.connectionHealth.set(jid, {
                        failedAttempts: 0,
                        lastSuccess: now
                    });

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
                    // Silent catch for individual JID errors
                }
            }
        } catch (err) {
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
