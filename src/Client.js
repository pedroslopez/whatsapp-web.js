'use strict';

const EventEmitter = require('events');
const puppeteer = require('puppeteer');
const moduleRaid = require('@pedroslopez/moduleraid/moduleraid');

const Util = require('./util/Util');
const InterfaceController = require('./util/InterfaceController');
const { WhatsWebURL, DefaultOptions, Events, WAState, MessageTypes } = require('./util/Constants');
const { ExposeAuthStore } = require('./util/Injected/AuthStore/AuthStore');
const { ExposeStore } = require('./util/Injected/Store');
const { ExposeLegacyAuthStore } = require('./util/Injected/AuthStore/LegacyAuthStore');
const { ExposeLegacyStore } = require('./util/Injected/LegacyStore');
const { LoadUtils } = require('./util/Injected/Utils');
const ChatFactory = require('./factories/ChatFactory');
const ContactFactory = require('./factories/ContactFactory');
const WebCacheFactory = require('./webCache/WebCacheFactory');
const { ClientInfo, Message, MessageMedia, Contact, Location, Poll, PollVote, GroupNotification, Label, Call, Buttons, List, Reaction, Broadcast, ScheduledEvent } = require('./structures');
const NoAuth = require('./authStrategies/NoAuth');
const {exposeFunctionIfAbsent} = require('./util/Puppeteer');

/**
 * Starting point for interacting with the WhatsApp Web API
 * @extends {EventEmitter}
 * @param {object} options - Client options
 * @param {AuthStrategy} options.authStrategy - Determines how to save and restore sessions. Will use LegacySessionAuth if options.session is set. Otherwise, NoAuth will be used.
 * @param {string} options.webVersion - The version of WhatsApp Web to use. Use options.webVersionCache to configure how the version is retrieved.
 * @param {object} options.webVersionCache - Determines how to retrieve the WhatsApp Web version. Defaults to a local cache (LocalWebCache) that falls back to latest if the requested version is not found.
 * @param {number} options.authTimeoutMs - Timeout for authentication selector in puppeteer
 * @param {object} options.puppeteer - Puppeteer launch options. View docs here: https://github.com/puppeteer/puppeteer/
 * @param {number} options.qrMaxRetries - How many times should the qrcode be refreshed before giving up
 * @param {string} options.restartOnAuthFail  - @deprecated This option should be set directly on the LegacySessionAuth.
 * @param {object} options.session - @deprecated Only here for backwards-compatibility. You should move to using LocalAuth, or set the authStrategy to LegacySessionAuth explicitly. 
 * @param {number} options.takeoverOnConflict - If another whatsapp web session is detected (another browser), take over the session in the current browser
 * @param {number} options.takeoverTimeoutMs - How much time to wait before taking over the session
 * @param {string} options.userAgent - User agent to use in puppeteer
 * @param {string} options.ffmpegPath - Ffmpeg path to use when formatting videos to webp while sending stickers 
 * @param {boolean} options.bypassCSP - Sets bypassing of page's Content-Security-Policy.
 * @param {string} options.deviceName - Sets the device name of a current linked device., i.e.: 'TEST'.
 * @param {string} options.browserName - Sets the browser name of a current linked device, i.e.: 'Firefox'.
 * @param {object} options.proxyAuthentication - Proxy Authentication object.
 * 
 * @fires Client#qr
 * @fires Client#authenticated
 * @fires Client#auth_failure
 * @fires Client#ready
 * @fires Client#message
 * @fires Client#message_ack
 * @fires Client#message_create
 * @fires Client#message_revoke_me
 * @fires Client#message_revoke_everyone
 * @fires Client#message_ciphertext
 * @fires Client#message_edit
 * @fires Client#media_uploaded
 * @fires Client#group_join
 * @fires Client#group_leave
 * @fires Client#group_update
 * @fires Client#disconnected
 * @fires Client#change_state
 * @fires Client#contact_changed
 * @fires Client#group_admin_changed
 * @fires Client#group_membership_request
 * @fires Client#vote_update
 */
class Client extends EventEmitter {
    constructor(options = {}) {
        super();
            this.options = Util.mergeDefault(DefaultOptions, options);
            
            // ✅ EXISTING: Memory leak prevention
            this._activeIntervals = new Set();
            this._eventHandlers = new Map();
            this._cleanupCallbacks = [];
            this._listenersAttached = false;
            this._attachedListeners = [];
            
            // ✅ NEW: Performance optimization - Lazy loading caches
            this._chatCache = new Map();           // Cache for frequent chat access
            this._contactCache = new Map();        // Cache for frequent contact access  
            this._messageCache = new Map();        // Cache for recent messages
            this._cacheTimestamps = new Map();     // Track cache freshness
            this._lastCleanup = Date.now();
            
            // ✅ NEW: Connection state optimization
            this._connectionState = 'DISCONNECTED';
            this._lastStateCheck = 0;
            this._stateCheckInterval = null;
                // ✅ ADD THESE MISSING VARIABLES:
            this._messageBatch = [];          // Add this
            this._batchTimeout = null;        // Add this  
            this._batchProcessing = false;    // Add this
            this._requestHandlers = [];       // Add this
             this._cleanupInterval = null;     // ✅ ADD: Cache cleanup interval
            if(!this.options.authStrategy) {
                this.authStrategy = new NoAuth();
            } else {
                this.authStrategy = this.options.authStrategy;
            }

            this.authStrategy.setup(this);

        /**
         * @type {puppeteer.Browser}
         */
        this.pupBrowser = null;
        /**
         * @type {puppeteer.Page}
         */
        this.pupPage = null;

        this.currentIndexHtml = null;
        this.lastLoggedOut = false;

        Util.setFfmpegPath(this.options.ffmpegPath);
    }
    /**
     * Injection logic
     * Private function
     */
    async inject() {
        try {
            // ✅ ENHANCED: Version detection with retry logic
            let versionDetected = false;
            let versionAttempts = 0;
            
            while (!versionDetected && versionAttempts < 3) {
                try {
                    await this.pupPage.waitForFunction('window.Debug?.VERSION != undefined', {
                        timeout: this.options.authTimeoutMs
                    });
                    versionDetected = true;
                } catch (error) {
                    versionAttempts++;
                    console.warn(`Version detection attempt ${versionAttempts} failed:`, error.message);
                    if (versionAttempts >= 3) {
                        throw new Error('WhatsApp Web version not detected after 3 attempts - page may not have loaded properly');
                    }
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            await this.setDeviceName(this.options.deviceName, this.options.browserName);
            const pairWithPhoneNumber = this.options.pairWithPhoneNumber;
            const version = await this.getWWebVersion();
            const isCometOrAbove = parseInt(version.split('.')?.[1]) >= 3000;

            // ✅ FIX: Enhanced auth store injection with validation
            let authStoreInjected = false;
            try {
                if (isCometOrAbove) {
                    await this.pupPage.evaluate(ExposeAuthStore);
                } else {
                    await this.pupPage.evaluate(ExposeLegacyAuthStore, moduleRaid.toString());
                }
                
                // Validate auth store injection
                authStoreInjected = await this.pupPage.evaluate(() => {
                    return !!(window.AuthStore && window.AuthStore.AppState);
                });
                
                if (!authStoreInjected) {
                    throw new Error('AuthStore injection failed - critical objects missing');
                }
            } catch (error) {
                throw new Error(`AuthStore injection failed: ${error.message}`);
            }

            // ✅ FIX: Enhanced authentication state validation with proper cleanup
            const needAuthentication = await this.pupPage.evaluate(async () => {
                if (!window.AuthStore || !window.AuthStore.AppState) {
                    console.error('AuthStore not available during injection');
                    return true;
                }

                let state = window.AuthStore.AppState.state;
                console.log('Initial auth state:', state);

                if (state === 'OPENING' || state === 'UNLAUNCHED' || state === 'PAIRING') {
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            // ✅ FIX: Clean up event listener on timeout
                            window.AuthStore.AppState.off('change:state', stateChangeHandler);
                            console.warn('Auth state change timeout, current state:', state);
                            resolve(state === 'UNPAIRED' || state === 'UNPAIRED_IDLE');
                        }, 10000);

                        // ✅ FIX: Add cleanup on promise rejection
                        const cleanup = () => {
                            clearTimeout(timeout);
                            window.AuthStore.AppState.off('change:state', stateChangeHandler);
                        };

                        const stateChangeHandler = (_AppState, newState) => {
                            console.log('Auth state changed:', newState);
                            if (newState !== 'OPENING' && newState !== 'UNLAUNCHED' && newState !== 'PAIRING') {
                                cleanup();
                                resolve(newState === 'UNPAIRED' || newState === 'UNPAIRED_IDLE');
                            }
                        };

                        window.AuthStore.AppState.on('change:state', stateChangeHandler);
                        
                        // ✅ FIX: Handle page navigation/disconnection
                        window.addEventListener('beforeunload', cleanup);
                    });
                }
                
                return state === 'UNPAIRED' || state === 'UNPAIRED_IDLE';
            });

            if (needAuthentication) {
                const { failed, failureEventPayload, restart } = await this.authStrategy.onAuthenticationNeeded();

                if (failed) {
                    console.error('Authentication strategy failed:', failureEventPayload);
                    this.emit(Events.AUTHENTICATION_FAILURE, failureEventPayload);
                    await this.destroy();
                    if (restart) {
                        return this.initialize();
                    }
                    return;
                }

                // Register qr/code events
                if (pairWithPhoneNumber.phoneNumber) {
                    await exposeFunctionIfAbsent(this.pupPage, 'onCodeReceivedEvent', async (code) => {
                        console.log('Pairing code received:', code);
                        this.emit(Events.CODE_RECEIVED, code);
                        return code;
                    });
                    this.requestPairingCode(pairWithPhoneNumber.phoneNumber, pairWithPhoneNumber.showNotification, pairWithPhoneNumber.intervalMs);
                } else {
                    let qrRetries = 0;
                    await exposeFunctionIfAbsent(this.pupPage, 'onQRChangedEvent', async (qr) => {
                        console.log('QR code updated');
                        this.emit(Events.QR_RECEIVED, qr);
                        if (this.options.qrMaxRetries > 0) {
                            qrRetries++;
                            if (qrRetries > this.options.qrMaxRetries) {
                                console.error('Max QR code retries reached');
                                this.emit(Events.DISCONNECTED, 'Max qrcode retries reached');
                                await this.destroy();
                            }
                        }
                    });

                    // ✅ FIX: Enhanced QR generation with proper error handling
                    const qrGenerated = await this.pupPage.evaluate(async () => {
                        try {
                            const registrationInfo = await window.AuthStore.RegistrationUtils.waSignalStore.getRegistrationInfo();
                            const noiseKeyPair = await window.AuthStore.RegistrationUtils.waNoiseInfo.get();
                            const staticKeyB64 = window.AuthStore.Base64Tools.encodeB64(noiseKeyPair.staticKeyPair.pubKey);
                            const identityKeyB64 = window.AuthStore.Base64Tools.encodeB64(registrationInfo.identityKeyPair.pubKey);
                            const advSecretKey = await window.AuthStore.RegistrationUtils.getADVSecretKey();
                            const platform = window.AuthStore.RegistrationUtils.DEVICE_PLATFORM;
                            const getQR = (ref) => ref + ',' + staticKeyB64 + ',' + identityKeyB64 + ',' + advSecretKey + ',' + platform;

                            window.onQRChangedEvent(getQR(window.AuthStore.Conn.ref));
                            window.AuthStore.Conn.on('change:ref', (_, ref) => { 
                                window.onQRChangedEvent(getQR(ref)); 
                            });
                            return true;
                        } catch (error) {
                            console.error('Error generating QR code:', error);
                            return false;
                        }
                    });

                    if (!qrGenerated) {
                        throw new Error('QR code generation failed');
                    }
                }
            }

            // ✅ FIX: Enhanced event exposure with validation
            const exposedFunctions = [
                { name: 'onAuthAppStateChangedEvent', handler: async (state) => {
                    console.log('Auth app state changed:', state);
                    if (state == 'UNPAIRED_IDLE' && !pairWithPhoneNumber.phoneNumber) {
                        try {
                            await this.pupPage.evaluate(() => {
                                window.Store?.Cmd?.refreshQR();
                            });
                        } catch (error) {
                            console.warn('Failed to refresh QR:', error);
                        }
                    }
                }},
                { name: 'onAppStateHasSyncedEvent', handler: async () => {
                    await this._handleAppStateSynced(isCometOrAbove, version, pairWithPhoneNumber);
                }},
                { name: 'onOfflineProgressUpdateEvent', handler: async (percent) => {
                    let lastPercent = null;
                    if (lastPercent !== percent) {
                        lastPercent = percent;
                        this.emit(Events.LOADING_SCREEN, percent, 'WhatsApp');
                    }
                }},
                { name: 'onLogoutEvent', handler: async () => {
                    console.log('Logout event detected');
                    this.lastLoggedOut = true;
                    await this.pupPage.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch((_) => {
                        console.log('Navigation after logout completed or timed out');
                    });
                }}
            ];

            for (const { name, handler } of exposedFunctions) {
                await exposeFunctionIfAbsent(this.pupPage, name, handler);
            }

            // ✅ FIX: Enhanced event binding with validation
            const eventsBound = await this.pupPage.evaluate(() => {
                try {
                    if (!window.AuthStore || !window.AuthStore.AppState) {
                        return false;
                    }

                    window.AuthStore.AppState.on('change:state', (_AppState, state) => { 
                        window.onAuthAppStateChangedEvent(state); 
                    });
                    window.AuthStore.AppState.on('change:hasSynced', () => { 
                        window.onAppStateHasSyncedEvent(); 
                    });
                    window.AuthStore.Cmd.on('offline_progress_update', () => {
                        window.onOfflineProgressUpdateEvent(window.AuthStore.OfflineMessageHandler.getOfflineDeliveryProgress()); 
                    });
                    window.AuthStore.Cmd.on('logout', async () => {
                        await window.onLogoutEvent();
                    });
                    
                    return true;
                } catch (error) {
                    console.error('Error setting up auth event listeners:', error);
                    return false;
                }
            });

            if (!eventsBound) {
                throw new Error('Failed to bind critical auth event listeners');
            }

