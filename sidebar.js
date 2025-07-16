// WhatsApp Web.js Manager - Sidebar JavaScript

class WhatsAppSidebar {
    constructor() {
        this.isConnected = false;
        this.currentTab = 'dashboard';
        this.data = {
            contacts: [],
            chats: [],
            messages: [],
            stats: {
                totalMessages: 0,
                totalContacts: 0,
                totalChats: 0
            }
        };
        this.settings = {};
        this.activityLog = [];
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.checkConnection();
        this.addActivity('Sidebar initialized');
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.tab-button').dataset.tab);
            });
        });

        // Dashboard actions
        document.getElementById('refreshData').addEventListener('click', () => this.refreshAllData());
        document.getElementById('getContacts').addEventListener('click', () => this.getContacts());
        document.getElementById('getChats').addEventListener('click', () => this.getChats());

        // Messages tab
        document.getElementById('refreshMessages').addEventListener('click', () => this.getMessages());
        document.getElementById('loadMessages').addEventListener('click', () => this.getMessages());
        document.getElementById('messageSearch').addEventListener('input', (e) => this.filterMessages(e.target.value));
        document.getElementById('chatFilter').addEventListener('change', (e) => this.filterMessagesByChat(e.target.value));

        // Contacts tab
        document.getElementById('refreshContacts').addEventListener('click', () => this.getContacts());
        document.getElementById('loadContacts').addEventListener('click', () => this.getContacts());
        document.getElementById('contactSearch').addEventListener('input', (e) => this.filterContacts(e.target.value));
        document.getElementById('contactFilter').addEventListener('change', (e) => this.filterContactsByType(e.target.value));

        // Automation settings
        document.getElementById('autoReplyEnabled').addEventListener('change', (e) => this.toggleAutoReply(e.target.checked));
        document.getElementById('messageLoggingEnabled').addEventListener('change', (e) => this.toggleMessageLogging(e.target.checked));
        document.getElementById('notificationsEnabled').addEventListener('change', (e) => this.toggleNotifications(e.target.checked));
        document.getElementById('saveAutomation').addEventListener('click', () => this.saveAutomationSettings());

        // Settings
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('importData').addEventListener('click', () => this.importData());
        document.getElementById('clearData').addEventListener('click', () => this.clearAllData());

        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleBackgroundMessage(message);
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        this.addActivity(`Switched to ${tabName} tab`);
    }

    async checkConnection() {
        try {
            const response = await this.sendToBackground({
                action: 'check_connection'
            });
            
            this.updateConnectionStatus(response.isConnected, response.state);
        } catch (error) {
            console.error('Error checking connection:', error);
            this.updateConnectionStatus(false, 'error');
        }
    }

    updateConnectionStatus(isConnected, state) {
        this.isConnected = isConnected;
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');

        indicator.className = 'fas fa-circle status-indicator';
        
        if (isConnected) {
            indicator.classList.add('connected');
            statusText.textContent = 'Connected';
        } else if (state === 'connecting') {
            indicator.classList.add('connecting');
            statusText.textContent = 'Connecting...';
        } else {
            indicator.classList.add('disconnected');
            statusText.textContent = 'Disconnected';
        }
    }

    async refreshAllData() {
        this.addActivity('Refreshing all data...');
        
        try {
            await Promise.all([
                this.getContacts(),
                this.getChats(),
                this.getMessages()
            ]);
            
            this.addActivity('Data refresh completed');
        } catch (error) {
            this.addActivity('Data refresh failed: ' + error.message, 'error');
        }
    }

    async getContacts() {
        try {
            const response = await this.sendToBackground({
                action: 'execute_script',
                data: {
                    type: 'get_contacts'
                }
            });

            if (response.contacts) {
                this.data.contacts = response.contacts;
                this.data.stats.totalContacts = response.contacts.length;
                this.updateContactsList();
                this.updateStats();
                this.addActivity(`Loaded ${response.contacts.length} contacts`);
            } else if (response.error) {
                this.addActivity('Failed to load contacts: ' + response.error, 'error');
            }
        } catch (error) {
            this.addActivity('Error loading contacts: ' + error.message, 'error');
        }
    }

    async getChats() {
        try {
            const response = await this.sendToBackground({
                action: 'execute_script',
                data: {
                    type: 'get_chats'
                }
            });

            if (response.chats) {
                this.data.chats = response.chats;
                this.data.stats.totalChats = response.chats.length;
                this.updateChatsFilter();
                this.updateStats();
                this.addActivity(`Loaded ${response.chats.length} chats`);
            } else if (response.error) {
                this.addActivity('Failed to load chats: ' + response.error, 'error');
            }
        } catch (error) {
            this.addActivity('Error loading chats: ' + error.message, 'error');
        }
    }

    async getMessages(chatId = null) {
        try {
            const response = await this.sendToBackground({
                action: 'execute_script',
                data: {
                    type: 'get_messages',
                    chatId: chatId,
                    limit: 50
                }
            });

            if (response.messages) {
                this.data.messages = response.messages;
                this.data.stats.totalMessages = response.messages.length;
                this.updateMessagesList();
                this.updateStats();
                this.addActivity(`Loaded ${response.messages.length} messages`);
            } else if (response.error) {
                this.addActivity('Failed to load messages: ' + response.error, 'error');
            }
        } catch (error) {
            this.addActivity('Error loading messages: ' + error.message, 'error');
        }
    }

    updateContactsList() {
        const container = document.getElementById('contactsList');
        const contacts = this.data.contacts;

        if (contacts.length === 0) {
            container.innerHTML = `
                <div class="no-contacts">
                    <i class="fas fa-address-book"></i>
                    <p>No contacts found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = contacts.map(contact => `
            <div class="contact-item" data-id="${contact.id}">
                <div class="contact-header">
                    <span class="contact-name">${contact.name || contact.pushname || 'Unknown'}</span>
                    <span class="contact-number">${contact.number || contact.id}</span>
                </div>
                <div class="contact-info">
                    ${contact.isMyContact ? 'My Contact' : 'WhatsApp Contact'}
                    ${contact.isGroup ? ' (Group)' : ''}
                </div>
            </div>
        `).join('');
    }

    updateMessagesList() {
        const container = document.getElementById('messagesList');
        const messages = this.data.messages;

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-comments"></i>
                    <p>No messages found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(message => `
            <div class="message-item" data-id="${message.id}">
                <div class="message-header">
                    <span class="message-sender">${message.from || message.author || 'Unknown'}</span>
                    <span class="message-time">${this.formatTimestamp(message.timestamp)}</span>
                </div>
                <div class="message-content">
                    ${message.body || '[Media]'}
                </div>
            </div>
        `).join('');
    }

    updateChatsFilter() {
        const select = document.getElementById('chatFilter');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">All Chats</option>';
        
        this.data.chats.forEach(chat => {
            const option = document.createElement('option');
            option.value = chat.id;
            option.textContent = chat.name || chat.id;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    }

    updateStats() {
        document.getElementById('totalMessages').textContent = this.data.stats.totalMessages;
        document.getElementById('totalContacts').textContent = this.data.stats.totalContacts;
        document.getElementById('totalChats').textContent = this.data.stats.totalChats;
    }

    filterMessages(searchTerm) {
        const messages = this.data.messages.filter(message => 
            message.body && message.body.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.displayFilteredMessages(messages);
    }

    filterMessagesByChat(chatId) {
        if (!chatId) {
            this.updateMessagesList();
            return;
        }
        
        const messages = this.data.messages.filter(message => 
            message.chat === chatId
        );
        this.displayFilteredMessages(messages);
    }

    displayFilteredMessages(messages) {
        const container = document.getElementById('messagesList');
        
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-search"></i>
                    <p>No messages match your filter</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(message => `
            <div class="message-item" data-id="${message.id}">
                <div class="message-header">
                    <span class="message-sender">${message.from || message.author || 'Unknown'}</span>
                    <span class="message-time">${this.formatTimestamp(message.timestamp)}</span>
                </div>
                <div class="message-content">
                    ${message.body || '[Media]'}
                </div>
            </div>
        `).join('');
    }

    filterContacts(searchTerm) {
        const contacts = this.data.contacts.filter(contact => 
            (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (contact.pushname && contact.pushname.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (contact.number && contact.number.includes(searchTerm))
        );
        this.displayFilteredContacts(contacts);
    }

    filterContactsByType(type) {
        let contacts = this.data.contacts;
        
        if (type === 'my') {
            contacts = contacts.filter(contact => contact.isMyContact);
        } else if (type === 'wa') {
            contacts = contacts.filter(contact => contact.isWAContact);
        }
        
        this.displayFilteredContacts(contacts);
    }

    displayFilteredContacts(contacts) {
        const container = document.getElementById('contactsList');
        
        if (contacts.length === 0) {
            container.innerHTML = `
                <div class="no-contacts">
                    <i class="fas fa-search"></i>
                    <p>No contacts match your filter</p>
                </div>
            `;
            return;
        }

        container.innerHTML = contacts.map(contact => `
            <div class="contact-item" data-id="${contact.id}">
                <div class="contact-header">
                    <span class="contact-name">${contact.name || contact.pushname || 'Unknown'}</span>
                    <span class="contact-number">${contact.number || contact.id}</span>
                </div>
                <div class="contact-info">
                    ${contact.isMyContact ? 'My Contact' : 'WhatsApp Contact'}
                    ${contact.isGroup ? ' (Group)' : ''}
                </div>
            </div>
        `).join('');
    }

    toggleAutoReply(enabled) {
        this.settings.autoReply = enabled;
        this.saveSettings();
        this.addActivity(`Auto-reply ${enabled ? 'enabled' : 'disabled'}`);
    }

    toggleMessageLogging(enabled) {
        this.settings.messageLogging = enabled;
        this.saveSettings();
        this.addActivity(`Message logging ${enabled ? 'enabled' : 'disabled'}`);
    }

    toggleNotifications(enabled) {
        this.settings.notifications = enabled;
        this.saveSettings();
        this.addActivity(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    }

    async saveAutomationSettings() {
        const settings = {
            autoReply: {
                enabled: document.getElementById('autoReplyEnabled').checked,
                message: document.getElementById('autoReplyMessage').value,
                delay: parseInt(document.getElementById('autoReplyDelay').value) || 5
            },
            messageLogging: document.getElementById('messageLoggingEnabled').checked,
            notifications: document.getElementById('notificationsEnabled').checked,
            keywords: document.getElementById('keywordMonitoring').value.split(',').map(k => k.trim()).filter(k => k)
        };

        this.settings.automation = settings;
        await this.saveSettings();
        this.addActivity('Automation settings saved');
    }

    async exportData() {
        const exportData = {
            contacts: this.data.contacts,
            chats: this.data.chats,
            messages: this.data.messages,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `whatsapp-manager-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.addActivity('Data exported successfully');
    }

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                
                if (importData.contacts) this.data.contacts = importData.contacts;
                if (importData.chats) this.data.chats = importData.chats;
                if (importData.messages) this.data.messages = importData.messages;
                if (importData.settings) this.settings = importData.settings;
                
                this.updateContactsList();
                this.updateMessagesList();
                this.updateChatsFilter();
                this.updateStats();
                await this.saveSettings();
                
                this.addActivity('Data imported successfully');
            } catch (error) {
                this.addActivity('Failed to import data: ' + error.message, 'error');
            }
        };
        
        input.click();
    }

    async clearAllData() {
        if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            return;
        }

        this.data = {
            contacts: [],
            chats: [],
            messages: [],
            stats: { totalMessages: 0, totalContacts: 0, totalChats: 0 }
        };
        
        this.settings = {};
        this.activityLog = [];
        
        this.updateContactsList();
        this.updateMessagesList();
        this.updateChatsFilter();
        this.updateStats();
        this.updateActivityList();
        
        await this.saveSettings();
        this.addActivity('All data cleared');
    }

    addActivity(message, type = 'info') {
        const activity = {
            message,
            type,
            timestamp: new Date().toISOString()
        };
        
        this.activityLog.unshift(activity);
        
        // Keep only last 50 activities
        if (this.activityLog.length > 50) {
            this.activityLog = this.activityLog.slice(0, 50);
        }
        
        this.updateActivityList();
    }

    updateActivityList() {
        const container = document.getElementById('activityList');
        
        container.innerHTML = this.activityLog.map(activity => `
            <div class="activity-item">
                <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                <span>${activity.message}</span>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        switch (type) {
            case 'error': return 'exclamation-triangle';
            case 'success': return 'check-circle';
            case 'warning': return 'exclamation-circle';
            default: return 'info-circle';
        }
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['settings', 'activityLog']);
            this.settings = result.settings || {};
            this.activityLog = result.activityLog || [];
            
            // Apply settings to UI
            this.applySettingsToUI();
            this.updateActivityList();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.local.set({
                settings: this.settings,
                activityLog: this.activityLog
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    applySettingsToUI() {
        // Apply automation settings
        if (this.settings.automation) {
            const auto = this.settings.automation.autoReply;
            if (auto) {
                document.getElementById('autoReplyEnabled').checked = auto.enabled;
                document.getElementById('autoReplyMessage').value = auto.message || '';
                document.getElementById('autoReplyDelay').value = auto.delay || 5;
            }
            
            document.getElementById('messageLoggingEnabled').checked = this.settings.automation.messageLogging || false;
            document.getElementById('notificationsEnabled').checked = this.settings.automation.notifications || false;
            document.getElementById('keywordMonitoring').value = (this.settings.automation.keywords || []).join(', ');
        }
    }

    async sendToBackground(message) {
        return new Promise((resolve, reject) => {
            // Try to connect to background script via port first
            if (!this.backgroundPort) {
                try {
                    this.backgroundPort = chrome.runtime.connect({ name: 'sidebar' });
                    
                    this.backgroundPort.onMessage.addListener((response) => {
                        if (response.type === 'script_response') {
                            resolve(response.data);
                        } else if (response.type === 'connection_status') {
                            resolve(response.data);
                        } else if (response.type === 'whatsapp_opened') {
                            resolve(response.data);
                        } else if (response.type === 'error') {
                            reject(new Error(response.data.error));
                        }
                    });
                    
                    this.backgroundPort.onDisconnect.addListener(() => {
                        this.backgroundPort = null;
                    });
                } catch (error) {
                    console.warn('Port connection failed, falling back to sendMessage:', error);
                }
            }
            
            // Send message via port if available, otherwise use sendMessage
            if (this.backgroundPort) {
                this.backgroundPort.postMessage(message);
            } else {
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            }
        });
    }

    handleBackgroundMessage(message) {
        if (message.type === 'whatsapp_event') {
            const { type, data } = message.data;
            
            switch (type) {
                case 'integration_ready':
                    this.updateConnectionStatus(true, 'connected');
                    this.addActivity('WhatsApp Web integration ready');
                    break;
                    
                case 'integration_failed':
                    this.updateConnectionStatus(false, 'error');
                    this.addActivity('WhatsApp Web integration failed: ' + data.error, 'error');
                    break;
                    
                case 'state_changed':
                    this.updateConnectionStatus(data.isConnected, data.state);
                    this.addActivity(`Connection state: ${data.state}`);
                    break;
                    
                case 'message_received':
                    if (this.settings.messageLogging) {
                        this.addActivity(`New message from ${data.from || data.author}`);
                    }
                    break;
                    
                case 'contacts_data':
                    if (data.contacts) {
                        this.data.contacts = data.contacts;
                        this.data.stats.totalContacts = data.contacts.length;
                        this.updateContactsList();
                        this.updateStats();
                    }
                    break;
                    
                case 'chats_data':
                    if (data.chats) {
                        this.data.chats = data.chats;
                        this.data.stats.totalChats = data.chats.length;
                        this.updateChatsFilter();
                        this.updateStats();
                    }
                    break;
                    
                case 'messages_data':
                    if (data.messages) {
                        this.data.messages = data.messages;
                        this.data.stats.totalMessages = data.messages.length;
                        this.updateMessagesList();
                        this.updateStats();
                    }
                    break;
            }
        }
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.whatsappSidebar = new WhatsAppSidebar();
});