// WhatsApp Web.js Manager - Background Service Worker
importScripts('lib/index.js');

class WhatsAppWebJSManager {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.currentStatus = 'disconnected';
        this.qrCode = null;
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
        // Listen for messages from popup/content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Handle extension startup
        chrome.runtime.onStartup.addListener(() => {
            console.log('Extension startup');
        });

        // Handle extension installation
        chrome.runtime.onInstalled.addListener(() => {
            console.log('Extension installed');
        });
    }

    async handleMessage(message, sender, sendResponse) {
        const { action, data } = message;

        try {
            switch (action) {
                case 'connect':
                    await this.connectClient();
                    sendResponse({ success: true });
                    break;

                case 'disconnect':
                    await this.disconnectClient();
                    sendResponse({ success: true });
                    break;

                case 'getStatus':
                    sendResponse({
                        success: true,
                        status: this.currentStatus,
                        statusText: this.getStatusText(),
                        clientInfo: this.getClientInfo()
                    });
                    break;

                case 'refreshQR':
                    const qr = await this.refreshQRCode();
                    sendResponse({ success: true, qr });
                    break;

                case 'sendMessage':
                    const result = await this.sendMessage(data);
                    sendResponse(result);
                    break;

                case 'getContacts':
                    const contacts = await this.getContacts();
                    sendResponse({ success: true, contacts });
                    break;

                case 'getGroups':
                    const groups = await this.getGroups();
                    sendResponse({ success: true, groups });
                    break;

                case 'getChats':
                    const chats = await this.getChats();
                    sendResponse({ success: true, chats });
                    break;

                case 'addContact':
                    const addResult = await this.addContact(data);
                    sendResponse(addResult);
                    break;

                case 'createGroup':
                    const groupResult = await this.createGroup(data);
                    sendResponse(groupResult);
                    break;

                case 'joinGroup':
                    const joinResult = await this.joinGroup(data);
                    sendResponse(joinResult);
                    break;

                case 'blockContact':
                    const blockResult = await this.blockContact(data.contactId);
                    sendResponse(blockResult);
                    break;

                case 'unblockContact':
                    const unblockResult = await this.unblockContact(data.contactId);
                    sendResponse(unblockResult);
                    break;

                case 'updateAutoReply':
                    await this.updateAutoReplySettings(data);
                    sendResponse({ success: true });
                    break;

                case 'updateMonitoring':
                    await this.updateMonitoringSettings(data);
                    sendResponse({ success: true });
                    break;

                case 'downloadMedia':
                    const mediaResult = await this.downloadMedia(data);
                    sendResponse(mediaResult);
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async connectClient() {
        if (this.client) {
            await this.disconnectClient();
        }

        try {
            // Use LocalAuth for session persistence
            const { Client, LocalAuth } = await import('./lib/index.js');
            
            this.client = new Client({
                authStrategy: new LocalAuth({
                    clientId: 'whatsapp-webjs-extension'
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu'
                    ]
                }
            });

            this.setupClientEventListeners();
            await this.client.initialize();
            
            this.updateStatus('connecting');
        } catch (error) {
            console.error('Failed to connect client:', error);
            this.updateStatus('disconnected');
            throw error;
        }
    }

    async disconnectClient() {
        if (this.client) {
            try {
                await this.client.destroy();
                this.client = null;
                this.updateStatus('disconnected');
            } catch (error) {
                console.error('Error disconnecting client:', error);
            }
        }
    }

    setupClientEventListeners() {
        if (!this.client) return;

        // QR Code event
        this.client.on('qr', (qr) => {
            console.log('QR Code received');
            this.qrCode = qr;
            this.broadcastToTabs({
                type: 'qrCodeGenerated',
                qr: qr
            });
        });

        // Authentication events
        this.client.on('authenticated', () => {
            console.log('Client authenticated');
            this.updateStatus('authenticated');
        });

        this.client.on('auth_failure', (message) => {
            console.error('Authentication failed:', message);
            this.updateStatus('auth_failed');
        });

        // Ready event
        this.client.on('ready', () => {
            console.log('Client is ready');
            this.isConnected = true;
            this.updateStatus('connected');
            this.broadcastToTabs({
                type: 'clientReady'
            });
        });

        // Message events
        this.client.on('message', (message) => {
            this.handleIncomingMessage(message);
        });

        this.client.on('message_create', (message) => {
            if (this.settings.monitoring.logMessages) {
                this.logMessage(message);
            }
        });

        // Disconnect event
        this.client.on('disconnected', (reason) => {
            console.log('Client disconnected:', reason);
            this.isConnected = false;
            this.updateStatus('disconnected');
        });

        // Battery change event (for older WhatsApp Web versions)
        this.client.on('change_battery', (batteryInfo) => {
            console.log('Battery changed:', batteryInfo);
        });

        // State change event
        this.client.on('change_state', (state) => {
            console.log('State changed:', state);
        });
    }

    async handleIncomingMessage(message) {
        try {
            // Auto-reply functionality
            if (this.settings.autoReply.enabled && !message.fromMe) {
                setTimeout(async () => {
                    try {
                        await message.reply(this.settings.autoReply.message);
                    } catch (error) {
                        console.error('Failed to send auto-reply:', error);
                    }
                }, this.settings.autoReply.delay * 1000);
            }

            // Keyword monitoring
            if (this.settings.monitoring.keywords.length > 0) {
                const messageBody = message.body.toLowerCase();
                const hasKeyword = this.settings.monitoring.keywords.some(keyword => 
                    messageBody.includes(keyword.toLowerCase())
                );

                if (hasKeyword) {
                    this.showNotification(`Keyword alert: ${message.body}`, message.from);
                }
            }

            // Broadcast to popup if open
            this.broadcastToTabs({
                type: 'messageReceived',
                from: message.from,
                body: message.body,
                timestamp: message.timestamp
            });

            // Browser notification if enabled
            if (this.settings.monitoring.notifications) {
                const contact = await message.getContact();
                this.showNotification(
                    `New message from ${contact.name || contact.pushname || contact.number}`,
                    message.body
                );
            }
        } catch (error) {
            console.error('Error handling incoming message:', error);
        }
    }

    async sendMessage(data) {
        if (!this.client || !this.isConnected) {
            throw new Error('Client not connected');
        }

        try {
            const { recipient, type, content, media, location, poll } = data;

            let messageResult;
            
            switch (type) {
                case 'text':
                    messageResult = await this.client.sendMessage(recipient, content);
                    break;

                case 'media':
                    const { MessageMedia } = await import('./lib/index.js');
                    const mediaObj = new MessageMedia(
                        data.mimetype,
                        data.media.split(',')[1], // Remove data URL prefix
                        data.filename
                    );
                    messageResult = await this.client.sendMessage(recipient, mediaObj, {
                        caption: data.caption
                    });
                    break;

                case 'location':
                    const { Location } = await import('./lib/index.js');
                    const locationObj = new Location(
                        location.latitude,
                        location.longitude,
                        location.name
                    );
                    messageResult = await this.client.sendMessage(recipient, locationObj);
                    break;

                case 'poll':
                    const { Poll } = await import('./lib/index.js');
                    const pollObj = new Poll(poll.name, poll.options, {
                        allowMultipleAnswers: poll.allowMultipleAnswers
                    });
                    messageResult = await this.client.sendMessage(recipient, pollObj);
                    break;

                case 'contact':
                    // Contact card implementation
                    messageResult = await this.client.sendMessage(recipient, data.contact);
                    break;

                default:
                    throw new Error(`Unsupported message type: ${type}`);
            }

            return { success: true, messageId: messageResult.id };
        } catch (error) {
            console.error('Failed to send message:', error);
            return { success: false, error: error.message };
        }
    }

    async getContacts() {
        if (!this.client || !this.isConnected) {
            return [];
        }

        try {
            const contacts = await this.client.getContacts();
            return contacts.filter(contact => contact.isMyContact);
        } catch (error) {
            console.error('Failed to get contacts:', error);
            return [];
        }
    }

    async getGroups() {
        if (!this.client || !this.isConnected) {
            return [];
        }

        try {
            const chats = await this.client.getChats();
            return chats.filter(chat => chat.isGroup);
        } catch (error) {
            console.error('Failed to get groups:', error);
            return [];
        }
    }

    async getChats() {
        if (!this.client || !this.isConnected) {
            return [];
        }

        try {
            return await this.client.getChats();
        } catch (error) {
            console.error('Failed to get chats:', error);
            return [];
        }
    }

    async addContact(data) {
        if (!this.client || !this.isConnected) {
            throw new Error('Client not connected');
        }

        try {
            const { phoneNumber, firstName, lastName } = data;
            await this.client.saveOrEditAddressbookContact(
                phoneNumber,
                firstName,
                lastName,
                true // Sync to addressbook
            );
            return { success: true };
        } catch (error) {
            console.error('Failed to add contact:', error);
            return { success: false, error: error.message };
        }
    }

    async createGroup(data) {
        if (!this.client || !this.isConnected) {
            throw new Error('Client not connected');
        }

        try {
            const { name, description, participants } = data;
            const group = await this.client.createGroup(name, participants);
            
            if (description) {
                await group.setDescription(description);
            }
            
            return { success: true, groupId: group.id._serialized };
        } catch (error) {
            console.error('Failed to create group:', error);
            return { success: false, error: error.message };
        }
    }

    async joinGroup(data) {
        if (!this.client || !this.isConnected) {
            throw new Error('Client not connected');
        }

        try {
            const { inviteCode } = data;
            // Extract invite code from URL if needed
            const code = inviteCode.includes('chat.whatsapp.com') 
                ? inviteCode.split('/').pop() 
                : inviteCode;
            
            const chatId = await this.client.acceptInvite(code);
            return { success: true, chatId };
        } catch (error) {
            console.error('Failed to join group:', error);
            return { success: false, error: error.message };
        }
    }

    async blockContact(contactId) {
        if (!this.client || !this.isConnected) {
            throw new Error('Client not connected');
        }

        try {
            const contact = await this.client.getContactById(contactId);
            await contact.block();
            return { success: true };
        } catch (error) {
            console.error('Failed to block contact:', error);
            return { success: false, error: error.message };
        }
    }

    async unblockContact(contactId) {
        if (!this.client || !this.isConnected) {
            throw new Error('Client not connected');
        }

        try {
            const contact = await this.client.getContactById(contactId);
            await contact.unblock();
            return { success: true };
        } catch (error) {
            console.error('Failed to unblock contact:', error);
            return { success: false, error: error.message };
        }
    }

    async downloadMedia(data) {
        if (!this.client || !this.isConnected) {
            throw new Error('Client not connected');
        }

        try {
            const { chatId, mediaType, limit } = data;
            const chat = await this.client.getChatById(chatId);
            const messages = await chat.fetchMessages({ limit: limit * 2 }); // Get extra in case some don't have media
            
            let downloadCount = 0;
            const downloadedFiles = [];

            for (const message of messages) {
                if (downloadCount >= limit) break;
                
                if (message.hasMedia) {
                    const media = await message.downloadMedia();
                    
                    // Check media type filter
                    if (mediaType !== 'all') {
                        const messageMediaType = this.getMediaType(media.mimetype);
                        if (messageMediaType !== mediaType) continue;
                    }

                    // Create download
                    const blob = this.base64ToBlob(media.data, media.mimetype);
                    const url = URL.createObjectURL(blob);
                    
                    chrome.downloads.download({
                        url: url,
                        filename: media.filename || `media_${Date.now()}.${this.getFileExtension(media.mimetype)}`
                    });

                    downloadedFiles.push({
                        filename: media.filename,
                        mimetype: media.mimetype,
                        size: media.data.length
                    });

                    downloadCount++;
                }
            }

            return { success: true, count: downloadCount, files: downloadedFiles };
        } catch (error) {
            console.error('Failed to download media:', error);
            return { success: false, error: error.message };
        }
    }

    // Utility Methods
    updateStatus(status) {
        this.currentStatus = status;
        this.broadcastToTabs({
            type: 'connectionStatusChanged',
            status: status,
            statusText: this.getStatusText()
        });
    }

    getStatusText() {
        switch (this.currentStatus) {
            case 'disconnected': return 'Disconnected';
            case 'connecting': return 'Connecting...';
            case 'authenticated': return 'Authenticated';
            case 'connected': return 'Connected';
            case 'auth_failed': return 'Authentication Failed';
            default: return 'Unknown';
        }
    }

    getClientInfo() {
        if (!this.client || !this.isConnected) {
            return null;
        }

        try {
            const info = this.client.info;
            return {
                phone: info?.wid?.user,
                platform: info?.platform,
                pushname: info?.pushname
            };
        } catch (error) {
            return null;
        }
    }

    async refreshQRCode() {
        if (this.client && this.currentStatus === 'connecting') {
            return this.qrCode;
        }
        return null;
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
const whatsappManager = new WhatsAppWebJSManager();