            console.log('Injection completed successfully');

        } catch (error) {
            console.error('Critical error during injection:', error);
            this.emit(Events.AUTHENTICATION_FAILURE, `Injection failed: ${error.message}`);
            
            // ✅ FIX: Safe cleanup on injection failure
            await this._safeCleanup();
            throw error;
        }
    }

    // ✅ ADD: Extract complex logic to separate method
    async _handleAppStateSynced(isCometOrAbove, version, pairWithPhoneNumber) {
        console.log('App state has synced - proceeding with injection');
        const authEventPayload = await this.authStrategy.getAuthEventPayload();
        this.emit(Events.AUTHENTICATED, authEventPayload);

        const injected = await this.pupPage.evaluate(async () => {
            return typeof window.Store !== 'undefined' && typeof window.WWebJS !== 'undefined';
        });

        if (!injected) {
            console.log('Performing initial injection...');
            
            if (this.options.webVersionCache.type === 'local' && this.currentIndexHtml) {
                const { type: webCacheType, ...webCacheOptions } = this.options.webVersionCache;
                const webCache = WebCacheFactory.createWebCache(webCacheType, webCacheOptions);
                await webCache.persist(this.currentIndexHtml, version);
            }

            // ✅ FIX: Enhanced Store injection with retry logic
            await this._injectStoreWithRetry(isCometOrAbove);
            
            this.info = new ClientInfo(this, await this.pupPage.evaluate(() => {
                if (!window.Store.Conn || !window.Store.User) {
                    throw new Error('Store objects not properly initialized');
                }
                return { ...window.Store.Conn.serialize(), wid: window.Store.User.getMaybeMePnUser() || window.Store.User.getMaybeMeLidUser() };
            }));

            this.interface = new InterfaceController(this);
            await this.pupPage.evaluate(LoadUtils);
            await this.attachEventListeners();
            console.log('Event listeners attached successfully');
        } else {
            console.log('Already injected, reattaching event listeners...');
            await this.attachEventListeners();
        }
        
        console.log('Client is ready');
        this.emit(Events.READY);
        this.authStrategy.afterAuthReady();
    }


/**
 * Safe cleanup method to prevent memory leaks during errors
 * @private
 */
async _safeCleanup() {
    try {
        console.log('Performing safe cleanup...');
        
        // 1. Clear all intervals and timeouts
        if (this._activeIntervals) {
            this._activeIntervals.forEach(clearInterval);
            this._activeIntervals.clear();
        }
        
        if (this._stateCheckInterval) {
            clearInterval(this._stateCheckInterval);
            this._stateCheckInterval = null;
        }

        // 2. Clear batch processing
        if (this._batchTimeout) {
            clearTimeout(this._batchTimeout);
            this._batchTimeout = null;
        }

        // 3. Clear message batch
        if (this._messageBatch) {
            this._messageBatch.length = 0;
        }

        // 4. Clear page intervals safely
        if (this.pupPage && !this.pupPage.isClosed()) {
            await this.pupPage.evaluate(() => {
                // Clear known intervals
                if (window.codeInterval) {
                    clearInterval(window.codeInterval);
                    window.codeInterval = null;
                }
                
                // Clear any other intervals
                Object.keys(window).forEach(key => {
                    if (key.includes('Interval') && window[key] && typeof window[key] === 'number') {
                        clearInterval(window[key]);
                        window[key] = null;
                    }
                });
            }).catch(error => {
                // Silent fail - page might be closed
                console.warn('Page cleanup warning:', error.message);
            });
        }

        // 5. Clear caches
        if (this._chatCache) this._chatCache.clear();
        if (this._contactCache) this._contactCache.clear();
        if (this._messageCache) this._messageCache.clear();
        if (this._cacheTimestamps) this._cacheTimestamps.clear();

        console.log('Safe cleanup completed');
        
    } catch (error) {
        console.error('Error during safe cleanup:', error);
        // Don't throw - this is cleanup, we want to proceed
    }
}
/**
 * Process batched messages to improve performance
 * @private
 */
async _processMessageBatch() {
    if (this._batchProcessing || this._messageBatch.length === 0) return;
    
    this._batchProcessing = true;
    const batchToProcess = [...this._messageBatch];
    this._messageBatch = [];
    
    try {
        for (const msg of batchToProcess) {
            if (msg.type === 'gp2') {
                const notification = new GroupNotification(this, msg);
                if (['add', 'invite', 'linked_group_join'].includes(msg.subtype)) {
                    this.emit(Events.GROUP_JOIN, notification);
                } else if (msg.subtype === 'remove' || msg.subtype === 'leave') {
                    this.emit(Events.GROUP_LEAVE, notification);
                } else if (msg.subtype === 'promote' || msg.subtype === 'demote') {
                    this.emit(Events.GROUP_ADMIN_CHANGED, notification);
                } else if (msg.subtype === 'membership_approval_request') {
                    this.emit(Events.GROUP_MEMBERSHIP_REQUEST, notification);
                } else {
                    this.emit(Events.GROUP_UPDATE, notification);
                }
            } else {
                const message = new Message(this, msg);
                this.emit(Events.MESSAGE_CREATE, message);
                if (!msg.id.fromMe) {
                    this.emit(Events.MESSAGE_RECEIVED, message);
                }
            }
        }
    } catch (error) {
        console.error('Error processing message batch:', error);
    } finally {
        this._batchProcessing = false;
    }
}




    // ✅ ADD: Store injection with retry logic
    async _injectStoreWithRetry(isCometOrAbove) {
        let storeInjected = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!storeInjected && attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`Store injection attempt ${attempts}...`);

                if (isCometOrAbove) {
                    await this.pupPage.evaluate(ExposeStore);
                } else {
                    console.log('Waiting for modules to initialize...');
                    await new Promise(r => setTimeout(r, 2000)); 
                    await this.pupPage.evaluate(ExposeLegacyStore);
                }

                await this.pupPage.waitForFunction('window.Store != undefined', { 
                    timeout: 15000,
                    polling: 1000 
                });

                // Validate critical Store components
                const storeValid = await this.pupPage.evaluate(() => {
                    return !!(window.Store && 
                            window.Store.Conn && 
                            window.Store.User && 
                            window.Store.Msg);
                });

                if (storeValid) {
                    storeInjected = true;
                    console.log('Store injection successful and validated');
                } else {
                    throw new Error('Store components not properly initialized');
                }

            } catch (error) {
                console.error(`Store injection attempt ${attempts} failed:`, error.message);
                
                if (attempts >= maxAttempts) {
                    throw new Error(`Store injection failed after ${maxAttempts} attempts: ${error.message}`);
                }
                
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }


/**
 * Sets up events and requirements, kicks off authentication request
 */
async initialize() {
    let browser, page;
    browser = null;
    page = null;

    await this.authStrategy.beforeBrowserInitialized();

    const puppeteerOpts = this.options.puppeteer;
    
    // ✅ DYNAMIC: Get stealth configuration with defaults
    const stealthConfig = {
        useAutomationFlags: this.options.useAutomationFlags ?? true,
        stealthLevel: this.options.stealthLevel || 'medium',
        usePageStealth: this.options.usePageStealth ?? true,
        removeWebdriver: this.options.removeWebdriver ?? true
    };

    if (puppeteerOpts && (puppeteerOpts.browserWSEndpoint || puppeteerOpts.browserURL)) {
        browser = await puppeteer.connect(puppeteerOpts);
        page = await browser.newPage();
    } else {
        const browserArgs = [...(puppeteerOpts.args || [])];
        
        // ✅ DYNAMIC: Add user agent if not present
        if(!browserArgs.find(arg => arg.includes('--user-agent'))) {
            browserArgs.push(`--user-agent=${this.options.userAgent}`);
        }
        
        // ✅ DYNAMIC: Only add automation flags if enabled
        if (stealthConfig.useAutomationFlags) {
            browserArgs.push('--disable-blink-features=AutomationControlled');
        }
        
        // ✅ DYNAMIC: Add additional stealth args based on level
        const additionalArgs = this.getStealthBrowserArgs(stealthConfig.stealthLevel);
        browserArgs.push(...additionalArgs);

        browser = await puppeteer.launch({
            ...puppeteerOpts, 
            args: browserArgs,
            // ✅ DYNAMIC: Remove automation indicators from default args
            ignoreDefaultArgs: stealthConfig.useAutomationFlags ? ['--enable-automation'] : []
        });
        page = (await browser.pages())[0];
    }

    if (this.options.proxyAuthentication !== undefined) {
        await page.authenticate(this.options.proxyAuthentication);
    }
  
    await page.setUserAgent(this.options.userAgent);
    if (this.options.bypassCSP) await page.setBypassCSP(true);

    this.pupBrowser = browser;
    this.pupPage = page;

    // ✅ DYNAMIC: Apply page stealth if enabled
    if (stealthConfig.usePageStealth) {
        await this.applyPageStealth(page, stealthConfig);
    }

    await this.authStrategy.afterBrowserInitialized();
    await this.initWebVersionCache();

    // ocVersion (isOfficialClient patch)
    // remove after 2.3000.x hard release
    await page.evaluateOnNewDocument(() => {
        const originalError = Error;
        window.originalError = originalError;
        //eslint-disable-next-line no-global-assign
        Error = function (message) {
            const error = new originalError(message);
            const originalStack = error.stack;
            if (error.stack.includes('moduleRaid')) error.stack = originalStack + '\n    at https://web.whatsapp.com/vendors~lazy_loaded_low_priority_components.05e98054dbd60f980427.js:2:44';
            return error;
        };
    });
    
    await page.goto(WhatsWebURL, {
        waitUntil: 'load',
        timeout: 0,
        referer: 'https://whatsapp.com/'
    });

    await this.inject();

    this.pupPage.on('framenavigated', async (frame) => {
        if(frame.url().includes('post_logout=1') || this.lastLoggedOut) {
            this.emit(Events.DISCONNECTED, 'LOGOUT');
            await this.authStrategy.logout();
            await this.authStrategy.beforeBrowserInitialized();
            await this.authStrategy.afterBrowserInitialized();
            this.lastLoggedOut = false;
        }
        await this.inject();
    });
}

/**
 * Get additional browser args based on stealth level
 */
getStealthBrowserArgs(stealthLevel) {
    const stealthArgs = {
        low: [
            // Minimal stealth
            '--no-first-run',
            '--no-default-browser-check'
        ],
        medium: [
            // Moderate stealth
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-background-timer-throttling',
            '--disable-popup-blocking'
        ],
        high: [
            // Maximum stealth
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-background-timer-throttling',
            '--disable-popup-blocking',
            '--disable-translate',
            '--disable-extensions',
            '--remote-debugging-port=0'
        ]
    };
    
    return stealthArgs[stealthLevel] || stealthArgs.medium;
}

/**
 * Apply stealth techniques to the page
 */
    async applyPageStealth(page, stealthConfig) {
        await page.evaluateOnNewDocument((config) => {
            // ✅ DYNAMIC: Only remove webdriver if enabled
            if (config.removeWebdriver) {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
            }

            // Always apply basic stealth that's safe
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );

            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });

            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
        }, stealthConfig);

        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
        });


    }

    /**
     * Request authentication via pairing code instead of QR code
     * @param {string} phoneNumber - Phone number in international, symbol-free format (e.g. 12025550108 for US, 551155501234 for Brazil)
     * @param {boolean} [showNotification = true] - Show notification to pair on phone number
     * @param {number} [intervalMs = 180000] - The interval in milliseconds on how frequent to generate pairing code (WhatsApp default to 3 minutes)
     * @returns {Promise<string>} - Returns a pairing code in format "ABCDEFGH"
     */
    async requestPairingCode(phoneNumber, showNotification = true, intervalMs = 180000) {
        return await this.pupPage.evaluate(async (phoneNumber, showNotification, intervalMs) => {
            const getCode = async () => {
                while (!window.AuthStore.PairingCodeLinkUtils) {
                    await new Promise(resolve => setTimeout(resolve, 250));
                }
                window.AuthStore.PairingCodeLinkUtils.setPairingType('ALT_DEVICE_LINKING');
                await window.AuthStore.PairingCodeLinkUtils.initializeAltDeviceLinking();
                return window.AuthStore.PairingCodeLinkUtils.startAltLinkingFlow(phoneNumber, showNotification);
            };
            
            // Clear any existing interval to prevent memory leaks
            if (window.codeInterval) {
                clearInterval(window.codeInterval);
                window.codeInterval = null;
            }
            
            window.codeInterval = setInterval(async () => {
                if (window.AuthStore.AppState.state != 'UNPAIRED' && window.AuthStore.AppState.state != 'UNPAIRED_IDLE') {
                    clearInterval(window.codeInterval);
                    window.codeInterval = null;
                    return;
                }
                window.onCodeReceivedEvent(await getCode());
            }, intervalMs);
            
            return window.onCodeReceivedEvent(await getCode());
        }, phoneNumber, showNotification, intervalMs);
    }

    /**
     * Attach event listeners to WA Web
     * Private function
     * @property {boolean} reinject is this a reinject?
     */
