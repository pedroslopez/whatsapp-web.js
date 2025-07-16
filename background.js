// WhatsApp Web.js Manager - Background Service Worker

class WhatsAppWebJSManager {
    constructor() {
        this.settings = {
            autoReply: { enabled: false, message: '', delay: 5 },
            monitoring: { logMessages: false, notifications: false, keywords: [] }
        };
        this.messageQueue = [];
        this.scheduledMessages = [];
        this.whatsappTabId = null;
        this.connectionState = {
            isConnected: false,
            state: 'UNLAUNCHED',
            isInitialized: false
        };
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        console.log('WhatsApp Web.js Manager initialized');
    }

    setupEventListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true;
        });
        chrome.runtime.onStartup.addListener(() => {
            console.log('Extension startup');
        });
        chrome.runtime.onInstalled.addListener(() => {
            console.log('Extension installed');
        });
    }

    async handleMessage(message, sender, sendResponse) {
        const { action, data } = message;
        try {
            switch (action) {
                case 'whatsapp_event':
                    // Handle events from WhatsApp Web tab
                    this.handleWhatsAppEvent(data);
                    sendResponse({ success: true });
                    break;
                case 'getContacts':
                    this.sendToWhatsAppTab({ type: 'get_contacts' }, sendResponse);
                    break;
                case 'getChats':
                    this.sendToWhatsAppTab({ type: 'get_chats' }, sendResponse);
                    break;
                case 'getMessages':
                    this.sendToWhatsAppTab({ type: 'get_messages', data }, sendResponse);
                    break;
                case 'sendMessage':
                    this.sendToWhatsAppTab({ type: 'send_message', data }, sendResponse);
                    break;
                case 'getChat':
                    this.sendToWhatsAppTab({ type: 'get_chat', data }, sendResponse);
                    break;
                case 'getContact':
                    this.sendToWhatsAppTab({ type: 'get_contact', data }, sendResponse);
                    break;
                case 'markAsRead':
                    this.sendToWhatsAppTab({ type: 'mark_as_read', data }, sendResponse);
                    break;
                case 'getConnectionState':
                    this.sendToWhatsAppTab({ type: 'get_connection_state' }, sendResponse);
                    break;
                case 'getStatus':
                    sendResponse({
                        success: true,
                        status: this.connectionState.state,
                        statusText: this.getStatusText(),
                        isConnected: this.connectionState.isConnected,
                        isInitialized: this.connectionState.isInitialized
                    });
                    break;
                case 'updateAutoReply':
                    await this.updateAutoReplySettings(data);
                    sendResponse({ success: true });
                    break;
                case 'updateMonitoring':
                    await this.updateMonitoringSettings(data);
                    sendResponse({ success: true });
                    break;
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    handleWhatsAppEvent(eventData) {
        const { type, data } = eventData;
        
        switch (type) {
            case 'integration_ready':
                this.connectionState.isInitialized = true;
                this.broadcastToTabs({ type: 'whatsapp_ready', data });
                break;
            case 'integration_failed':
                this.connectionState.isInitialized = false;
                this.broadcastToTabs({ type: 'whatsapp_failed', data });
                break;
            case 'state_changed':
                this.connectionState.state = data.state;
                this.connectionState.isConnected = data.isConnected;
                this.broadcastToTabs({ type: 'connection_state_changed', data });
                break;
            case 'message_received':
                this.handleIncomingMessage(data);
                this.broadcastToTabs({ type: 'message_received', data });
                break;
            case 'contacts_data':
                this.broadcastToTabs({ type: 'contacts_data', data });
                break;
            case 'chats_data':
                this.broadcastToTabs({ type: 'chats_data', data });
                break;
            case 'messages_data':
                this.broadcastToTabs({ type: 'messages_data', data });
                break;
            case 'message_sent':
                this.broadcastToTabs({ type: 'message_sent', data });
                break;
            case 'chat_data':
                this.broadcastToTabs({ type: 'chat_data', data });
                break;
            case 'contact_data':
                this.broadcastToTabs({ type: 'contact_data', data });
                break;
            case 'mark_as_read_result':
                this.broadcastToTabs({ type: 'mark_as_read_result', data });
                break;
            case 'connection_state':
                this.connectionState = data;
                this.broadcastToTabs({ type: 'connection_state', data });
                break;
            case 'contact_added':
                this.broadcastToTabs({ type: 'contact_added', data });
                break;
            case 'chat_added':
                this.broadcastToTabs({ type: 'chat_added', data });
                break;
            default:
                console.log('Unknown WhatsApp event:', type);
        }
    }

    handleIncomingMessage(messageData) {
        // Auto-reply functionality
        if (this.settings.autoReply.enabled && !messageData.isFromMe) {
            setTimeout(async () => {
                try {
                    await this.sendToWhatsAppTab({
                        type: 'send_message',
                        data: {
                            chatId: messageData.chat,
                            content: this.settings.autoReply.message,
                            options: {}
                        }
                    });
                } catch (error) {
                    console.error('Failed to send auto-reply:', error);
                }
            }, this.settings.autoReply.delay * 1000);
        }

        // Keyword monitoring
        if (this.settings.monitoring.keywords.length > 0) {
            const messageBody = messageData.body?.toLowerCase() || '';
            const hasKeyword = this.settings.monitoring.keywords.some(keyword => 
                messageBody.includes(keyword.toLowerCase())
            );

            if (hasKeyword) {
                this.showNotification(`Keyword alert: ${messageData.body}`, messageData.from);
            }
        }

        // Browser notification if enabled
        if (this.settings.monitoring.notifications) {
            this.showNotification(
                `New message from ${messageData.notifyName || messageData.author || messageData.from}`,
                messageData.body
            );
        }

        // Log message if enabled
        if (this.settings.monitoring.logMessages) {
            this.logMessage(messageData);
        }
    }

    // Enhanced helper to find WhatsApp Web tab and send a message to its content script
    async sendToWhatsAppTab(payload, sendResponse) {
        try {
            // Find WhatsApp Web tab
            const tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });
            
            if (tabs.length === 0) {
                const error = { success: false, error: 'WhatsApp Web tab not found. Please open web.whatsapp.com' };
                if (sendResponse) sendResponse(error);
                return error;
            }

            const tabId = tabs[0].id;
            this.whatsappTabId = tabId;

            // Set up timeout for response
            const timeout = setTimeout(() => {
                const timeoutError = { success: false, error: 'Request timeout - WhatsApp Web may not be ready' };
                if (sendResponse) sendResponse(timeoutError);
            }, 10000); // 10 second timeout

            // Send message to content script
            chrome.tabs.sendMessage(tabId, { 
                action: 'execute_script', 
                data: payload 
            }, (response) => {
                clearTimeout(timeout);
                if (chrome.runtime.lastError) {
                    const error = { 
                        success: false, 
                        error: chrome.runtime.lastError.message || 'Failed to communicate with WhatsApp Web' 
                    };
                    if (sendResponse) sendResponse(error);
                } else if (sendResponse) {
                    sendResponse(response);
                }
            });

        } catch (error) {
            console.error('Error sending to WhatsApp tab:', error);
            const errorResponse = { success: false, error: error.message };
            if (sendResponse) sendResponse(errorResponse);
        }
    }

    getStatusText() {
        switch (this.connectionState.state) {
            case 'UNLAUNCHED': return 'WhatsApp Web not launched';
            case 'OPENING': return 'Opening WhatsApp Web...';
            case 'PAIRING': return 'Waiting for QR code scan...';
            case 'CONNECTED': return 'Connected to WhatsApp Web';
            case 'CONFLICT': return 'Multiple sessions detected';
            case 'DEPRECATED_VERSION': return 'WhatsApp Web version outdated';
            case 'PROXYBLOCK': return 'Proxy blocked';
            case 'SMB_TOS_BLOCK': return 'Business account blocked';
            case 'TIMEOUT': return 'Connection timeout';
            case 'TOS_BLOCK': return 'Terms of service blocked';
            case 'UNPAIRED': return 'Not paired with phone';
            case 'UNPAIRED_IDLE': return 'Not paired (idle)';
            default: return 'Unknown state';
        }
    }

    broadcastToTabs(message) {
        // Send message to all extension pages (popup, options, etc.)
        chrome.runtime.sendMessage(message).catch(() => {
            // Ignore errors if no receivers
        });
    }

    showNotification(title, body) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: title,
            message: body
        });
    }

    async updateAutoReplySettings(settings) {
        this.settings.autoReply = { ...this.settings.autoReply, ...settings };
        await this.saveSettings();
    }

    async updateMonitoringSettings(settings) {
        this.settings.monitoring = { ...this.settings.monitoring, ...settings };
        await this.saveSettings();
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            if (result.settings) {
                this.settings = { ...this.settings, ...result.settings };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.local.set({ settings: this.settings });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    logMessage(message) {
        // Log message to storage for monitoring
        const logEntry = {
            timestamp: Date.now(),
            message: message
        };
        
        chrome.storage.local.get(['messageLog'], (result) => {
            const log = result.messageLog || [];
            log.push(logEntry);
            
            // Keep only last 1000 messages
            if (log.length > 1000) {
                log.splice(0, log.length - 1000);
            }
            
            chrome.storage.local.set({ messageLog: log });
        });
    }

    getMediaType(mimetype) {
        if (mimetype.startsWith('image/')) return 'image';
        if (mimetype.startsWith('video/')) return 'video';
        if (mimetype.startsWith('audio/')) return 'audio';
        return 'document';
    }

    getFileExtension(mimetype) {
        const extensions = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'audio/mpeg': 'mp3',
            'audio/wav': 'wav',
            'application/pdf': 'pdf'
        };
        return extensions[mimetype] || 'bin';
    }

    base64ToBlob(base64, mimetype) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimetype });
    }
}

// Initialize the manager
new WhatsAppWebJSManager();