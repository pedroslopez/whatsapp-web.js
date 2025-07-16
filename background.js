// WhatsApp Web.js Manager - Enhanced Background Script
// This script manages the extension's background processes and communication

class WhatsAppBackgroundManager {
    constructor() {
        this.isConnected = false;
        this.currentState = 'UNLAUNCHED';
        this.whatsappTab = null;
        this.sidebarPort = null;
        this.messageQueue = [];
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSidePanel();
        this.checkWhatsAppTab();
        console.log('WhatsApp Web.js Manager background script initialized');
    }

    setupEventListeners() {
        // Listen for messages from content scripts and popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Listen for tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url && tab.url.includes('web.whatsapp.com')) {
                this.whatsappTab = tabId;
                this.retryCount = 0;
                this.checkConnection();
            }
        });

        // Listen for tab removal
        chrome.tabs.onRemoved.addListener((tabId) => {
            if (tabId === this.whatsappTab) {
                this.whatsappTab = null;
                this.isConnected = false;
                this.currentState = 'UNLAUNCHED';
                this.broadcastStateChange();
            }
        });

        // Listen for extension installation/update
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                console.log('WhatsApp Web.js Manager installed');
                this.openWhatsAppTab();
            } else if (details.reason === 'update') {
                console.log('WhatsApp Web.js Manager updated to version', chrome.runtime.getManifest().version);
            }
        });

        // Listen for extension startup
        chrome.runtime.onStartup.addListener(() => {
            console.log('WhatsApp Web.js Manager started');
            this.checkWhatsAppTab();
        });
    }

    setupSidePanel() {
        // Set up side panel
        if (chrome.sidePanel) {
            chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
        }
    }

    async checkWhatsAppTab() {
        try {
            const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
            if (tabs.length > 0) {
                this.whatsappTab = tabs[0].id;
                this.checkConnection();
            } else {
                // No WhatsApp tab found, create one
                this.openWhatsAppTab();
            }
        } catch (error) {
            console.error('Error checking WhatsApp tab:', error);
        }
    }

    async openWhatsAppTab() {
        try {
            const tab = await chrome.tabs.create({
                url: 'https://web.whatsapp.com/',
                active: true
            });
            this.whatsappTab = tab.id;
        } catch (error) {
            console.error('Error opening WhatsApp tab:', error);
        }
    }

    async checkConnection() {
        if (!this.whatsappTab) {
            this.updateConnectionStatus(false, 'NO_TAB');
            return;
        }

        try {
            const response = await this.executeScript({
                type: 'get_connection_state'
            });
            
            // Validate response before using it
            if (response && typeof response === 'object') {
                this.updateConnectionStatus(
                    response.isConnected || false, 
                    response.state || 'UNKNOWN'
                );
            } else {
                console.warn('Invalid connection response:', response);
                this.updateConnectionStatus(false, 'INVALID_RESPONSE');
            }
        } catch (error) {
            console.error('Error checking connection:', error);
            this.updateConnectionStatus(false, 'ERROR');
            
            // Retry if we haven't exceeded max retries
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                setTimeout(() => this.checkConnection(), 2000);
            }
        }
    }

    updateConnectionStatus(isConnected, state) {
        this.isConnected = isConnected;
        this.currentState = state;
        this.retryCount = 0;
        
        this.broadcastStateChange();
    }

    broadcastStateChange() {
        const message = {
            type: 'whatsapp_event',
            data: {
                type: 'state_changed',
                data: {
                    isConnected: this.isConnected,
                    state: this.currentState
                }
            }
        };

        // Broadcast to all extension views
        chrome.runtime.sendMessage(message).catch(() => {});
        
        // Broadcast to side panel if available
        if (this.sidebarPort) {
            this.sidebarPort.postMessage(message);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'check_connection':
                    sendResponse({
                        isConnected: this.isConnected,
                        state: this.currentState
                    });
                    break;

                case 'execute_script':
                    const response = await this.executeScript(message.data);
                    sendResponse(response);
                    break;

                case 'whatsapp_event':
                    // Forward WhatsApp events to all extension views
                    this.broadcastWhatsAppEvent(message.data);
                    sendResponse({ success: true });
                    break;

                case 'open_whatsapp':
                    await this.openWhatsAppTab();
                    sendResponse({ success: true });
                    break;

                case 'get_extension_info':
                    sendResponse({
                        version: chrome.runtime.getManifest().version,
                        isConnected: this.isConnected,
                        state: this.currentState,
                        whatsappTab: this.whatsappTab
                    });
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }

    async executeScript(command) {
        if (!this.whatsappTab) {
            throw new Error('WhatsApp tab not found');
        }

        try {
            const response = await chrome.tabs.sendMessage(this.whatsappTab, {
                action: 'execute_script',
                data: command
            });

            if (chrome.runtime.lastError) {
                throw new Error(chrome.runtime.lastError.message);
            }

            return response;
        } catch (error) {
            console.error('Error executing script:', error);
            
            // If content script is not ready, inject it
            if (error.message.includes('Could not establish connection') || 
                error.message.includes('Receiving end does not exist')) {
                
                await this.injectContentScript();
                
                // Retry after a short delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                return await this.executeScript(command);
            }
            
            throw error;
        }
    }

    async injectContentScript() {
        if (!this.whatsappTab) return;

        try {
            // Check if chrome.scripting is available (Manifest V3)
            if (chrome.scripting && chrome.scripting.executeScript) {
                await chrome.scripting.executeScript({
                    target: { tabId: this.whatsappTab },
                    files: ['content.js']
                });
                console.log('Content script injected via chrome.scripting');
            } else {
                // Fallback for older Chrome versions or Manifest V2
                await chrome.tabs.executeScript(this.whatsappTab, {
                    file: 'content.js'
                });
                console.log('Content script injected via chrome.tabs.executeScript');
            }
        } catch (error) {
            console.error('Error injecting content script:', error);
            // Try alternative injection method
            try {
                await chrome.tabs.executeScript(this.whatsappTab, {
                    file: 'content.js'
                });
                console.log('Content script injected via fallback method');
            } catch (fallbackError) {
                console.error('Fallback injection also failed:', fallbackError);
            }
        }
    }

    broadcastWhatsAppEvent(eventData) {
        const message = {
            type: 'whatsapp_event',
            data: eventData
        };

        // Broadcast to all extension views
        chrome.runtime.sendMessage(message).catch(() => {});
        
        // Broadcast to side panel if available
        if (this.sidebarPort) {
            this.sidebarPort.postMessage(message);
        }
    }

    // Side panel connection management
    handleSidePanelConnection(port) {
        this.sidebarPort = port;
        
        port.onMessage.addListener((message) => {
            this.handleSidePanelMessage(message, port);
        });
        
        port.onDisconnect.addListener(() => {
            this.sidebarPort = null;
            console.log('Side panel disconnected');
        });

        // Send current state to side panel
        port.postMessage({
            type: 'whatsapp_event',
            data: {
                type: 'state_changed',
                data: {
                    isConnected: this.isConnected,
                    state: this.currentState
                }
            }
        });

        console.log('Side panel connected');
    }

    async handleSidePanelMessage(message, port) {
        try {
            switch (message.action) {
                case 'check_connection':
                    port.postMessage({
                        type: 'connection_status',
                        data: {
                            isConnected: this.isConnected,
                            state: this.currentState
                        }
                    });
                    break;

                case 'execute_script':
                    const response = await this.executeScript(message.data);
                    port.postMessage({
                        type: 'script_response',
                        data: response
                    });
                    break;

                case 'open_whatsapp':
                    await this.openWhatsAppTab();
                    port.postMessage({
                        type: 'whatsapp_opened',
                        data: { success: true }
                    });
                    break;

                default:
                    port.postMessage({
                        type: 'error',
                        data: { error: 'Unknown action' }
                    });
            }
        } catch (error) {
            console.error('Error handling side panel message:', error);
            port.postMessage({
                type: 'error',
                data: { error: error.message }
            });
        }
    }
}

// Initialize background manager
const backgroundManager = new WhatsAppBackgroundManager();

// Handle side panel connections
if (chrome.runtime.onConnect) {
    chrome.runtime.onConnect.addListener((port) => {
        if (port.name === 'sidebar') {
            backgroundManager.handleSidePanelConnection(port);
        }
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppBackgroundManager;
}