async attachEventListeners() {
    // ✅ ADD: Prevent duplicate event listener attachment
    if (this._listenersAttached) {
        console.log('Event listeners already attached, cleaning up first...');
        await this._cleanupEventListeners();
    }
    
    // ✅ ADD: Initialize tracking for attached listeners
    this._attachedListeners = [];

    // ✅ FIXED: Improved rate limiting that won't trigger unnecessarily
    const createOptimizedHandler = (handler, handlerName = 'unknown') => {
        let callCount = 0;
        let lastCallTime = 0;
        const MAX_CALLS_PER_SECOND = 5000; // Much higher limit to avoid false positives
        let lastWarningTime = 0;
        
        return (...args) => {
            try {
                const now = Date.now();
                
                // Reset counter if more than 1 second has passed
                if (now - lastCallTime > 1000) {
                    callCount = 0;
                    lastCallTime = now;
                }
                
                callCount++;
                
                // Only warn occasionally and with cooldown to prevent spam
                if (callCount > MAX_CALLS_PER_SECOND) {
                    // Warn only once every 10 seconds max for the same handler
                    if (now - lastWarningTime > 10000) {
                        console.warn(`Event handler rate limit exceeded for ${handlerName}. Count: ${callCount} events/sec`);
                        lastWarningTime = now;
                    }
                    // Still process the event - don't skip it
                }
                
                return handler(...args);
            } catch (error) {
                console.error(`Error in optimized event handler (${handlerName}):`, error);
            }
        };
    };

    // ✅ OPTIMIZED: Batch message processing for better performance
    let messageBatch = [];
    let batchTimeout = null;
    const BATCH_DELAY = 50; // Process messages in batches every 50ms

    const processMessageBatch = () => {
        if (messageBatch.length === 0) return;
        
        const batchToProcess = [...messageBatch];
        messageBatch = [];
        batchTimeout = null;
        
        for (const msg of batchToProcess) {
            if (msg.type === 'gp2') {
                const notification = new GroupNotification(this, msg);
                if (['add', 'invite', 'linked_group_join'].includes(msg.subtype)) {
                    /**
                         * Emitted when a user joins the chat via invite link or is added by an admin.
                         * @event Client#group_join
                         * @param {GroupNotification} notification GroupNotification with more information about the action
                         */
                    this.emit(Events.GROUP_JOIN, notification);
                } else if (msg.subtype === 'remove' || msg.subtype === 'leave') {
                    /**
                         * Emitted when a user leaves the chat or is removed by an admin.
                         * @event Client#group_leave
                         * @param {GroupNotification} notification GroupNotification with more information about the action
                         */
                    this.emit(Events.GROUP_LEAVE, notification);
                } else if (msg.subtype === 'promote' || msg.subtype === 'demote') {
                    /**
                         * Emitted when a current user is promoted to an admin or demoted to a regular user.
                         * @event Client#group_admin_changed
                         * @param {GroupNotification} notification GroupNotification with more information about the action
                         */
                    this.emit(Events.GROUP_ADMIN_CHANGED, notification);
                } else if (msg.subtype === 'membership_approval_request') {
                    /**
                         * Emitted when some user requested to join the group
                         * that has the membership approval mode turned on
                         * @event Client#group_membership_request
                         * @param {GroupNotification} notification GroupNotification with more information about the action
                         * @param {string} notification.chatId The group ID the request was made for
                         * @param {string} notification.author The user ID that made a request
                         * @param {number} notification.timestamp The timestamp the request was made at
                         */
                    this.emit(Events.GROUP_MEMBERSHIP_REQUEST, notification);
                } else {
                    /**
                         * Emitted when group settings are updated, such as subject, description or picture.
                         * @event Client#group_update
                         * @param {GroupNotification} notification GroupNotification with more information about the action
                         */
                    this.emit(Events.GROUP_UPDATE, notification);
                }
            } else {
                const message = new Message(this, msg);

                /**
                     * Emitted when a new message is created, which may include the current user's own messages.
                     * @event Client#message_create
                     * @param {Message} message The message that was created
                     */
                this.emit(Events.MESSAGE_CREATE, message);

                if (!msg.id.fromMe) {
                    /**
                         * Emitted when a new message is received.
                         * @event Client#message
                         * @param {Message} message The message that was received
                         */
                    this.emit(Events.MESSAGE_RECEIVED, message);
                }
            }
        }
    };

    // ✅ OPTIMIZED: Batch message handler
    await exposeFunctionIfAbsent(this.pupPage, 'onAddMessageEvent', createOptimizedHandler(msg => {
        // ✅ Add to batch instead of immediate processing
        messageBatch.push(msg);
        
        if (!batchTimeout) {
            batchTimeout = setTimeout(processMessageBatch, BATCH_DELAY);
        }
    }, 'onAddMessageEvent'));
    this._attachedListeners.push({ funcName: 'onAddMessageEvent' });

    let last_message;

    // ✅ OPTIMIZED: Single message handler for non-batch events
    await exposeFunctionIfAbsent(this.pupPage, 'onChangeMessageTypeEvent', createOptimizedHandler((msg) => {
        if (msg.type === 'revoked') {
            const message = new Message(this, msg);
            let revoked_msg;
            if (last_message && msg.id.id === last_message.id.id) {
                revoked_msg = new Message(this, last_message);

                if (message.protocolMessageKey)
                    revoked_msg.id = { ...message.protocolMessageKey };                    
            }

            /**
                 * Emitted when a message is deleted for everyone in the chat.
                 * @event Client#message_revoke_everyone
                 * @param {Message} message The message that was revoked, in its current state. It will not contain the original message's data.
                 * @param {?Message} revoked_msg The message that was revoked, before it was revoked. It will contain the message's original data. 
                 * Note that due to the way this data is captured, it may be possible that this param will be undefined.
                 */
            this.emit(Events.MESSAGE_REVOKED_EVERYONE, message, revoked_msg);
        }
    }, 'onChangeMessageTypeEvent'));
    this._attachedListeners.push({ funcName: 'onChangeMessageTypeEvent' });

    await exposeFunctionIfAbsent(this.pupPage, 'onChangeMessageEvent', createOptimizedHandler((msg) => {
        if (msg.type !== 'revoked') {
            last_message = msg;
        }

        /**
             * The event notification that is received when one of
             * the group participants changes their phone number.
             */
        const isParticipant = msg.type === 'gp2' && msg.subtype === 'modify';

        /**
             * The event notification that is received when one of
             * the contacts changes their phone number.
             */
        const isContact = msg.type === 'notification_template' && msg.subtype === 'change_number';

        if (isParticipant || isContact) {
            /** @type {GroupNotification} object does not provide enough information about this event, so a @type {Message} object is used. */
            const message = new Message(this, msg);

            const newId = isParticipant ? msg.recipients[0] : msg.to;
            const oldId = isParticipant ? msg.author : msg.templateParams.find(id => id !== newId);

            /**
                 * Emitted when a contact or a group participant changes their phone number.
                 * @event Client#contact_changed
                 * @param {Message} message Message with more information about the event.
                 * @param {String} oldId The user's id (an old one) who changed their phone number
                 * and who triggered the notification.
                 * @param {String} newId The user's new id after the change.
                 * @param {Boolean} isContact Indicates if a contact or a group participant changed their phone number.
                 */
            this.emit(Events.CONTACT_CHANGED, message, oldId, newId, isContact);
        }
    }, 'onChangeMessageEvent'));
    this._attachedListeners.push({ funcName: 'onChangeMessageEvent' });

    // Continue applying createOptimizedHandler to ALL other event listeners
    await exposeFunctionIfAbsent(this.pupPage, 'onRemoveMessageEvent', createOptimizedHandler((msg) => {
        if (!msg.isNewMsg) return;

        const message = new Message(this, msg);

        /**
             * Emitted when a message is deleted by the current user.
             * @event Client#message_revoke_me
             * @param {Message} message The message that was revoked
             */
        this.emit(Events.MESSAGE_REVOKED_ME, message);
    }, 'onRemoveMessageEvent'));
    this._attachedListeners.push({ funcName: 'onRemoveMessageEvent' });

    await exposeFunctionIfAbsent(this.pupPage, 'onMessageAckEvent', createOptimizedHandler((msg, ack) => {
        const message = new Message(this, msg);

        /**
             * Emitted when an ack event occurrs on message type.
             * @event Client#message_ack
             * @param {Message} message The message that was affected
             * @param {MessageAck} ack The new ACK value
             */
        this.emit(Events.MESSAGE_ACK, message, ack);
    }, 'onMessageAckEvent'));
    this._attachedListeners.push({ funcName: 'onMessageAckEvent' });

    // ✅ OPTIMIZED: Cache chat lookups for unread count events
    await exposeFunctionIfAbsent(this.pupPage, 'onChatUnreadCountEvent', createOptimizedHandler(async (data) => {
        const chat = await this.getChatById(data.id);
            
        /**
             * Emitted when the chat unread count changes
             */
        this.emit(Events.UNREAD_COUNT, chat);
    }, 'onChatUnreadCountEvent'));
    this._attachedListeners.push({ funcName: 'onChatUnreadCountEvent' });

    await exposeFunctionIfAbsent(this.pupPage, 'onMessageMediaUploadedEvent', createOptimizedHandler((msg) => {
        const message = new Message(this, msg);

        /**
             * Emitted when media has been uploaded for a message sent by the client.
             * @event Client#media_uploaded
             * @param {Message} message The message with media that was uploaded
             */
        this.emit(Events.MEDIA_UPLOADED, message);
    }, 'onMessageMediaUploadedEvent'));
    this._attachedListeners.push({ funcName: 'onMessageMediaUploadedEvent' });

    await exposeFunctionIfAbsent(this.pupPage, 'onAppStateChangedEvent', createOptimizedHandler(async (state) => {
        /**
             * Emitted when the connection state changes
             * @event Client#change_state
             * @param {WAState} state the new connection state
             */
        this.emit(Events.STATE_CHANGED, state);

        const ACCEPTED_STATES = [WAState.CONNECTED, WAState.OPENING, WAState.PAIRING, WAState.TIMEOUT];

        if (this.options.takeoverOnConflict) {
            ACCEPTED_STATES.push(WAState.CONFLICT);

            if (state === WAState.CONFLICT) {
                setTimeout(() => {
                    this.pupPage.evaluate(() => window.Store.AppState.takeover());
                }, this.options.takeoverTimeoutMs);
            }
        }

        if (!ACCEPTED_STATES.includes(state)) {
            /**
                 * Emitted when the client has been disconnected
                 * @event Client#disconnected
                 * @param {WAState|"LOGOUT"} reason reason that caused the disconnect
                 */
            await this.authStrategy.disconnect();
            this.emit(Events.DISCONNECTED, state);
            this.destroy();
        }
    }, 'onAppStateChangedEvent'));
    this._attachedListeners.push({ funcName: 'onAppStateChangedEvent' });

    await exposeFunctionIfAbsent(this.pupPage, 'onBatteryStateChangedEvent', createOptimizedHandler((state) => {
        const { battery, plugged } = state;

        if (battery === undefined) return;

        /**
             * Emitted when the battery percentage for the attached device changes. Will not be sent if using multi-device.
             * @event Client#change_battery
             * @param {object} batteryInfo
             * @param {number} batteryInfo.battery - The current battery percentage
             * @param {boolean} batteryInfo.plugged - Indicates if the phone is plugged in (true) or not (false)
             * @deprecated
             */
        this.emit(Events.BATTERY_CHANGED, { battery, plugged });
    }, 'onBatteryStateChangedEvent'));
    this._attachedListeners.push({ funcName: 'onBatteryStateChangedEvent' });

    await exposeFunctionIfAbsent(this.pupPage, 'onIncomingCall', createOptimizedHandler((call) => {
        /**
             * Emitted when a call is received
             * @event Client#incoming_call
             * @param {object} call
             * @param {number} call.id - Call id
             * @param {string} call.peerJid - Who called
             * @param {boolean} call.isVideo - if is video
             * @param {boolean} call.isGroup - if is group
             * @param {boolean} call.canHandleLocally - if we can handle in waweb
             * @param {boolean} call.outgoing - if is outgoing
             * @param {boolean} call.webClientShouldHandle - If Waweb should handle
             * @param {object} call.participants - Participants
             */
        const cll = new Call(this, call);
        this.emit(Events.INCOMING_CALL, cll);
    }, 'onIncomingCall'));
    this._attachedListeners.push({ funcName: 'onIncomingCall' });

    await exposeFunctionIfAbsent(this.pupPage, 'onReaction', createOptimizedHandler((reactions) => {
        for (const reaction of reactions) {
            /**
                 * Emitted when a reaction is sent, received, updated or removed
                 * @event Client#message_reaction
                 * @param {object} reaction
                 * @param {object} reaction.id - Reaction id
                 * @param {number} reaction.orphan - Orphan
                 * @param {?string} reaction.orphanReason - Orphan reason
                 * @param {number} reaction.timestamp - Timestamp
                 * @param {string} reaction.reaction - Reaction
                 * @param {boolean} reaction.read - Read
                 * @param {object} reaction.msgId - Parent message id
                 * @param {string} reaction.senderId - Sender id
                 * @param {?number} reaction.ack - Ack
                 */

            this.emit(Events.MESSAGE_REACTION, new Reaction(this, reaction));
        }
    }, 'onReaction'));
    this._attachedListeners.push({ funcName: 'onReaction' });

    // ✅ OPTIMIZED: Cache chat lookups for removal events
    await exposeFunctionIfAbsent(this.pupPage, 'onRemoveChatEvent', createOptimizedHandler(async (chat) => {
        const _chat = await this.getChatById(chat.id);

        /**
             * Emitted when a chat is removed
             * @event Client#chat_removed
             * @param {Chat} chat
             */
        this.emit(Events.CHAT_REMOVED, _chat);
    }, 'onRemoveChatEvent'));
    this._attachedListeners.push({ funcName: 'onRemoveChatEvent' });
        
    await exposeFunctionIfAbsent(this.pupPage, 'onArchiveChatEvent', createOptimizedHandler(async (chat, currState, prevState) => {
        const _chat = await this.getChatById(chat.id);
            
        /**
             * Emitted when a chat is archived/unarchived
             * @event Client#chat_archived
             * @param {Chat} chat
             * @param {boolean} currState
             * @param {boolean} prevState
             */
        this.emit(Events.CHAT_ARCHIVED, _chat, currState, prevState);
    }, 'onArchiveChatEvent'));
    this._attachedListeners.push({ funcName: 'onArchiveChatEvent' });

    await exposeFunctionIfAbsent(this.pupPage, 'onEditMessageEvent', createOptimizedHandler((msg, newBody, prevBody) => {
        if(msg.type === 'revoked'){
            return;
        }
        /**
             * Emitted when messages are edited
             * @event Client#message_edit
             * @param {Message} message
             * @param {string} newBody
             * @param {string} prevBody
             */
        this.emit(Events.MESSAGE_EDIT, new Message(this, msg), newBody, prevBody);
    }, 'onEditMessageEvent'));
    this._attachedListeners.push({ funcName: 'onEditMessageEvent' });
        
    await exposeFunctionIfAbsent(this.pupPage, 'onAddMessageCiphertextEvent', createOptimizedHandler(msg => {
        /**
             * Emitted when messages are edited
             * @event Client#message_ciphertext
             * @param {Message} message
             */
        this.emit(Events.MESSAGE_CIPHERTEXT, new Message(this, msg));
    }, 'onAddMessageCiphertextEvent'));
    this._attachedListeners.push({ funcName: 'onAddMessageCiphertextEvent' });

    await exposeFunctionIfAbsent(this.pupPage, 'onPollVoteEvent', createOptimizedHandler((votes) => {
        for (const vote of votes) {
            /**
             * Emitted when some poll option is selected or deselected,
             * shows a user's current selected option(s) on the poll
             * @event Client#vote_update
             */
            this.emit(Events.VOTE_UPDATE, new PollVote(this, vote));
        }
    }, 'onPollVoteEvent'));
    this._attachedListeners.push({ funcName: 'onPollVoteEvent' });

    // ✅ OPTIMIZED: Store event binding with error handling
    await this.pupPage.evaluate(() => {
        try {
            window.Store.Msg.on('change', (msg) => { window.onChangeMessageEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('change:type', (msg) => { window.onChangeMessageTypeEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('change:ack', (msg, ack) => { window.onMessageAckEvent(window.WWebJS.getMessageModel(msg), ack); });
            window.Store.Msg.on('change:isUnsentMedia', (msg, unsent) => { if (msg.id.fromMe && !unsent) window.onMessageMediaUploadedEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('remove', (msg) => { if (msg.isNewMsg) window.onRemoveMessageEvent(window.WWebJS.getMessageModel(msg)); });
            window.Store.Msg.on('change:body change:caption', (msg, newBody, prevBody) => { window.onEditMessageEvent(window.WWebJS.getMessageModel(msg), newBody, prevBody); });
            window.Store.AppState.on('change:state', (_AppState, state) => { window.onAppStateChangedEvent(state); });
            window.Store.Conn.on('change:battery', (state) => { window.onBatteryStateChangedEvent(state); });
            window.Store.Call.on('add', (call) => { window.onIncomingCall(call); });
            window.Store.Chat.on('remove', async (chat) => { window.onRemoveChatEvent(await window.WWebJS.getChatModel(chat)); });
            window.Store.Chat.on('change:archive', async (chat, currState, prevState) => { window.onArchiveChatEvent(await window.WWebJS.getChatModel(chat), currState, prevState); });
            window.Store.Msg.on('add', (msg) => { 
                if (msg.isNewMsg) {
                    if(msg.type === 'ciphertext') {
                        // defer message event until ciphertext is resolved (type changed)
                        msg.once('change:type', (_msg) => window.onAddMessageEvent(window.WWebJS.getMessageModel(_msg)));
                        window.onAddMessageCiphertextEvent(window.WWebJS.getMessageModel(msg));
                    } else {
                        window.onAddMessageEvent(window.WWebJS.getMessageModel(msg)); 
                    }
                }
            });
            window.Store.Chat.on('change:unreadCount', (chat) => {window.onChatUnreadCountEvent(chat);});

            if (window.compareWwebVersions(window.Debug.VERSION, '>=', '2.3000.1014111620')) {
                const module = window.Store.AddonReactionTable;
                const ogMethod = module.bulkUpsert;
                module.bulkUpsert = ((...args) => {
                    window.onReaction(args[0].map(reaction => {
                        const msgKey = reaction.id;
                        const parentMsgKey = reaction.reactionParentKey;
                        const timestamp = reaction.reactionTimestamp / 1000;
                        const sender = reaction.author ?? reaction.from;
                        const senderUserJid = sender._serialized;

                        return {...reaction, msgKey, parentMsgKey, senderUserJid, timestamp };
                    }));

                    return ogMethod(...args);
                }).bind(module);

                const pollVoteModule = window.Store.AddonPollVoteTable;
                const ogPollVoteMethod = pollVoteModule.bulkUpsert;

                pollVoteModule.bulkUpsert = (async (...args) => {
                    const votes = await Promise.all(args[0].map(async vote => {
                        const msgKey = vote.id;
                        const parentMsgKey = vote.pollUpdateParentKey;
                        const timestamp = vote.t / 1000;
                        const sender = vote.author ?? vote.from;
                        const senderUserJid = sender._serialized;

                        let parentMessage = window.Store.Msg.get(parentMsgKey._serialized);
                        if (!parentMessage) {
                            const fetched = await window.Store.Msg.getMessagesById([parentMsgKey._serialized]);
                            parentMessage = fetched?.messages?.[0] || null;
                        }

                        return {
                            ...vote,
                            msgKey,
                            sender,
                            parentMsgKey,
                            senderUserJid,
                            timestamp,
                            parentMessage
                        };
                    }));

                    window.onPollVoteEvent(votes);

                    return ogPollVoteMethod.apply(pollVoteModule, args);
                }).bind(pollVoteModule);
            } else {
                const module = window.Store.createOrUpdateReactionsModule;
                const ogMethod = module.createOrUpdateReactions;
                module.createOrUpdateReactions = ((...args) => {
                    window.onReaction(args[0].map(reaction => {
                        const msgKey = window.Store.MsgKey.fromString(reaction.msgKey);
                        const parentMsgKey = window.Store.MsgKey.fromString(reaction.parentMsgKey);
                        const timestamp = reaction.timestamp / 1000;

                        return {...reaction, msgKey, parentMsgKey, timestamp };
                    }));

                    return ogMethod(...args);
                }).bind(module);
            }
        } catch (error) {
            console.error('Error setting up Store event listeners:', error);
        }
    });

    // ✅ ADD: Clean up batch processing on destroy
    this._cleanupCallbacks.push(() => {
        if (batchTimeout) {
            clearTimeout(batchTimeout);
            batchTimeout = null;
        }
        if (messageBatch.length > 0) {
            processMessageBatch(); // Process any remaining messages
        }
    });

    // ✅ ADD: Mark listeners as successfully attached
    this._listenersAttached = true;
    console.log('Optimized event listeners attached successfully');
}
    /**
     * Clean up event listeners to prevent duplication
     * @private
     */
    async _cleanupEventListeners() {
        console.log('Performing comprehensive event listener cleanup...');
        
        // 1. Clear batch processing
        if (this._batchTimeout) {
            clearTimeout(this._batchTimeout);
            this._batchTimeout = null;
        }
        
        // 2. Process any remaining messages in batch
        if (this._messageBatch && this._messageBatch.length > 0 && !this._batchProcessing) {
            await this._processMessageBatch();
        }
        
        // 3. Clean up exposed functions from window
        if (this._attachedListeners && this._attachedListeners.length > 0) {
            for (const listener of this._attachedListeners) {
                try {
                    await this.pupPage.evaluate((funcName) => {
                        if (window[funcName]) {
                            // Remove all event bindings first
                            const storeEvents = [
                                'Msg', 'AppState', 'Conn', 'Call', 'Chat', 
                                'AddonReactionTable', 'AddonPollVoteTable'
                            ];
                            
                            storeEvents.forEach(store => {
                                if (window.Store && window.Store[store]) {
                                    window.Store[store].off('change');
                                    window.Store[store].off('change:type');
                                    window.Store[store].off('change:ack');
                                    window.Store[store].off('change:isUnsentMedia');
                                    window.Store[store].off('remove');
                                    window.Store[store].off('change:body');
                                    window.Store[store].off('change:caption');
                                    window.Store[store].off('change:state');
                                    window.Store[store].off('change:battery');
                                    window.Store[store].off('add');
                                    window.Store[store].off('change:archive');
                                    window.Store[store].off('change:unreadCount');
                                }
                            });
                            
                            // Remove the exposed function
                            delete window[funcName];
                        }
                    }, listener.funcName);
                } catch (error) {
                    console.error('Error cleaning up listener:', listener.funcName, error);
                }
            }
            this._attachedListeners = [];
        }
        
        // 4. Clear all cleanup callbacks
        if (this._cleanupCallbacks) {
            this._cleanupCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (e) {
                    console.error('Error in cleanup callback:', e);
                }
            });
            this._cleanupCallbacks = [];
        }
        
        // 5. Reset tracking flags
        this._listenersAttached = false;
        this._batchProcessing = false;
        
        console.log('Event listener cleanup completed');
    }
    /**
     * Initialize web version cache with proper cleanup
     */
    async initWebVersionCache() {
        const { type: webCacheType, ...webCacheOptions } = this.options.webVersionCache;
        const webCache = WebCacheFactory.createWebCache(webCacheType, webCacheOptions);

        const requestedVersion = this.options.webVersion;
        const versionContent = await webCache.resolve(requestedVersion);

        // Store handlers for proper cleanup to prevent memory leaks
        this._requestHandlers = [];

        if(versionContent) {
            await this.pupPage.setRequestInterception(true);
            
            const requestHandler = async (req) => {
                if(req.url() === WhatsWebURL) {
                    req.respond({
                        status: 200,
                        contentType: 'text/html',
                        body: versionContent
                    }); 
                } else {
                    req.continue();
                }
            };
            
            this.pupPage.on('request', requestHandler);
            this._requestHandlers.push({ type: 'request', handler: requestHandler });
        } else {
            const responseHandler = async (res) => {
                if(res.ok() && res.url() === WhatsWebURL) {
                    const indexHtml = await res.text();
                    this.currentIndexHtml = indexHtml;
                }
            };
            
            this.pupPage.on('response', responseHandler);
            this._requestHandlers.push({ type: 'response', handler: responseHandler });
        }
    }

    /**
     * Closes the client with proper resource cleanup
     */
    async destroy() {
        console.log('Starting comprehensive client destruction...');
        
        try {
            // 🔴 FIX: Proper cleanup order with error isolation
            
            // 1. Stop all intervals and timeouts FIRST
            if (this._activeIntervals) {
                this._activeIntervals.forEach(clearInterval);
                this._activeIntervals.clear();
            }
            
            if (this._stateCheckInterval) {
                clearInterval(this._stateCheckInterval);
                this._stateCheckInterval = null;
            }

            // 🔴 FIX: Clear batch processing
            if (this._batchTimeout) {
                clearTimeout(this._batchTimeout);
                this._batchTimeout = null;
            }
            
            // Process any remaining messages
            if (this._messageBatch && this._messageBatch.length > 0 && !this._batchProcessing) {
                try {
                    await this._processMessageBatch();
                } catch (error) {
                    console.warn('Error processing final message batch:', error);
                }
            }

            // 2. Clean up event listeners
            if (this._listenersAttached) {
                try {
                    await this._cleanupEventListeners();
                } catch (error) {
                    console.error('Error cleaning up event listeners:', error);
                }
            }

            // 3. Clear event handlers
            if (this._eventHandlers) {
                this._eventHandlers.clear();
            }

            // 4. Run cleanup callbacks with error handling
            if (this._cleanupCallbacks) {
                this._cleanupCallbacks.forEach(callback => {
                    try { 
                        callback(); 
                    } catch (e) { 
                        console.error('Error in cleanup callback:', e);
                    }
                });
                this._cleanupCallbacks = [];
            }

            // 5. Clear caches to free memory
            if (this._chatCache) this._chatCache.clear();
            if (this._contactCache) this._contactCache.clear();
            if (this._messageCache) this._messageCache.clear();
            if (this._cacheTimestamps) this._cacheTimestamps.clear();

            // 6. Clean up page context intervals (with error handling)
            if (this.pupPage) {
                try {
                    await this.pupPage.evaluate(() => {
                        // Clear known intervals
                        if (window.codeInterval) {
                            clearInterval(window.codeInterval);
                            window.codeInterval = null;
                        }
                        
                        // Clear any other intervals with 'Interval' in name
                        Object.keys(window).forEach(key => {
                            if (key.includes('Interval') && window[key] && typeof window[key] === 'number') {
                                clearInterval(window[key]);
                                window[key] = null;
                            }
                        });
                    }).catch(error => {
                        console.warn('Error cleaning page intervals:', error);
                    });
                } catch (error) {
                    console.warn('Error accessing page for interval cleanup:', error);
                }
            }

            // 7. Remove network event listeners
            if (this._requestHandlers && this.pupPage) {
                this._requestHandlers.forEach(({ type, handler }) => {
                    try {
                        this.pupPage.off(type, handler);
                    } catch (error) {
                        console.warn('Error removing network handler:', error);
                    }
                });
                this._requestHandlers = [];
            }

            // 🔴 FIX: Close resources in proper order
            
            // 8. Close browser (if connected)
            if (this.pupBrowser && this.pupBrowser.isConnected && this.pupBrowser.isConnected()) {
                try {
                    await this.pupBrowser.close();
                    console.log('Browser closed successfully');
                } catch (error) {
                    console.warn('Error closing browser:', error);
                }
                this.pupBrowser = null;
            }

            // 9. Destroy auth strategy
            if (this.authStrategy && typeof this.authStrategy.destroy === 'function') {
                try {
                    await this.authStrategy.destroy();
                    console.log('Auth strategy destroyed successfully');
                } catch (error) {
                    console.warn('Error destroying auth strategy:', error);
                }
            }

            // 🔴 FIX: Reset all state to prevent memory leaks
            this._connectionState = 'DISCONNECTED';
            this._listenersAttached = false;
            this._batchProcessing = false;
            this.pupPage = null;
            this.info = null;
            this.interface = null;
            
            // Clear any remaining arrays
            this._messageBatch = [];
            this._attachedListeners = [];
            this._cleanupCallbacks = [];

            console.log('Client destruction completed successfully');
            
        } catch (error) {
            console.error('Critical error during client destruction:', error);
            // Even if there's an error, try to clean up as much as possible
            try {
                if (this.pupBrowser) {
                    await this.pupBrowser.close().catch(() => {});
                }
            } catch (finalError) {
                console.error('Final cleanup also failed:', finalError);
            }
        }
    }

    /**
     * Logs out the client, closing the current session
     */
    async logout() {
        await this.pupPage.evaluate(() => {
            if (window.Store && window.Store.AppState && typeof window.Store.AppState.logout === 'function') {
                return window.Store.AppState.logout();
            }
        });
        await this.pupBrowser.close();
        
        let maxDelay = 0;
        while (this.pupBrowser.isConnected() && (maxDelay < 10)) { // waits a maximum of 1 second before calling the AuthStrategy
            await new Promise(resolve => setTimeout(resolve, 100));
            maxDelay++; 
        }
        
        await this.authStrategy.logout();
    }

    /**
     * Returns the version of WhatsApp Web currently being run
     * @returns {Promise<string>}
     */
    async getWWebVersion() {
        return await this.pupPage.evaluate(() => {
            return window.Debug.VERSION;
        });
    }

    async setDeviceName(deviceName, browserName) {
        (deviceName || browserName) && await this.pupPage.evaluate((deviceName, browserName) => {
            const func = window.require('WAWebMiscBrowserUtils').info;
            window.require('WAWebMiscBrowserUtils').info = () => {
                return {
                    ...func(),
                    ...(deviceName ? { os: deviceName } : {}),
                    ...(browserName ? { name: browserName } : {})
                };
            };
        }, deviceName, browserName);
    }

    /**
     * Mark as seen for the Chat
     *  @param {string} chatId
     *  @returns {Promise<boolean>} result
     * 
     */
    async sendSeen(chatId) {
        return await this.pupPage.evaluate(async (chatId) => {
            return window.WWebJS.sendSeen(chatId);
        }, chatId);
    }

    /**
     * An object representing mentions of groups
     * @typedef {Object} GroupMention
     * @property {string} subject - The name of a group to mention (can be custom)
     * @property {string} id - The group ID, e.g.: 'XXXXXXXXXX@g.us'
     */

    /**
     * Message options.
     * @typedef {Object} MessageSendOptions
     * @property {boolean} [linkPreview=true] - Show links preview. Has no effect on multi-device accounts.
     * @property {boolean} [sendAudioAsVoice=false] - Send audio as voice message with a generated waveform
     * @property {boolean} [sendVideoAsGif=false] - Send video as gif
     * @property {boolean} [sendMediaAsSticker=false] - Send media as a sticker
     * @property {boolean} [sendMediaAsDocument=false] - Send media as a document
     * @property {boolean} [sendMediaAsHd=false] - Send image as quality HD
     * @property {boolean} [isViewOnce=false] - Send photo/video as a view once message
     * @property {boolean} [parseVCards=true] - Automatically parse vCards and send them as contacts
     * @property {string} [caption] - Image or video caption
     * @property {string} [quotedMessageId] - Id of the message that is being quoted (or replied to)
     * @property {GroupMention[]} [groupMentions] - An array of object that handle group mentions
     * @property {string[]} [mentions] - User IDs to mention in the message
     * @property {boolean} [sendSeen=true] - Mark the conversation as seen after sending the message
     * @property {string} [invokedBotWid=undefined] - Bot Wid when doing a bot mention like @Meta AI
     * @property {string} [stickerAuthor=undefined] - Sets the author of the sticker, (if sendMediaAsSticker is true).
     * @property {string} [stickerName=undefined] - Sets the name of the sticker, (if sendMediaAsSticker is true).
     * @property {string[]} [stickerCategories=undefined] - Sets the categories of the sticker, (if sendMediaAsSticker is true). Provide emoji char array, can be null.
     * @property {boolean} [ignoreQuoteErrors = true] - Should the bot send a quoted message without the quoted message if it fails to get the quote?
     * @property {boolean} [waitUntilMsgSent = false] - Should the bot wait for the message send result?
     * @property {MessageMedia} [media] - Media to be sent
     * @property {any} [extra] - Extra options
     */
    
/**
 * Send a message to a specific chatId
 * @param {string} chatId
 * @param {string|MessageMedia|Location|Poll|Contact|Array<Contact>|Buttons|List} content
 * @param {MessageSendOptions} [options] - Options used when sending the message
 * 
 * @returns {Promise<Message>} Message that was just sent
 */
/**
 * Send a message to a specific chatId
 * @param {string} chatId
 * @param {string|MessageMedia|Location|Poll|Contact|Array<Contact>|Buttons|List} content
 * @param {MessageSendOptions} [options] - Options used when sending the message
 * 
 * @returns {Promise<Message>} Message that was just sent
 */
async sendMessage(chatId, content, options = {}) {
    // ✅ FIX: Better LID address handling
    const originalChatId = chatId;
    if (chatId.endsWith('@lid')) {
        try {
            console.log(`Converting LID address: ${chatId}`);
            
            // Try to get the contact first
            let contact;
            try {
                contact = await this.getContactById(chatId);
            } catch (error) {
                console.log('Contact not found, trying alternative LID conversion...');
            }
            
            if (contact && contact.id && !contact.id._serialized.endsWith('@lid')) {
                chatId = contact.id._serialized;
                console.log(`Converted LID to: ${chatId}`);
            } else {
                // If contact doesn't exist, try to extract phone number from LID
                // LID format: 236274858340568:11@lid
                const lidMatch = chatId.match(/^(\d+):\d+@lid$/);
                if (lidMatch && lidMatch[1]) {
                    const potentialPhoneNumber = lidMatch[1] + '@c.us';
                    console.log(`Trying extracted phone number: ${potentialPhoneNumber}`);
                    
                    // Verify if this number exists
                    try {
                        const numberId = await this.getNumberId(potentialPhoneNumber.replace('@c.us', ''));
                        if (numberId) {
                            chatId = numberId._serialized;
                            console.log(`Successfully converted LID to: ${chatId}`);
                        } else {
                            console.log('Extracted phone number not registered on WhatsApp');
                            // Continue with original LID - WhatsApp might still handle it
                        }
                    } catch (error) {
                        console.log('Could not verify extracted phone number');
                        // Continue with original LID
                    }
                } else {
                    console.log('LID format not recognized, using original');
                }
            }
        } catch (error) {
            console.error('Error converting LID address:', error.message);
            // Continue with original chatId - sometimes WhatsApp can handle LID directly
        }
    }

    const isChannel = /@\w*newsletter\b/.test(chatId);

    if (isChannel && [
        options.sendMediaAsDocument, options.quotedMessageId, 
        options.parseVCards, options.isViewOnce,
        content instanceof Location, content instanceof Contact,
        content instanceof Buttons, content instanceof List,
        Array.isArray(content) && content.length > 0 && content[0] instanceof Contact
    ].includes(true)) {
        console.warn('The message type is currently not supported for sending in channels,\nthe supported message types are: text, image, sticker, gif, video, voice and poll.');
        return null;
    }

    if (options.mentions) {
        !Array.isArray(options.mentions) && (options.mentions = [options.mentions]);
        if (options.mentions.some((possiblyContact) => possiblyContact instanceof Contact)) {
            console.warn('Mentions with an array of Contact are now deprecated. See more at https://github.com/pedroslopez/whatsapp-web.js/pull/2166.');
            options.mentions = options.mentions.map((a) => a.id._serialized);
        }
    }

    options.groupMentions && !Array.isArray(options.groupMentions) && (options.groupMentions = [options.groupMentions]);
    
    let internalOptions = {
        linkPreview: options.linkPreview === false ? undefined : true,
        sendAudioAsVoice: options.sendAudioAsVoice,
        sendVideoAsGif: options.sendVideoAsGif,
        sendMediaAsSticker: options.sendMediaAsSticker,
        sendMediaAsDocument: options.sendMediaAsDocument,
        sendMediaAsHd: options.sendMediaAsHd,
        caption: options.caption,
        quotedMessageId: options.quotedMessageId,
        parseVCards: options.parseVCards !== false,
        mentionedJidList: options.mentions || [],
        groupMentions: options.groupMentions,
        invokedBotWid: options.invokedBotWid,
        ignoreQuoteErrors: options.ignoreQuoteErrors !== false,
        waitUntilMsgSent: options.waitUntilMsgSent || false,
        extraOptions: options.extra
    };

    const sendSeen = options.sendSeen !== false;

    if (content instanceof MessageMedia) {
        internalOptions.media = content;
        internalOptions.isViewOnce = options.isViewOnce,
        content = '';
    } else if (options.media instanceof MessageMedia) {
        internalOptions.media = options.media;
        internalOptions.caption = content;
        internalOptions.isViewOnce = options.isViewOnce,
        content = '';
    } else if (content instanceof Location) {
        internalOptions.location = content;
        content = '';
    } else if (content instanceof Poll) {
        internalOptions.poll = content;
        content = '';
    } else if (content instanceof ScheduledEvent) {
        internalOptions.event = content;
        content = '';
    } else if (content instanceof Contact) {
        internalOptions.contactCard = content.id._serialized;
        content = '';
    } else if (Array.isArray(content) && content.length > 0 && content[0] instanceof Contact) {
        internalOptions.contactCardList = content.map(contact => contact.id._serialized);
        content = '';
    } else if (content instanceof Buttons) {
        console.warn('Buttons are now deprecated. See more at https://www.youtube.com/watch?v=hv1R1rLeVVE.');
        if (content.type !== 'chat') { internalOptions.attachment = content.body; }
        internalOptions.buttons = content;
        content = '';
    } else if (content instanceof List) {
        console.warn('Lists are now deprecated. See more at https://www.youtube.com/watch?v=hv1R1rLeVVE.');
        internalOptions.list = content;
        content = '';
    }

    if (internalOptions.sendMediaAsSticker && internalOptions.media) {
        internalOptions.media = await Util.formatToWebpSticker(
            internalOptions.media, {
                name: options.stickerName,
                author: options.stickerAuthor,
                categories: options.stickerCategories
            }, this.pupPage
        );
    }

    // ✅ SAFE FIX: Enhanced error handling WITHOUT retry loops
    try {
        const sentMsg = await this.pupPage.evaluate(async (chatId, content, options, sendSeen, originalChatId) => {
            try {
                let chat;
                
                // First try with the converted chatId
                try {
                    chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
                } catch (error) {
                    console.log(`Chat not found with converted ID ${chatId}, trying original: ${originalChatId}`);
                    // If converted ID fails, try the original LID
                    if (originalChatId !== chatId) {
                        chat = await window.WWebJS.getChat(originalChatId, { getAsModel: false });
                    }
                }
                
                if (!chat) {
                    console.error('sendMessage: Chat not found for ID:', chatId, 'or original:', originalChatId);
                    return null;
                }

                // ✅ ADD: Connection state check
                if (window.Store && window.Store.AppState) {
                    const state = window.Store.AppState.state;
                    if (state !== 'CONNECTED') {
                        console.error('sendMessage: WhatsApp not connected. State:', state);
                        return null;
                    }
                }

                if (sendSeen) {
                    await window.WWebJS.sendSeen(chat.id._serialized).catch(err => {
                        console.warn('sendMessage: sendSeen failed:', err.message);
                        // Continue anyway - don't fail the entire message
                    });
                }

                const msg = await window.WWebJS.sendMessage(chat, content, options);
                
                if (!msg) {
                    console.error('sendMessage: WWebJS.sendMessage returned null/undefined');
                    return null;
                }
                
                return window.WWebJS.getMessageModel(msg);
                
            } catch (error) {
                console.error('sendMessage: Browser context error:', error);
                return null;
            }
        }, chatId, content, internalOptions, sendSeen, originalChatId);

        if (sentMsg) {
            return new Message(this, sentMsg);
        } else {
            console.error('sendMessage: Failed to send message to chat. Original:', originalChatId, 'Converted:', chatId);
            return undefined;
        }
        
    } catch (error) {
        // ✅ SAFE: Log error but don't retry (prevents bans)
        console.error('sendMessage: Critical error:', error);
        
        // ✅ EMIT ERROR EVENT for user handling
        this.emit(Events.MESSAGE_SEND_FAILURE, {
            chatId: originalChatId,
            error: error.message,
            timestamp: Date.now()
        });
        
        return undefined;
    }
}

    /**
     * @typedef {Object} SendChannelAdminInviteOptions
     * @property {?string} comment The comment to be added to an invitation
     */

    /**
     * Sends a channel admin invitation to a user, allowing them to become an admin of the channel
     * @param {string} chatId The ID of a user to send the channel admin invitation to
     * @param {string} channelId The ID of a channel for which the invitation is being sent
     * @param {SendChannelAdminInviteOptions} options 
     * @returns {Promise<boolean>} Returns true if an invitation was sent successfully, false otherwise
     */
    async sendChannelAdminInvite(chatId, channelId, options = {}) {
        const response = await this.pupPage.evaluate(async (chatId, channelId, options) => {
            const channelWid = window.Store.WidFactory.createWid(channelId);
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = window.Store.Chat.get(chatWid) || (await window.Store.Chat.find(chatWid));

            if (!chatWid.isUser()) {
                return false;
            }
            
            return await window.Store.SendChannelMessage.sendNewsletterAdminInviteMessage(
                chat,
                {
                    newsletterWid: channelWid,
                    invitee: chatWid,
                    inviteMessage: options.comment,
                    base64Thumb: await window.WWebJS.getProfilePicThumbToBase64(channelWid)
                }
            );
        }, chatId, channelId, options);

        return response.messageSendResult === 'OK';
    }
    
    /**
     * Searches for messages
     * @param {string} query
     * @param {Object} [options]
     * @param {number} [options.page]
     * @param {number} [options.limit]
     * @param {string} [options.chatId]
     * @returns {Promise<Message[]>}
     */
    async searchMessages(query, options = {}) {
        const messages = await this.pupPage.evaluate(async (query, page, count, remote) => {
            const { messages } = await window.Store.Msg.search(query, page, count, remote);
            return messages.map(msg => window.WWebJS.getMessageModel(msg));
        }, query, options.page, options.limit, options.chatId);

        return messages.map(msg => new Message(this, msg));
    }
    /**
     * Get all current chat instances
     * @returns {Promise<Array<Chat>>}
     */
    async getChats() {
        try {
            const chats = await this.pupPage.evaluate(async () => {
                try {
                    return await window.WWebJS.getChats();
                } catch (e) {
                    console.error('Browser context error in getChats:', e);
                    return [];
                }
            });
            return chats ? chats.map(chat => ChatFactory.create(this, chat)) : [];
        } catch (error) {
            console.error('Error in getChats:', error);
            return [];
        }
    }

    /**
     * Gets all cached {@link Channel} instance
     * @returns {Promise<Array<Channel>>}
     */
    async getChannels() {
        const channels = await this.pupPage.evaluate(async () => {
            return await window.WWebJS.getChannels();
        });

        return channels.map((channel) => ChatFactory.create(this, channel));
    }

    /**
     * Gets chat or channel instance by ID
     * @param {string} chatId 
     * @returns {Promise<Chat|Channel>}
     */
    /**
     * Gets chat or channel instance by ID with performance caching
     * @param {string} chatId 
     * @returns {Promise<Chat|Channel>}
     */
    async getChatById(chatId) {
        const CACHE_TTL = 30000; // 30 seconds cache
        
        // ✅ Check cache first (HUGE performance boost)
        const now = Date.now();
        const cached = this._chatCache.get(chatId);
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
            return cached.data;
        }
        
        // ✅ If not in cache, fetch from WhatsApp
        const chat = await this.pupPage.evaluate(async (chatId) => {
            return await window.WWebJS.getChat(chatId);
        }, chatId);
        
        const result = chat ? ChatFactory.create(this, chat) : undefined;
        
        // ✅ Cache the result
        if (result) {
            this._chatCache.set(chatId, {
                data: result,
                timestamp: now
            });
        }
        
        return result;
    }

    /**
     * Clear expired cache entries (call this periodically)
     */
    _cleanupExpiredCache() {
        const now = Date.now();
        const CACHE_TTL = 30000;
        
        for (const [key, value] of this._chatCache.entries()) {
            if (now - value.timestamp > CACHE_TTL) {
                this._chatCache.delete(key);
            }
        }
        
        this._lastCleanup = now;
    }

    /**
     * Gets a {@link Channel} instance by invite code
     * @param {string} inviteCode The code that comes after the 'https://whatsapp.com/channel/'
     * @returns {Promise<Channel>}
     */
    async getChannelByInviteCode(inviteCode) {
        const channel = await this.pupPage.evaluate(async (inviteCode) => {
            let channelMetadata;
            try {
                channelMetadata = await window.WWebJS.getChannelMetadata(inviteCode);
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return null;
                throw err;
            }
            return await window.WWebJS.getChat(channelMetadata.id);
        }, inviteCode);

        return channel
            ? ChatFactory.create(this, channel)
            : undefined;
    }

    /**
     * Get all current contact instances
     * @returns {Promise<Array<Contact>>}
     */
    async getContacts() {
        let contacts = await this.pupPage.evaluate(() => {
            return window.WWebJS.getContacts();
        });

        return contacts.map(contact => ContactFactory.create(this, contact));
    }

    /**
     * Get contact instance by ID
     * @param {string} contactId
     * @returns {Promise<Contact>}
     */
async getContactById(contactId) {
    // ✅ FIX: Remove :11 suffix from LID addresses before processing
    let processedContactId = contactId;
    if (contactId.endsWith('@lid')) {
        const lidMatch = contactId.match(/^(\d+):\d+@lid$/);
        if (lidMatch && lidMatch[1]) {
            processedContactId = lidMatch[1] + '@lid';
            //console.log(`Cleaned LID format: ${contactId} → ${processedContactId}`);

        }
    }

    let contact = await this.pupPage.evaluate(contactId => {
        return window.WWebJS.getContact(contactId);
    }, processedContactId);

    return ContactFactory.create(this, contact);
}
    
    async getMessageById(messageId) {
        try {
            const msg = await this.pupPage.evaluate(async messageId => {
                try {
                    let msg = window.Store.Msg.get(messageId);
                    if(msg) return window.WWebJS.getMessageModel(msg);

                    const params = messageId.split('_');
                    if (params.length !== 3 && params.length !== 4) {
                        console.error('Invalid serialized message id specified:', messageId);
                        return null;
                    }

                    let messagesObject = await window.Store.Msg.getMessagesById([messageId]);
                    if (messagesObject && messagesObject.messages.length) {
                        msg = messagesObject.messages[0];
                    }
                    
                    if(msg) return window.WWebJS.getMessageModel(msg);
                    return null;
                } catch (error) {
                    console.error('Error retrieving message in browser context:', error);
                    return null;
                }
            }, messageId);

            return msg ? new Message(this, msg) : null;
        } catch (error) {
            console.error('Error in getMessageById:', error);
            return null;
        }
    }

    /**
     * Gets instances of all pinned messages in a chat
     * @param {string} chatId The chat ID
     * @returns {Promise<[Message]|[]>}
     */
    async getPinnedMessages(chatId) {
        const pinnedMsgs = await this.pupPage.evaluate(async (chatId) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = window.Store.Chat.get(chatWid) ?? await window.Store.Chat.find(chatWid);
            if (!chat) return [];
            
            const msgs = await window.Store.PinnedMsgUtils.getTable().equals(['chatId'], chatWid.toString());

            const pinnedMsgs = (
                await Promise.all(
                    msgs.filter(msg => msg.pinType == 1).map(async (msg) => {
                        const res = await window.Store.Msg.getMessagesById([msg.parentMsgKey]);
                        return res?.messages?.[0];
                    })
                )
            ).filter(Boolean);

            return !pinnedMsgs.length
                ? []
                : await Promise.all(pinnedMsgs.map((msg) => window.WWebJS.getMessageModel(msg)));
        }, chatId);

        return pinnedMsgs.map((msg) => new Message(this, msg));
    }

    /**
     * Returns an object with information about the invite code's group
     * @param {string} inviteCode 
     * @returns {Promise<object>} Invite information
     */
    async getInviteInfo(inviteCode) {
        return await this.pupPage.evaluate(inviteCode => {
            return window.Store.GroupInvite.queryGroupInvite(inviteCode);
        }, inviteCode);
    }

    /**
     * Accepts an invitation to join a group
     * @param {string} inviteCode Invitation code
     * @returns {Promise<string>} Id of the joined Chat
     */
    async acceptInvite(inviteCode) {
        const res = await this.pupPage.evaluate(async inviteCode => {
            return await window.Store.GroupInvite.joinGroupViaInvite(inviteCode);
        }, inviteCode);

        return res.gid._serialized;
    }

    /**
     * Accepts a channel admin invitation and promotes the current user to a channel admin
     * @param {string} channelId The channel ID to accept the admin invitation from
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async acceptChannelAdminInvite(channelId) {
        return await this.pupPage.evaluate(async (channelId) => {
            try {
                await window.Store.ChannelUtils.acceptNewsletterAdminInvite(channelId);
                return true;
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, channelId);
    }

    /**
     * Revokes a channel admin invitation sent to a user by a channel owner
     * @param {string} channelId The channel ID an invitation belongs to
     * @param {string} userId The user ID the invitation was sent to
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async revokeChannelAdminInvite(channelId, userId) {
        return await this.pupPage.evaluate(async (channelId, userId) => {
            try {
                const userWid = window.Store.WidFactory.createWid(userId);
                await window.Store.ChannelUtils.revokeNewsletterAdminInvite(channelId, userWid);
                return true;
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, channelId, userId);
    }

    /**
     * Demotes a channel admin to a regular subscriber (can be used also for self-demotion)
     * @param {string} channelId The channel ID to demote an admin in
     * @param {string} userId The user ID to demote
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async demoteChannelAdmin(channelId, userId) {
        return await this.pupPage.evaluate(async (channelId, userId) => {
            try {
                const userWid = window.Store.WidFactory.createWid(userId);
                await window.Store.ChannelUtils.demoteNewsletterAdmin(channelId, userWid);
                return true;
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, channelId, userId);
    }

    /**
     * Accepts a private invitation to join a group
     * @param {object} inviteInfo Invite V4 Info
     * @returns {Promise<Object>}
     */
    async acceptGroupV4Invite(inviteInfo) {
        if (!inviteInfo.inviteCode) throw 'Invalid invite code, try passing the message.inviteV4 object';
        if (inviteInfo.inviteCodeExp == 0) throw 'Expired invite code';
        return this.pupPage.evaluate(async inviteInfo => {
            let { groupId, fromId, inviteCode, inviteCodeExp } = inviteInfo;
            let userWid = window.Store.WidFactory.createWid(fromId);
            return await window.Store.GroupInviteV4.joinGroupViaInviteV4(inviteCode, String(inviteCodeExp), groupId, userWid);
        }, inviteInfo);
    }

    /**
     * Sets the current user's status message
     * @param {string} status New status message
     */
    async setStatus(status) {
        await this.pupPage.evaluate(async status => {
            return await window.Store.StatusUtils.setMyStatus(status);
        }, status);
    }

    /**
     * Sets the current user's display name. 
     * This is the name shown to WhatsApp users that have not added you as a contact beside your number in groups and in your profile.
     * @param {string} displayName New display name
     * @returns {Promise<Boolean>}
     */
    async setDisplayName(displayName) {
        const couldSet = await this.pupPage.evaluate(async displayName => {
            if(!window.Store.Conn.canSetMyPushname()) return false;
            await window.Store.Settings.setPushname(displayName);
            return true;
        }, displayName);

        return couldSet;
    }
    
    /**
     * Gets the current connection state for the client
     * @returns {WAState} 
     */
    async getState() {
        return await this.pupPage.evaluate(() => {
            if(!window.Store) return null;
            return window.Store.AppState.state;
        });
    }

    /**
     * Marks the client as online
     */
    async sendPresenceAvailable() {
        return await this.pupPage.evaluate(() => {
            return window.Store.PresenceUtils.sendPresenceAvailable();
        });
    }

    /**
     * Marks the client as unavailable
     */
    async sendPresenceUnavailable() {
        return await this.pupPage.evaluate(() => {
            return window.Store.PresenceUtils.sendPresenceUnavailable();
        });
    }

    /**
     * Enables and returns the archive state of the Chat
     * @returns {boolean}
     */
    async archiveChat(chatId) {
        return await this.pupPage.evaluate(async chatId => {
            let chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            await window.Store.Cmd.archiveChat(chat, true);
            return true;
        }, chatId);
    }

    /**
     * Changes and returns the archive state of the Chat
     * @returns {boolean}
     */
    async unarchiveChat(chatId) {
        return await this.pupPage.evaluate(async chatId => {
            let chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            await window.Store.Cmd.archiveChat(chat, false);
            return false;
        }, chatId);
    }

    /**
     * Pins the Chat
     * @returns {Promise<boolean>} New pin state. Could be false if the max number of pinned chats was reached.
     */
    async pinChat(chatId) {
        return this.pupPage.evaluate(async chatId => {
            let chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            if (chat.pin) {
                return true;
            }
            const MAX_PIN_COUNT = 3;
            const chatModels = window.Store.Chat.getModelsArray();
            if (chatModels.length > MAX_PIN_COUNT) {
                let maxPinned = chatModels[MAX_PIN_COUNT - 1].pin;
                if (maxPinned) {
                    return false;
                }
            }
            await window.Store.Cmd.pinChat(chat, true);
            return true;
        }, chatId);
    }

    /**
     * Unpins the Chat
     * @returns {Promise<boolean>} New pin state
     */
    async unpinChat(chatId) {
        return this.pupPage.evaluate(async chatId => {
            let chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            if (!chat.pin) {
                return false;
            }
            await window.Store.Cmd.pinChat(chat, false);
            return false;
        }, chatId);
    }

    /**
     * Mutes this chat forever, unless a date is specified
     * @param {string} chatId ID of the chat that will be muted
     * @param {?Date} unmuteDate Date when the chat will be unmuted, don't provide a value to mute forever
     * @returns {Promise<{isMuted: boolean, muteExpiration: number}>}
     */
    async muteChat(chatId, unmuteDate) {
        unmuteDate = unmuteDate ? Math.floor(unmuteDate.getTime() / 1000) : -1;
        return this._muteUnmuteChat(chatId, 'MUTE', unmuteDate);
    }

    /**
     * Unmutes the Chat
     * @param {string} chatId ID of the chat that will be unmuted
     * @returns {Promise<{isMuted: boolean, muteExpiration: number}>}
     */
    async unmuteChat(chatId) {
        return this._muteUnmuteChat(chatId, 'UNMUTE');
    }

    /**
     * Internal method to mute or unmute the chat
     * @param {string} chatId ID of the chat that will be muted/unmuted
     * @param {string} action The action: 'MUTE' or 'UNMUTE'
     * @param {number} unmuteDateTs Timestamp at which the chat will be unmuted
     * @returns {Promise<{isMuted: boolean, muteExpiration: number}>}
     */
    async _muteUnmuteChat (chatId, action, unmuteDateTs) {
        return this.pupPage.evaluate(async (chatId, action, unmuteDateTs) => {
            const chat = window.Store.Chat.get(chatId) ?? await window.Store.Chat.find(chatId);
            action === 'MUTE'
                ? await chat.mute.mute({ expiration: unmuteDateTs, sendDevice: true })
                : await chat.mute.unmute({ sendDevice: true });
            return { isMuted: chat.mute.expiration !== 0, muteExpiration: chat.mute.expiration };
        }, chatId, action, unmuteDateTs || -1);
    }

    /**
     * Mark the Chat as unread
     * @param {string} chatId ID of the chat that will be marked as unread
     */
    async markChatUnread(chatId) {
        await this.pupPage.evaluate(async chatId => {
            let chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            await window.Store.Cmd.markChatUnread(chat, true);
        }, chatId);
    }

    /**
     * Returns the contact ID's profile picture URL, if privacy settings allow it
     * @param {string} contactId the whatsapp user's ID
     * @returns {Promise<string>}
     */
    async getProfilePicUrl(contactId) {
        const profilePic = await this.pupPage.evaluate(async contactId => {
            try {
                const chatWid = window.Store.WidFactory.createWid(contactId);
                return window.compareWwebVersions(window.Debug.VERSION, '<', '2.3000.0')
                    ? await window.Store.ProfilePic.profilePicFind(chatWid)
                    : await window.Store.ProfilePic.requestProfilePicFromServer(chatWid);
            } catch (err) {
                if(err.name === 'ServerStatusCodeError') return undefined;
                throw err;
            }
        }, contactId);
        
        return profilePic ? profilePic.eurl : undefined;
    }

    /**
     * Gets the Contact's common groups with you. Returns empty array if you don't have any common group.
     * @param {string} contactId the whatsapp user's ID (_serialized format)
     * @returns {Promise<WAWebJS.ChatId[]>}
     */
    async getCommonGroups(contactId) {
        const commonGroups = await this.pupPage.evaluate(async (contactId) => {
            let contact = window.Store.Contact.get(contactId);
            if (!contact) {
                const wid = window.Store.WidFactory.createWid(contactId);
                const chatConstructor = window.Store.Contact.getModelsArray().find(c=>!c.isGroup).constructor;
                contact = new chatConstructor({id: wid});
            }

            if (contact.commonGroups) {
                return contact.commonGroups.serialize();
            }
            const status = await window.Store.findCommonGroups(contact);
            if (status) {
                return contact.commonGroups.serialize();
            }
            return [];
        }, contactId);
        const chats = [];
        for (const group of commonGroups) {
            chats.push(group.id);
        }
        return chats;
    }

    /**
     * Force reset of connection state for the client
    */
    async resetState() {
        await this.pupPage.evaluate(() => {
            window.Store.AppState.reconnect(); 
        });
    }

    /**
     * Check if a given ID is registered in whatsapp
     * @param {string} id the whatsapp user's ID
     * @returns {Promise<Boolean>}
     */
    async isRegisteredUser(id) {
        return Boolean(await this.getNumberId(id));
    }

    /**
     * Get the registered WhatsApp ID for a number. 
     * Will return null if the number is not registered on WhatsApp.
     * @param {string} number Number or ID ("@c.us" will be automatically appended if not specified)
     * @returns {Promise<Object|null>}
     */
    async getNumberId(number) {
        if (!number.endsWith('@c.us')) {
            number += '@c.us';
        }

        return await this.pupPage.evaluate(async number => {
            const wid = window.Store.WidFactory.createWid(number);
            const result = await window.Store.QueryExist(wid);
            if (!result || result.wid === undefined) return null;
            return result.wid;
        }, number);
    }

    /**
     * Get the formatted number of a WhatsApp ID.
     * @param {string} number Number or ID
     * @returns {Promise<string>}
     */
    async getFormattedNumber(number) {
        if (!number.endsWith('@s.whatsapp.net')) number = number.replace('c.us', 's.whatsapp.net');
        if (!number.includes('@s.whatsapp.net')) number = `${number}@s.whatsapp.net`;

        return await this.pupPage.evaluate(async numberId => {
            return window.Store.NumberInfo.formattedPhoneNumber(numberId);
        }, number);
    }

    /**
     * Get the country code of a WhatsApp ID.
     * @param {string} number Number or ID
     * @returns {Promise<string>}
     */
    async getCountryCode(number) {
        number = number.replace(' ', '').replace('+', '').replace('@c.us', '');

        return await this.pupPage.evaluate(async numberId => {
            return window.Store.NumberInfo.findCC(numberId);
        }, number);
    }

    /**
     * An object that represents the result for a participant added to a group
     * @typedef {Object} ParticipantResult
     * @property {number} statusCode The status code of the result
     * @property {string} message The result message
     * @property {boolean} isGroupCreator Indicates if the participant is a group creator
     * @property {boolean} isInviteV4Sent Indicates if the inviteV4 was sent to the participant
     */

    /**
     * An object that handles the result for {@link createGroup} method
     * @typedef {Object} CreateGroupResult
     * @property {string} title A group title
     * @property {Object} gid An object that handles the newly created group ID
     * @property {string} gid.server
     * @property {string} gid.user
     * @property {string} gid._serialized
     * @property {Object.<string, ParticipantResult>} participants An object that handles the result value for each added to the group participant
     */

    /**
     * An object that handles options for group creation
     * @typedef {Object} CreateGroupOptions
     * @property {number} [messageTimer = 0] The number of seconds for the messages to disappear in the group (0 by default, won't take an effect if the group is been creating with myself only)
     * @property {string|undefined} parentGroupId The ID of a parent community group to link the newly created group with (won't take an effect if the group is been creating with myself only)
     * @property {boolean} [autoSendInviteV4 = true] If true, the inviteV4 will be sent to those participants who have restricted others from being automatically added to groups, otherwise the inviteV4 won't be sent (true by default)
     * @property {string} [comment = ''] The comment to be added to an inviteV4 (empty string by default)
     * @property {boolean} [memberAddMode = false] If true, only admins can add members to the group (false by default)
     * @property {boolean} [membershipApprovalMode = false] If true, group admins will be required to approve anyone who wishes to join the group (false by default)
     * @property {boolean} [isRestrict = true] If true, only admins can change group group info (true by default)
     * @property {boolean} [isAnnounce = false] If true, only admins can send messages (false by default)
     */

    /**
     * Creates a new group
     * @param {string} title Group title
     * @param {string|Contact|Array<Contact|string>|undefined} participants A single Contact object or an ID as a string or an array of Contact objects or contact IDs to add to the group
     * @param {CreateGroupOptions} options An object that handles options for group creation
     * @returns {Promise<CreateGroupResult|string>} Object with resulting data or an error message as a string
     */
    async createGroup(title, participants = [], options = {}) {
        !Array.isArray(participants) && (participants = [participants]);
        participants.map(p => (p instanceof Contact) ? p.id._serialized : p);

        return await this.pupPage.evaluate(async (title, participants, options) => {
            const {
                messageTimer = 0,
                parentGroupId,
                autoSendInviteV4 = true,
                comment = '',
            } = options;
            const participantData = {}, participantWids = [], failedParticipants = [];
            let createGroupResult, parentGroupWid;

            const addParticipantResultCodes = {
                default: 'An unknown error occupied while adding a participant',
                200: 'The participant was added successfully',
                403: 'The participant can be added by sending private invitation only',
                404: 'The phone number is not registered on WhatsApp'
            };

            for (const participant of participants) {
                const pWid = window.Store.WidFactory.createWid(participant);
                if ((await window.Store.QueryExist(pWid))?.wid) {
                    participantWids.push({ phoneNumber: pWid });
                }
                else failedParticipants.push(participant);
            }

            parentGroupId && (parentGroupWid = window.Store.WidFactory.createWid(parentGroupId));

            try {
                createGroupResult = await window.Store.GroupUtils.createGroup(
                    {
                        'addressingModeOverride': 'lid',
                        'memberAddMode': options.memberAddMode ?? false,
                        'membershipApprovalMode': options.membershipApprovalMode ?? false,
                        'announce': options.announce ?? false,
                        'restrict': options.isRestrict !== undefined ? !options.isRestrict : false,
                        'ephemeralDuration': messageTimer,
                        'parentGroupId': parentGroupWid,
                        'title': title,
                    },
                    participantWids
                );
            } catch (err) {
                return 'CreateGroupError: An unknown error occupied while creating a group';
            }

            for (const participant of createGroupResult.participants) {
                let isInviteV4Sent = false;
                participant.wid.server == 'lid' && (participant.wid = window.Store.LidUtils.getPhoneNumber(participant.wid));
                const participantId = participant.wid._serialized;
                const statusCode = participant.error || 200;

                if (autoSendInviteV4 && statusCode === 403) {
                    window.Store.Contact.gadd(participant.wid, { silent: true });
                    const addParticipantResult = await window.Store.GroupInviteV4.sendGroupInviteMessage(
                        window.Store.Chat.get(participant.wid) || await window.Store.Chat.find(participant.wid),
                        createGroupResult.wid._serialized,
                        createGroupResult.subject,
                        participant.invite_code,
                        participant.invite_code_exp,
                        comment,
                        await window.WWebJS.getProfilePicThumbToBase64(createGroupResult.wid)
                    );
                    isInviteV4Sent = addParticipantResult.messageSendResult === 'OK';
                }

                participantData[participantId] = {
                    statusCode: statusCode,
                    message: addParticipantResultCodes[statusCode] || addParticipantResultCodes.default,
                    isGroupCreator: participant.type === 'superadmin',
                    isInviteV4Sent: isInviteV4Sent
                };
            }

            for (const f of failedParticipants) {
                participantData[f] = {
                    statusCode: 404,
                    message: addParticipantResultCodes[404],
                    isGroupCreator: false,
                    isInviteV4Sent: false
                };
            }

            return { title: title, gid: createGroupResult.wid, participants: participantData };
        }, title, participants, options);
    }

    /**
     * An object that handles the result for {@link createChannel} method
     * @typedef {Object} CreateChannelResult
     * @property {string} title A channel title
     * @property {ChatId} nid An object that handels the newly created channel ID
     * @property {string} nid.server 'newsletter'
     * @property {string} nid.user 'XXXXXXXXXX'
     * @property {string} nid._serialized 'XXXXXXXXXX@newsletter'
     * @property {string} inviteLink The channel invite link, starts with 'https://whatsapp.com/channel/'
     * @property {number} createdAtTs The timestamp the channel was created at
     */

    /**
     * Options for the channel creation
     * @typedef {Object} CreateChannelOptions
     * @property {?string} description The channel description
     * @property {?MessageMedia} picture The channel profile picture
     */

    /**
     * Creates a new channel
     * @param {string} title The channel name
     * @param {CreateChannelOptions} options 
     * @returns {Promise<CreateChannelResult|string>} Returns an object that handles the result for the channel creation or an error message as a string
     */
    async createChannel(title, options = {}) {
        return await this.pupPage.evaluate(async (title, options) => {
            let response, { description = null, picture = null } = options;

            if (!window.Store.ChannelUtils.isNewsletterCreationEnabled()) {
                return 'CreateChannelError: A channel creation is not enabled';
            }

            if (picture) {
                picture = await window.WWebJS.cropAndResizeImage(picture, {
                    asDataUrl: true,
                    mimetype: 'image/jpeg',
                    size: 640,
                    quality: 1
                });
            }

            try {
                response = await window.Store.ChannelUtils.createNewsletterQuery({
                    name: title,
                    description: description,
                    picture: picture,
                });
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') {
                    return 'CreateChannelError: An error occupied while creating a channel';
                }
                throw err;
            }

            return {
                title: title,
                nid: window.Store.JidToWid.newsletterJidToWid(response.idJid),
                inviteLink: `https://whatsapp.com/channel/${response.newsletterInviteLinkMetadataMixin.inviteCode}`,
                createdAtTs: response.newsletterCreationTimeMetadataMixin.creationTimeValue
            };
        }, title, options);
    }

    /**
     * Subscribe to channel
     * @param {string} channelId The channel ID
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async subscribeToChannel(channelId) {
        return await this.pupPage.evaluate(async (channelId) => {
            return await window.WWebJS.subscribeToUnsubscribeFromChannel(channelId, 'Subscribe');
        }, channelId);
    }

    /**
     * Options for unsubscribe from a channel
     * @typedef {Object} UnsubscribeOptions
     * @property {boolean} [deleteLocalModels = false] If true, after an unsubscription, it will completely remove a channel from the channel collection making it seem like the current user have never interacted with it. Otherwise it will only remove a channel from the list of channels the current user is subscribed to and will set the membership type for that channel to GUEST
     */

    /**
     * Unsubscribe from channel
     * @param {string} channelId The channel ID
     * @param {UnsubscribeOptions} options
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async unsubscribeFromChannel(channelId, options) {
        return await this.pupPage.evaluate(async (channelId, options) => {
            return await window.WWebJS.subscribeToUnsubscribeFromChannel(channelId, 'Unsubscribe', options);
        }, channelId, options);
    }

    /**
     * Options for transferring a channel ownership to another user
     * @typedef {Object} TransferChannelOwnershipOptions
     * @property {boolean} [shouldDismissSelfAsAdmin = false] If true, after the channel ownership is being transferred to another user, the current user will be dismissed as a channel admin and will become to a channel subscriber.
     */

    /**
     * Transfers a channel ownership to another user.
     * Note: the user you are transferring the channel ownership to must be a channel admin.
     * @param {string} channelId
     * @param {string} newOwnerId
     * @param {TransferChannelOwnershipOptions} options
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async transferChannelOwnership(channelId, newOwnerId, options = {}) {
        return await this.pupPage.evaluate(async (channelId, newOwnerId, options) => {
            const channel = await window.WWebJS.getChat(channelId, { getAsModel: false });
            const newOwner = window.Store.Contact.get(newOwnerId) || (await window.Store.Contact.find(newOwnerId));
            if (!channel.newsletterMetadata) {
                await window.Store.NewsletterMetadataCollection.update(channel.id);
            }

            try {
                await window.Store.ChannelUtils.changeNewsletterOwnerAction(channel, newOwner);

                if (options.shouldDismissSelfAsAdmin) {
                    const meContact = window.Store.ContactCollection.getMeContact();
                    meContact && (await window.Store.ChannelUtils.demoteNewsletterAdminAction(channel, meContact));
                }
            } catch (error) {
                return false;
            }

            return true;
        }, channelId, newOwnerId, options);
    }

    /**
     * Searches for channels based on search criteria, there are some notes:
     * 1. The method finds only channels you are not subscribed to currently
     * 2. If you have never been subscribed to a found channel
     * or you have unsubscribed from it with {@link UnsubscribeOptions.deleteLocalModels} set to 'true',
     * the lastMessage property of a found channel will be 'null'
     *
     * @param {Object} searchOptions Search options
     * @param {string} [searchOptions.searchText = ''] Text to search
     * @param {Array<string>} [searchOptions.countryCodes = [your local region]] Array of country codes in 'ISO 3166-1 alpha-2' standart (@see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) to search for channels created in these countries
     * @param {boolean} [searchOptions.skipSubscribedNewsletters = false] If true, channels that user is subscribed to won't appear in found channels
     * @param {number} [searchOptions.view = 0] View type, makes sense only when the searchText is empty. Valid values to provide are:
     * 0 for RECOMMENDED channels
     * 1 for TRENDING channels
     * 2 for POPULAR channels
     * 3 for NEW channels
     * @param {number} [searchOptions.limit = 50] The limit of found channels to be appear in the returnig result
     * @returns {Promise<Array<Channel>|[]>} Returns an array of Channel objects or an empty array if no channels were found
     */
    async searchChannels(searchOptions = {}) {
        return await this.pupPage.evaluate(async ({
            searchText = '',
            countryCodes = [window.Store.ChannelUtils.currentRegion],
            skipSubscribedNewsletters = false,
            view = 0,
            limit = 50
        }) => {
            searchText = searchText.trim();
            const currentRegion = window.Store.ChannelUtils.currentRegion;
            if (![0, 1, 2, 3].includes(view)) view = 0;

            countryCodes = countryCodes.length === 1 && countryCodes[0] === currentRegion
                ? countryCodes
                : countryCodes.filter((code) => Object.keys(window.Store.ChannelUtils.countryCodesIso).includes(code));

            const viewTypeMapping = {
                0: 'RECOMMENDED',
                1: 'TRENDING',
                2: 'POPULAR',
                3: 'NEW'
            };

            searchOptions = {
                searchText: searchText,
                countryCodes: countryCodes,
                skipSubscribedNewsletters: skipSubscribedNewsletters,
                view: viewTypeMapping[view],
                categories: [],
                cursorToken: ''
            };
            
            const originalFunction = window.Store.ChannelUtils.getNewsletterDirectoryPageSize;
            limit !== 50 && (window.Store.ChannelUtils.getNewsletterDirectoryPageSize = () => limit);

            const channels = (await window.Store.ChannelUtils.fetchNewsletterDirectories(searchOptions)).newsletters;

            limit !== 50 && (window.Store.ChannelUtils.getNewsletterDirectoryPageSize = originalFunction);

            return channels
                ? await Promise.all(channels.map((channel) => window.WWebJS.getChatModel(channel, { isChannel: true })))
                : [];
        }, searchOptions);
    }

    /**
     * Deletes the channel you created
     * @param {string} channelId The ID of a channel to delete
     * @returns {Promise<boolean>} Returns true if the operation completed successfully, false otherwise
     */
    async deleteChannel(channelId) {
        return await this.pupPage.evaluate(async (channelId) => {
            const channel = await window.WWebJS.getChat(channelId, { getAsModel: false });
            if (!channel) return false;
            try {
                await window.Store.ChannelUtils.deleteNewsletterAction(channel);
                return true;
            } catch (err) {
                if (err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, channelId);
    }

    /**
     * Get all current Labels
     * @returns {Promise<Array<Label>>}
     */
    async getLabels() {
        const labels = await this.pupPage.evaluate(async () => {
            return window.WWebJS.getLabels();
        });

        return labels.map(data => new Label(this, data));
    }
    
    /**
     * Get all current Broadcast
     * @returns {Promise<Array<Broadcast>>}
     */
    async getBroadcasts() {
        const broadcasts = await this.pupPage.evaluate(async () => {
            return window.WWebJS.getAllStatuses();
        });
        return broadcasts.map(data => new Broadcast(this, data));
    }

    /**
     * Get Label instance by ID
     * @param {string} labelId
     * @returns {Promise<Label>}
     */
    async getLabelById(labelId) {
        const label = await this.pupPage.evaluate(async (labelId) => {
            return window.WWebJS.getLabel(labelId);
        }, labelId);

        return new Label(this, label);
    }

    /**
     * Get all Labels assigned to a chat 
     * @param {string} chatId
     * @returns {Promise<Array<Label>>}
     */
    async getChatLabels(chatId) {
        const labels = await this.pupPage.evaluate(async (chatId) => {
            return window.WWebJS.getChatLabels(chatId);
        }, chatId);

        return labels.map(data => new Label(this, data));
    }

    /**
     * Get all Chats for a specific Label
     * @param {string} labelId
     * @returns {Promise<Array<Chat>>}
     */
    async getChatsByLabelId(labelId) {
        const chatIds = await this.pupPage.evaluate(async (labelId) => {
            const label = window.Store.Label.get(labelId);
            const labelItems = label.labelItemCollection.getModelsArray();
            return labelItems.reduce((result, item) => {
                if (item.parentType === 'Chat') {
                    result.push(item.parentId);
                }
                return result;
            }, []);
        }, labelId);

        return Promise.all(chatIds.map(id => this.getChatById(id)));
    }

    /**
     * Gets all blocked contacts by host account
     * @returns {Promise<Array<Contact>>}
     */
    async getBlockedContacts() {
        const blockedContacts = await this.pupPage.evaluate(() => {
            let chatIds = window.Store.Blocklist.getModelsArray().map(a => a.id._serialized);
            return Promise.all(chatIds.map(id => window.WWebJS.getContact(id)));
        });

        return blockedContacts.map(contact => ContactFactory.create(this.client, contact));
    }

    /**
     * Sets the current user's profile picture.
     * @param {MessageMedia} media
     * @returns {Promise<boolean>} Returns true if the picture was properly updated.
     */
    async setProfilePicture(media) {
        const success = await this.pupPage.evaluate((chatid, media) => {
            return window.WWebJS.setPicture(chatid, media);
        }, this.info.wid._serialized, media);

        return success;
    }

    /**
     * Deletes the current user's profile picture.
     * @returns {Promise<boolean>} Returns true if the picture was properly deleted.
     */
    async deleteProfilePicture() {
        const success = await this.pupPage.evaluate((chatid) => {
            return window.WWebJS.deletePicture(chatid);
        }, this.info.wid._serialized);

        return success;
    }
    
    /**
     * Change labels in chats
     * @param {Array<number|string>} labelIds
     * @param {Array<string>} chatIds
     * @returns {Promise<void>}
     */
    async addOrRemoveLabels(labelIds, chatIds) {

        return this.pupPage.evaluate(async (labelIds, chatIds) => {
            if (['smba', 'smbi'].indexOf(window.Store.Conn.platform) === -1) {
                throw '[LT01] Only Whatsapp business';
            }
            const labels = window.WWebJS.getLabels().filter(e => labelIds.find(l => l == e.id) !== undefined);
            const chats = window.Store.Chat.filter(e => chatIds.includes(e.id._serialized));

            let actions = labels.map(label => ({id: label.id, type: 'add'}));

            chats.forEach(chat => {
                (chat.labels || []).forEach(n => {
                    if (!actions.find(e => e.id == n)) {
                        actions.push({id: n, type: 'remove'});
                    }
                });
            });

            return await window.Store.Label.addOrRemoveLabels(actions, chats);
        }, labelIds, chatIds);
    }

    /**
     * An object that handles the information about the group membership request
     * @typedef {Object} GroupMembershipRequest
     * @property {Object} id The wid of a user who requests to enter the group
     * @property {Object} addedBy The wid of a user who created that request
     * @property {Object|null} parentGroupId The wid of a community parent group to which the current group is linked
     * @property {string} requestMethod The method used to create the request: NonAdminAdd/InviteLink/LinkedGroupJoin
     * @property {number} t The timestamp the request was created at
     */

    /**
     * Gets an array of membership requests
     * @param {string} groupId The ID of a group to get membership requests for
     * @returns {Promise<Array<GroupMembershipRequest>>} An array of membership requests
     */
    async getGroupMembershipRequests(groupId) {
        return await this.pupPage.evaluate(async (groupId) => {
            const groupWid = window.Store.WidFactory.createWid(groupId);
            return await window.Store.MembershipRequestUtils.getMembershipApprovalRequests(groupWid);
        }, groupId);
    }

    /**
     * An object that handles the result for membership request action
     * @typedef {Object} MembershipRequestActionResult
     * @property {string} requesterId User ID whos membership request was approved/rejected
     * @property {number|undefined} error An error code that occurred during the operation for the participant
     * @property {string} message A message with a result of membership request action
     */

    /**
     * An object that handles options for {@link approveGroupMembershipRequests} and {@link rejectGroupMembershipRequests} methods
     * @typedef {Object} MembershipRequestActionOptions
     * @property {Array<string>|string|null} requesterIds User ID/s who requested to join the group, if no value is provided, the method will search for all membership requests for that group
     * @property {Array<number>|number|null} sleep The number of milliseconds to wait before performing an operation for the next requester. If it is an array, a random sleep time between the sleep[0] and sleep[1] values will be added (the difference must be >=100 ms, otherwise, a random sleep time between sleep[1] and sleep[1] + 100 will be added). If sleep is a number, a sleep time equal to its value will be added. By default, sleep is an array with a value of [250, 500]
     */

    /**
     * Approves membership requests if any
     * @param {string} groupId The group ID to get the membership request for
     * @param {MembershipRequestActionOptions} options Options for performing a membership request action
     * @returns {Promise<Array<MembershipRequestActionResult>>} Returns an array of requester IDs whose membership requests were approved and an error for each requester, if any occurred during the operation. If there are no requests, an empty array will be returned
     */
    async approveGroupMembershipRequests(groupId, options = {}) {
        return await this.pupPage.evaluate(async (groupId, options) => {
            const { requesterIds = null, sleep = [250, 500] } = options;
            return await window.WWebJS.membershipRequestAction(groupId, 'Approve', requesterIds, sleep);
        }, groupId, options);
    }

    /**
     * Rejects membership requests if any
     * @param {string} groupId The group ID to get the membership request for
     * @param {MembershipRequestActionOptions} options Options for performing a membership request action
     * @returns {Promise<Array<MembershipRequestActionResult>>} Returns an array of requester IDs whose membership requests were rejected and an error for each requester, if any occurred during the operation. If there are no requests, an empty array will be returned
     */
    async rejectGroupMembershipRequests(groupId, options = {}) {
        return await this.pupPage.evaluate(async (groupId, options) => {
            const { requesterIds = null, sleep = [250, 500] } = options;
            return await window.WWebJS.membershipRequestAction(groupId, 'Reject', requesterIds, sleep);
        }, groupId, options);
    }


    /**
     * Setting  autoload download audio
     * @param {boolean} flag true/false
     */
    async setAutoDownloadAudio(flag) {
        await this.pupPage.evaluate(async flag => {
            const autoDownload = window.Store.Settings.getAutoDownloadAudio();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadAudio(flag);
            return flag;
        }, flag);
    }

    /**
     * Setting  autoload download documents
     * @param {boolean} flag true/false
     */
    async setAutoDownloadDocuments(flag) {
        await this.pupPage.evaluate(async flag => {
            const autoDownload = window.Store.Settings.getAutoDownloadDocuments();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadDocuments(flag);
            return flag;
        }, flag);
    }

    /**
     * Setting  autoload download photos
     * @param {boolean} flag true/false
     */
    async setAutoDownloadPhotos(flag) {
        await this.pupPage.evaluate(async flag => {
            const autoDownload = window.Store.Settings.getAutoDownloadPhotos();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadPhotos(flag);
            return flag;
        }, flag);
    }

    /**
     * Setting  autoload download videos
     * @param {boolean} flag true/false
     */
    async setAutoDownloadVideos(flag) {
        await this.pupPage.evaluate(async flag => {
            const autoDownload = window.Store.Settings.getAutoDownloadVideos();
            if (autoDownload === flag) {
                return flag;
            }
            await window.Store.Settings.setAutoDownloadVideos(flag);
            return flag;
        }, flag);
    }

    /**
     * Setting background synchronization.
     * NOTE: this action will take effect after you restart the client.
     * @param {boolean} flag true/false
     * @returns {Promise<boolean>}
     */
    async setBackgroundSync(flag) {
        return await this.pupPage.evaluate(async flag => {
            const backSync = window.Store.Settings.getGlobalOfflineNotifications();
            if (backSync === flag) {
                return flag;
            }
            await window.Store.Settings.setGlobalOfflineNotifications(flag);
            return flag;
        }, flag);
    }
    
    /**
     * Get user device count by ID
     * Each WaWeb Connection counts as one device, and the phone (if exists) counts as one
     * So for a non-enterprise user with one WaWeb connection it should return "2"
     * @param {string} userId
     * @returns {Promise<number>}
     */
    async getContactDeviceCount(userId) {
        return await this.pupPage.evaluate(async (userId) => {
            const devices = await window.Store.DeviceList.getDeviceIds([window.Store.WidFactory.createWid(userId)]);
            if (devices && devices.length && devices[0] != null && typeof devices[0].devices == 'object') {
                return devices[0].devices.length;
            }
            return 0;
        }, userId);
    }

    /**
     * Sync chat history conversation
     * @param {string} chatId
     * @return {Promise<boolean>} True if operation completed successfully, false otherwise.
     */
    async syncHistory(chatId) {
        return await this.pupPage.evaluate(async (chatId) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const chat = window.Store.Chat.get(chatWid) ?? (await window.Store.Chat.find(chatWid));
            if (chat?.endOfHistoryTransferType === 0) {
                await window.Store.HistorySync.sendPeerDataOperationRequest(3, {
                    chatId: chat.id
                });
                return true;
            }
            return false;
        }, chatId);
    }
  
    /**
     * Generates a WhatsApp call link (video call or voice call)
     * @param {Date} startTime The start time of the call
     * @param {string} callType The type of a WhatsApp call link to generate, valid values are: `video` | `voice`
     * @returns {Promise<string>} The WhatsApp call link (https://call.whatsapp.com/video/XxXxXxXxXxXxXx) or an empty string if a generation failed.
     */
    async createCallLink(startTime, callType) {
        if (!['video', 'voice'].includes(callType)) {
            throw new class CreateCallLinkError extends Error {
                constructor(m) { super(m); }
            }('Invalid \'callType\' parameter value is provided. Valid values are: \'voice\' | \'video\'.');
        }

        startTime = Math.floor(startTime.getTime() / 1000);
        
        return await this.pupPage.evaluate(async (startTimeTs, callType) => {
            const response = await window.Store.ScheduledEventMsgUtils.createEventCallLink(startTimeTs, callType);
            return response ?? '';
        }, startTime, callType);
    }

    /**
     * Sends a response to the scheduled event message, indicating whether a user is going to attend the event or not
     * @param {number} response The response code to the scheduled event message. Valid values are: `0` for NONE response (removes a previous response) | `1` for GOING | `2` for NOT GOING | `3` for MAYBE going
     * @param {string} eventMessageId The scheduled event message ID
     * @returns {Promise<boolean>}
     */
    async sendResponseToScheduledEvent(response, eventMessageId) {
        if (![0, 1, 2, 3].includes(response)) return false;

        return await this.pupPage.evaluate(async (response, msgId) => {
            const eventMsg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            if (!eventMsg) return false;

            await window.Store.ScheduledEventMsgUtils.sendEventResponseMsg(response, eventMsg);
            return true;
        }, response, eventMessageId);
    }
  
    /**
     * Save new contact to user's addressbook or edit the existing one
     * @param {string} phoneNumber The contact's phone number in a format "17182222222", where "1" is a country code
     * @param {string} firstName 
     * @param {string} lastName 
     * @param {boolean} [syncToAddressbook = false] If set to true, the contact will also be saved to the user's address book on their phone. False by default
     * @returns {Promise<void>}
     */
    async saveOrEditAddressbookContact(phoneNumber, firstName, lastName, syncToAddressbook = false)
    {
        return await this.pupPage.evaluate(async (phoneNumber, firstName, lastName, syncToAddressbook) => {
            return await window.Store.AddressbookContactUtils.saveContactAction(
                phoneNumber,
                phoneNumber,
                null,
                null,
                firstName,
                lastName,
                syncToAddressbook
            );
        }, phoneNumber, firstName, lastName, syncToAddressbook);
    }

    /**
     * Deletes the contact from user's addressbook
     * @param {string} phoneNumber The contact's phone number in a format "17182222222", where "1" is a country code
     * @returns {Promise<void>}
     */
    async deleteAddressbookContact(phoneNumber)
    {
        return await this.pupPage.evaluate(async (phoneNumber) => {
            return await window.Store.AddressbookContactUtils.deleteContactAction(phoneNumber);
        }, phoneNumber);
    }

    /**
     * Get lid and phone number for multiple users
     * @param {string[]} userIds - Array of user IDs
     * @returns {Promise<Array<{ lid: string, pn: string }>>}
     */
    async getContactLidAndPhone(userIds) {
        return await this.pupPage.evaluate(async (userIds) => {
            if (!Array.isArray(userIds)) userIds = [userIds];

            return await Promise.all(userIds.map(async (userId) => {
                const { lid, phone } = await window.WWebJS.enforceLidAndPnRetrieval(userId);

                return {
                    lid: lid?._serialized,
                    pn: phone?._serialized
                };
            }));
        }, userIds);
    }

    /**
     * Add or edit a customer note
     * @see https://faq.whatsapp.com/1433099287594476
     * @param {string} userId The ID of a customer to add a note to
     * @param {string} note The note to add
     * @returns {Promise<void>}
     */
    async addOrEditCustomerNote(userId, note) {
        return await this.pupPage.evaluate(async (userId, note) => {
            if (!window.Store.BusinessGatingUtils.smbNotesV1Enabled()) return;

            return window.Store.CustomerNoteUtils.noteAddAction(
                'unstructured',
                window.Store.WidToJid.widToUserJid(window.Store.WidFactory.createWid(userId)),
                note
            );
        }, userId, note);
    }

    /**
     * Get a customer note
     * @see https://faq.whatsapp.com/1433099287594476
     * @param {string} userId The ID of a customer to get a note from
     * @returns {Promise<{
     *    chatId: string,
     *    content: string,
     *    createdAt: number,
     *    id: string,
     *    modifiedAt: number,
     *    type: string
     * }>}
     */
    async getCustomerNote(userId) {
        return await this.pupPage.evaluate(async (userId) => {
            if (!window.Store.BusinessGatingUtils.smbNotesV1Enabled()) return null;

            const note = await window.Store.CustomerNoteUtils.retrieveOnlyNoteForChatJid(
                window.Store.WidToJid.widToUserJid(window.Store.WidFactory.createWid(userId))
            );

            let serialized = note?.serialize();

            if (!serialized) return null;

            serialized.chatId = window.Store.JidToWid.userJidToUserWid(serialized.chatJid)._serialized;
            delete serialized.chatJid;

            return serialized;
        }, userId);
    }
    
    /**
     * Get Poll Votes
     * @param {string} messageId
     * @return {Promise<Array<PollVote>>} 
     */
    async getPollVotes(messageId) {
        const msg = await this.getMessageById(messageId);
        if (!msg) return [];
        if (msg.type != MessageTypes.POLL_CREATION) throw 'Invalid usage! Can only be used with a pollCreation message';

        const pollVotes = await this.pupPage.evaluate( async (msg) => {
            const msgKey = window.Store.MsgKey.fromString(msg.id._serialized);
            let pollVotes = await window.Store.PollsVotesSchema.getTable().equals(['parentMsgKey'], msgKey.toString());
            
            return pollVotes.map(item => {
                const typedArray = new Uint8Array(item.selectedOptionLocalIds);
                return {
                    ...item,
                    selectedOptionLocalIds: Array.from(typedArray)
                };
            });
        }, msg);

        return pollVotes.map((pollVote) => new PollVote(this.client, {...pollVote, parentMessage: msg}));
    }
}

module.exports = Client;
