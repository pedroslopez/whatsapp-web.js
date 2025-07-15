// WhatsApp Web.js Manager - Popup Script
class WhatsAppManager {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.contacts = [];
        this.chats = [];
        this.groups = [];
        this.currentTab = 'dashboard';
        this.scheduledMessages = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabNavigation();
        this.loadStoredData();
        this.checkConnectionStatus();
        this.updateUI();
    }

    setupEventListeners() {
        // Connection Controls
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('refreshQR').addEventListener('click', () => this.refreshQRCode());

        // Message Form
        document.getElementById('sendMessageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Message Type Changes
        document.getElementById('messageType').addEventListener('change', (e) => {
            this.toggleMessageOptions(e.target.value);
        });

        // Formatting Tools
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyFormatting(e.target.dataset.format);
            });
        });

        // Poll Options
        document.getElementById('addPollOption').addEventListener('click', () => this.addPollOption());

        // Location
        document.getElementById('getCurrentLocation').addEventListener('click', () => this.getCurrentLocation());

        // Bulk Messaging
        document.getElementById('bulkMessageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendBulkMessages();
        });

        // Contact Management
        document.getElementById('addContactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addContact();
        });
        document.getElementById('refreshContacts').addEventListener('click', () => this.loadContacts());
        document.getElementById('contactSearch').addEventListener('input', (e) => this.searchContacts(e.target.value));

        // Group Management
        document.getElementById('createGroupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGroup();
        });
        document.getElementById('joinGroupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.joinGroup();
        });
        document.getElementById('refreshGroups').addEventListener('click', () => this.loadGroups());

        // Automation
        document.getElementById('autoReplyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAutoReplySettings();
        });
        document.getElementById('saveMonitoringSettings').addEventListener('click', () => this.saveMonitoringSettings());

        // Modals
        document.getElementById('selectContact').addEventListener('click', () => this.openContactModal());
        document.getElementById('scheduleMessage').addEventListener('click', () => this.openScheduleModal());
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Media Download
        document.getElementById('downloadMedia').addEventListener('click', () => this.downloadMedia());

        // Footer Links
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('logsBtn').addEventListener('click', () => this.showLogs());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
    }

    setupTabNavigation() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Load data for specific tabs
        switch (tabName) {
            case 'contacts':
                this.loadContacts();
                break;
            case 'groups':
                this.loadGroups();
                break;
            case 'media':
                this.loadChatsForMediaDownload();
                break;
        }
    }

    async connect() {
        try {
            this.showLoading('Connecting to WhatsApp Web...');
            
            const response = await this.sendToBackground('connect');
            if (response.success) {
                this.updateConnectionStatus('connecting', 'Connecting...');
                this.showNotification('Connection initiated. Please scan QR code.', 'info');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification(`Connection failed: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async disconnect() {
        try {
            const response = await this.sendToBackground('disconnect');
            if (response.success) {
                this.updateConnectionStatus('disconnected', 'Disconnected');
                this.showNotification('Disconnected successfully', 'success');
            }
        } catch (error) {
            this.showNotification(`Disconnect failed: ${error.message}`, 'error');
        }
    }

    async restart() {
        try {
            this.showLoading('Restarting connection...');
            await this.disconnect();
            setTimeout(() => this.connect(), 2000);
        } catch (error) {
            this.showNotification(`Restart failed: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async refreshQRCode() {
        try {
            const response = await this.sendToBackground('refreshQR');
            if (response.success && response.qr) {
                this.displayQRCode(response.qr);
                this.showNotification('QR code refreshed', 'success');
            }
        } catch (error) {
            this.showNotification(`Failed to refresh QR code: ${error.message}`, 'error');
        }
    }

    async sendMessage() {
        const recipient = document.getElementById('messageRecipient').value;
        const messageType = document.getElementById('messageType').value;
        let messageData = { recipient, type: messageType };

        try {
            switch (messageType) {
                case 'text':
                    messageData.content = document.getElementById('messageText').value;
                    break;
                case 'media':
                    const file = document.getElementById('mediaFile').files[0];
                    if (!file) throw new Error('Please select a file');
                    messageData.media = await this.fileToBase64(file);
                    messageData.caption = document.getElementById('mediaCaption').value;
                    messageData.filename = file.name;
                    messageData.mimetype = file.type;
                    break;
                case 'location':
                    messageData.location = {
                        name: document.getElementById('locationName').value,
                        address: document.getElementById('locationAddress').value,
                        latitude: parseFloat(document.getElementById('locationLat').value),
                        longitude: parseFloat(document.getElementById('locationLng').value)
                    };
                    break;
                case 'poll':
                    const pollOptions = Array.from(document.querySelectorAll('.poll-option'))
                        .map(input => input.value)
                        .filter(value => value.trim());
                    messageData.poll = {
                        name: document.getElementById('pollQuestion').value,
                        options: pollOptions,
                        allowMultipleAnswers: document.getElementById('allowMultipleAnswers').checked
                    };
                    break;
            }

            this.showLoading('Sending message...');
            const response = await this.sendToBackground('sendMessage', messageData);
            
            if (response.success) {
                this.showNotification('Message sent successfully', 'success');
                this.clearMessageForm();
                this.addToRecentMessages(messageData);
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification(`Failed to send message: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async sendBulkMessages() {
        const recipients = document.getElementById('bulkRecipients').value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line);
        const message = document.getElementById('bulkMessage').value;
        const delay = parseInt(document.getElementById('bulkDelay').value) * 1000;

        if (recipients.length === 0) {
            this.showNotification('Please enter at least one recipient', 'error');
            return;
        }

        try {
            this.showLoading('Sending bulk messages...');
            let successCount = 0;
            
            for (let i = 0; i < recipients.length; i++) {
                try {
                    const response = await this.sendToBackground('sendMessage', {
                        recipient: recipients[i],
                        type: 'text',
                        content: message
                    });
                    
                    if (response.success) {
                        successCount++;
                    }
                    
                    // Delay between messages
                    if (i < recipients.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                } catch (error) {
                    console.error(`Failed to send to ${recipients[i]}:`, error);
                }
            }
            
            this.showNotification(`Sent ${successCount}/${recipients.length} messages successfully`, 'success');
        } catch (error) {
            this.showNotification(`Bulk messaging failed: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadContacts() {
        try {
            const response = await this.sendToBackground('getContacts');
            if (response.success) {
                this.contacts = response.contacts || [];
                this.displayContacts(this.contacts);
                this.updateStats();
            }
        } catch (error) {
            this.showNotification(`Failed to load contacts: ${error.message}`, 'error');
        }
    }

    async loadGroups() {
        try {
            const response = await this.sendToBackground('getGroups');
            if (response.success) {
                this.groups = response.groups || [];
                this.displayGroups(this.groups);
                this.updateStats();
            }
        } catch (error) {
            this.showNotification(`Failed to load groups: ${error.message}`, 'error');
        }
    }

    async loadChats() {
        try {
            const response = await this.sendToBackground('getChats');
            if (response.success) {
                this.chats = response.chats || [];
                this.updateStats();
            }
        } catch (error) {
            console.error('Failed to load chats:', error);
        }
    }

    async addContact() {
        const phoneNumber = document.getElementById('contactPhone').value;
        const firstName = document.getElementById('contactFirstName').value;
        const lastName = document.getElementById('contactLastName').value;

        try {
            const response = await this.sendToBackground('addContact', {
                phoneNumber,
                firstName,
                lastName
            });

            if (response.success) {
                this.showNotification('Contact added successfully', 'success');
                document.getElementById('addContactForm').reset();
                this.loadContacts();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification(`Failed to add contact: ${error.message}`, 'error');
        }
    }

    async createGroup() {
        const groupName = document.getElementById('groupName').value;
        const description = document.getElementById('groupDescription').value;
        const participants = document.getElementById('groupParticipants').value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line);

        try {
            const response = await this.sendToBackground('createGroup', {
                name: groupName,
                description,
                participants
            });

            if (response.success) {
                this.showNotification('Group created successfully', 'success');
                document.getElementById('createGroupForm').reset();
                this.loadGroups();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification(`Failed to create group: ${error.message}`, 'error');
        }
    }

    async joinGroup() {
        const inviteCode = document.getElementById('inviteCode').value;

        try {
            const response = await this.sendToBackground('joinGroup', { inviteCode });

            if (response.success) {
                this.showNotification('Joined group successfully', 'success');
                document.getElementById('joinGroupForm').reset();
                this.loadGroups();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification(`Failed to join group: ${error.message}`, 'error');
        }
    }

    // UI Helper Methods
    toggleMessageOptions(messageType) {
        document.querySelectorAll('.message-options').forEach(option => {
            option.style.display = 'none';
        });

        const optionElement = document.getElementById(`${messageType}Options`);
        if (optionElement) {
            optionElement.style.display = 'block';
        }
    }

    applyFormatting(format) {
        const textarea = document.getElementById('messageText');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        if (selectedText) {
            const formattedText = `${format}${selectedText}${format}`;
            textarea.value = text.substring(0, start) + formattedText + text.substring(end);
            textarea.focus();
            textarea.setSelectionRange(start + format.length, end + format.length);
        }
    }

    addPollOption() {
        const container = document.getElementById('pollOptionsContainer');
        const optionCount = container.querySelectorAll('.poll-option').length;
        
        if (optionCount < 12) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'poll-option';
            input.placeholder = `Option ${optionCount + 1}`;
            container.appendChild(input);
        } else {
            this.showNotification('Maximum 12 poll options allowed', 'warning');
        }
    }

    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    document.getElementById('locationLat').value = position.coords.latitude;
                    document.getElementById('locationLng').value = position.coords.longitude;
                    this.showNotification('Location obtained successfully', 'success');
                },
                (error) => {
                    this.showNotification('Failed to get location', 'error');
                }
            );
        } else {
            this.showNotification('Geolocation is not supported', 'error');
        }
    }

    displayContacts(contacts) {
        const container = document.getElementById('contactsList');
        if (!contacts || contacts.length === 0) {
            container.innerHTML = '<p class="text-center">No contacts found</p>';
            return;
        }

        container.innerHTML = contacts.map(contact => `
            <div class="list-item">
                <div class="list-item-info">
                    <div class="list-item-name">${contact.name || contact.pushname || 'Unknown'}</div>
                    <div class="list-item-details">${contact.number}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-outline btn-sm" onclick="whatsappManager.messageContact('${contact.id._serialized}')">
                        <i class="fas fa-comment"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="whatsappManager.toggleBlockContact('${contact.id._serialized}', ${contact.isBlocked})">
                        <i class="fas fa-${contact.isBlocked ? 'unlock' : 'ban'}"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayGroups(groups) {
        const container = document.getElementById('groupsList');
        if (!groups || groups.length === 0) {
            container.innerHTML = '<p class="text-center">No groups found</p>';
            return;
        }

        container.innerHTML = groups.map(group => `
            <div class="list-item">
                <div class="list-item-info">
                    <div class="list-item-name">${group.name}</div>
                    <div class="list-item-details">${group.participants?.length || 0} members</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-outline btn-sm" onclick="whatsappManager.messageGroup('${group.id._serialized}')">
                        <i class="fas fa-comment"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="whatsappManager.manageGroup('${group.id._serialized}')">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayQRCode(qr) {
        const container = document.getElementById('qrCodeContainer');
        
        // Generate QR code using a library or service
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qr)}`;
        
        container.innerHTML = `<img src="${qrCodeUrl}" alt="QR Code" style="max-width: 150px;">`;
    }

    updateConnectionStatus(status, text) {
        const statusDot = document.getElementById('connectionStatus');
        const statusText = document.getElementById('statusText');
        const detailedStatus = document.getElementById('detailedStatus');

        statusDot.className = `status-dot ${status}`;
        statusText.textContent = text;
        detailedStatus.textContent = text;

        this.isConnected = status === 'connected';
        this.updateButtons();
    }

    updateButtons() {
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const restartBtn = document.getElementById('restartBtn');
        const refreshQR = document.getElementById('refreshQR');

        connectBtn.disabled = this.isConnected;
        disconnectBtn.disabled = !this.isConnected;
        restartBtn.disabled = !this.isConnected;
        refreshQR.disabled = this.isConnected;
    }

    updateStats() {
        document.getElementById('totalChats').textContent = this.chats.length;
        document.getElementById('totalContacts').textContent = this.contacts.length;
        document.getElementById('totalGroups').textContent = this.groups.length;
        
        const unreadCount = this.chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
        document.getElementById('unreadMessages').textContent = unreadCount;
    }

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay.querySelector('p');
        text.textContent = message;
        overlay.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 16px; cursor: pointer;">&times;</button>
            </div>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    openContactModal() {
        document.getElementById('contactModal').style.display = 'block';
        this.loadContactsInModal();
    }

    openScheduleModal() {
        document.getElementById('scheduleModal').style.display = 'block';
    }

    closeModal(modal) {
        modal.style.display = 'none';
    }

    clearMessageForm() {
        document.getElementById('sendMessageForm').reset();
        this.toggleMessageOptions('text');
    }

    addToRecentMessages(messageData) {
        // Implementation for adding to recent messages list
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    async sendToBackground(action, data = {}) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action, data }, (response) => {
                resolve(response || { success: false, error: 'No response' });
            });
        });
    }

    async loadStoredData() {
        try {
            const result = await chrome.storage.local.get(['settings', 'scheduledMessages']);
            if (result.settings) {
                this.applySettings(result.settings);
            }
            if (result.scheduledMessages) {
                this.scheduledMessages = result.scheduledMessages;
            }
        } catch (error) {
            console.error('Failed to load stored data:', error);
        }
    }

    async checkConnectionStatus() {
        try {
            const response = await this.sendToBackground('getStatus');
            if (response.success) {
                this.updateConnectionStatus(response.status, response.statusText);
                if (response.clientInfo) {
                    this.updateClientInfo(response.clientInfo);
                }
            }
        } catch (error) {
            console.error('Failed to check connection status:', error);
        }
    }

    updateClientInfo(info) {
        if (info.phone) document.getElementById('phoneNumber').textContent = info.phone;
        if (info.platform) document.getElementById('deviceInfo').textContent = info.platform;
        if (info.battery) document.getElementById('batteryInfo').textContent = `${info.battery}%`;
    }

    updateUI() {
        this.updateButtons();
        this.loadChats();
    }

    // Additional helper methods for specific functionalities
    messageContact(contactId) {
        document.getElementById('messageRecipient').value = contactId;
        this.switchTab('messages');
    }

    messageGroup(groupId) {
        document.getElementById('messageRecipient').value = groupId;
        this.switchTab('messages');
    }

    async toggleBlockContact(contactId, isBlocked) {
        try {
            const action = isBlocked ? 'unblockContact' : 'blockContact';
            const response = await this.sendToBackground(action, { contactId });
            
            if (response.success) {
                const actionText = isBlocked ? 'unblocked' : 'blocked';
                this.showNotification(`Contact ${actionText} successfully`, 'success');
                this.loadContacts();
            }
        } catch (error) {
            this.showNotification(`Failed to ${isBlocked ? 'unblock' : 'block'} contact`, 'error');
        }
    }

    manageGroup(groupId) {
        // Open group management interface
        this.showNotification('Group management feature coming soon', 'info');
    }

    searchContacts(query) {
        if (!query) {
            this.displayContacts(this.contacts);
            return;
        }

        const filteredContacts = this.contacts.filter(contact => 
            (contact.name && contact.name.toLowerCase().includes(query.toLowerCase())) ||
            (contact.pushname && contact.pushname.toLowerCase().includes(query.toLowerCase())) ||
            (contact.number && contact.number.includes(query))
        );

        this.displayContacts(filteredContacts);
    }

    loadContactsInModal() {
        const container = document.getElementById('modalContactsList');
        this.displayContactsInModal(this.contacts, container);
    }

    displayContactsInModal(contacts, container) {
        if (!contacts || contacts.length === 0) {
            container.innerHTML = '<p class="text-center">No contacts found</p>';
            return;
        }

        container.innerHTML = contacts.map(contact => `
            <div class="list-item" onclick="whatsappManager.selectContact('${contact.id._serialized}', '${contact.name || contact.pushname || contact.number}')">
                <div class="list-item-info">
                    <div class="list-item-name">${contact.name || contact.pushname || 'Unknown'}</div>
                    <div class="list-item-details">${contact.number}</div>
                </div>
            </div>
        `).join('');
    }

    selectContact(contactId, contactName) {
        document.getElementById('messageRecipient').value = contactId;
        this.closeModal(document.getElementById('contactModal'));
        this.showNotification(`Selected contact: ${contactName}`, 'success');
    }

    async saveAutoReplySettings() {
        const settings = {
            enabled: document.getElementById('enableAutoReply').checked,
            message: document.getElementById('autoReplyMessage').value,
            delay: parseInt(document.getElementById('autoReplyDelay').value)
        };

        try {
            await chrome.storage.local.set({ autoReplySettings: settings });
            await this.sendToBackground('updateAutoReply', settings);
            this.showNotification('Auto-reply settings saved', 'success');
        } catch (error) {
            this.showNotification('Failed to save auto-reply settings', 'error');
        }
    }

    async saveMonitoringSettings() {
        const settings = {
            logMessages: document.getElementById('enableMessageLog').checked,
            notifications: document.getElementById('enableNotifications').checked,
            keywords: document.getElementById('keywordFilter').value.split(',').map(k => k.trim()).filter(k => k)
        };

        try {
            await chrome.storage.local.set({ monitoringSettings: settings });
            await this.sendToBackground('updateMonitoring', settings);
            this.showNotification('Monitoring settings saved', 'success');
        } catch (error) {
            this.showNotification('Failed to save monitoring settings', 'error');
        }
    }

    openSettings() {
        chrome.runtime.openOptionsPage();
    }

    showLogs() {
        // Open logs in new tab or modal
        this.showNotification('Logs feature coming soon', 'info');
    }

    showHelp() {
        // Open help documentation
        chrome.tabs.create({ url: 'https://docs.wwebjs.dev/' });
    }

    async downloadMedia() {
        const chatId = document.getElementById('chatSelect').value;
        const mediaType = document.getElementById('mediaType').value;
        const limit = parseInt(document.getElementById('downloadLimit').value);

        if (!chatId) {
            this.showNotification('Please select a chat', 'error');
            return;
        }

        try {
            this.showLoading('Downloading media...');
            const response = await this.sendToBackground('downloadMedia', {
                chatId,
                mediaType,
                limit
            });

            if (response.success) {
                this.showNotification(`Downloaded ${response.count} media files`, 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showNotification(`Media download failed: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    loadChatsForMediaDownload() {
        const select = document.getElementById('chatSelect');
        select.innerHTML = '<option value="">Select a chat...</option>';
        
        this.chats.forEach(chat => {
            const option = document.createElement('option');
            option.value = chat.id._serialized;
            option.textContent = chat.name;
            select.appendChild(option);
        });
    }

    applySettings(settings) {
        // Apply saved settings to UI
        if (settings.autoReply) {
            document.getElementById('enableAutoReply').checked = settings.autoReply.enabled || false;
            document.getElementById('autoReplyMessage').value = settings.autoReply.message || '';
            document.getElementById('autoReplyDelay').value = settings.autoReply.delay || 5;
        }

        if (settings.monitoring) {
            document.getElementById('enableMessageLog').checked = settings.monitoring.logMessages || false;
            document.getElementById('enableNotifications').checked = settings.monitoring.notifications || false;
            document.getElementById('keywordFilter').value = settings.monitoring.keywords?.join(', ') || '';
        }
    }
}

// Initialize the WhatsApp Manager when the popup loads
let whatsappManager;
document.addEventListener('DOMContentLoaded', () => {
    whatsappManager = new WhatsAppManager();
});

// Listen for background script updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (whatsappManager) {
        switch (message.type) {
            case 'connectionStatusChanged':
                whatsappManager.updateConnectionStatus(message.status, message.statusText);
                break;
            case 'qrCodeGenerated':
                whatsappManager.displayQRCode(message.qr);
                break;
            case 'messageReceived':
                whatsappManager.showNotification(`New message from ${message.from}`, 'info');
                break;
            case 'clientReady':
                whatsappManager.updateConnectionStatus('connected', 'Connected');
                whatsappManager.loadContacts();
                whatsappManager.loadGroups();
                whatsappManager.loadChats();
                break;
        }
    }
    sendResponse({ received: true });
});