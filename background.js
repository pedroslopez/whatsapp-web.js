// WhatsApp Web.js Manager - Background Service Worker

class WhatsAppWebJSManager {
    constructor() {
        this.settings = {
            autoReply: { enabled: false, message: '', delay: 5 },
            monitoring: { logMessages: false, notifications: false, keywords: [] }
        };
        this.messageQueue = [];
        this.scheduledMessages = [];
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
                case 'getContacts':
                    this.sendToWhatsAppTab({ type: 'get_contacts' }, sendResponse);
                    break;
                case 'getChats':
                    this.sendToWhatsAppTab({ type: 'get_chats' }, sendResponse);
                    break;
                case 'sendMessage':
                    this.sendToWhatsAppTab({ type: 'send_message', data }, sendResponse);
                    break;
                // Add more cases as needed for other WhatsApp actions
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

    // Helper to find WhatsApp Web tab and send a message to its content script
    sendToWhatsAppTab(payload, sendResponse) {
        chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, (tabs) => {
            if (tabs.length === 0) {
                sendResponse({ success: false, error: 'WhatsApp Web tab not found' });
                return;
            }
            const tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabId, { action: 'execute_script', data: payload }, (response) => {
                sendResponse(response);
            });
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
            console.error('Failed to load settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.local.set({ settings: this.settings });
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    logMessage(message) {
        // Log message to storage or console
        console.log('Message logged:', {
            from: message.from,
            body: message.body,
            timestamp: message.timestamp,
            fromMe: message.fromMe
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