// Global state
let socket;
let currentChatId = null;
let currentTab = 'chats';
let chatsData = [];
let contactsData = [];

// Initialize Socket.IO connection
function initSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
        showToast('Connected to server', 'success');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateStatus('disconnected', 'Disconnected');
        showToast('Disconnected from server', 'error');
    });

    socket.on('status', (data) => {
        handleStatus(data);
    });

    socket.on('qr', (qr) => {
        showQRCode(qr);
    });

    socket.on('loading', (data) => {
        showLoading(data.percent, data.message);
    });

    socket.on('authenticated', () => {
        hideQRCode();
        showToast('Authentication successful!', 'success');
    });

    socket.on('auth_failure', (msg) => {
        showToast('Authentication failed: ' + msg, 'error');
    });

    socket.on('ready', (info) => {
        hideLoading();
        showDashboard(info);
        loadChats();
        loadContacts();
        updateStatus('connected', 'Connected');
        showToast('WhatsApp is ready!', 'success');
    });

    socket.on('message', (message) => {
        handleNewMessage(message);
        addActivity(`New message from ${message.contactName}`);
    });

    socket.on('message_ack', (data) => {
        updateMessageAck(data.id, data.ack);
    });

    socket.on('disconnected', (reason) => {
        updateStatus('disconnected', 'Disconnected');
        showToast('WhatsApp disconnected: ' + reason, 'error');
    });

    socket.on('state_change', (state) => {
        console.log('State changed:', state);
    });
}

// Status handler
function handleStatus(data) {
    if (data.ready) {
        showDashboard(data.info);
        loadChats();
        loadContacts();
        updateStatus('connected', 'Connected');
    } else if (data.hasQR && data.qr) {
        showQRCode(data.qr);
        updateStatus('loading', 'Waiting for QR scan');
    } else {
        updateStatus('loading', 'Initializing...');
    }
}

// Update status indicator
function updateStatus(status, text) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    indicator.className = 'status-indicator ' + status;
    statusText.textContent = text;

    if (status === 'connected') {
        document.getElementById('logoutBtn').style.display = 'flex';
    } else {
        document.getElementById('logoutBtn').style.display = 'none';
    }
}

// Show QR Code
function showQRCode(qr) {
    hideLoading();
    hideDashboard();

    const qrSection = document.getElementById('qrSection');
    const qrImage = document.getElementById('qrImage');

    qrImage.src = qr;
    qrSection.style.display = 'flex';
}

// Hide QR Code
function hideQRCode() {
    const qrSection = document.getElementById('qrSection');
    qrSection.style.display = 'none';
}

// Show loading
function showLoading(percent, message) {
    hideQRCode();
    hideDashboard();

    const loadingSection = document.getElementById('loadingSection');
    const loadingMessage = document.getElementById('loadingMessage');
    const progressFill = document.getElementById('progressFill');
    const loadingPercent = document.getElementById('loadingPercent');

    loadingMessage.textContent = message || 'Loading...';
    progressFill.style.width = percent + '%';
    loadingPercent.textContent = percent + '%';
    loadingSection.style.display = 'flex';
}

// Hide loading
function hideLoading() {
    const loadingSection = document.getElementById('loadingSection');
    loadingSection.style.display = 'none';
}

// Show dashboard
function showDashboard(info) {
    hideQRCode();
    hideLoading();

    const dashboard = document.getElementById('dashboard');
    dashboard.style.display = 'grid';

    if (info && info.info) {
        const userName = document.getElementById('userName');
        const userNumber = document.getElementById('userNumber');
        const batteryLevel = document.getElementById('batteryLevel');

        userName.textContent = info.info.pushname || 'User';
        userNumber.textContent = info.info.wid.user || '';

        if (info.battery !== undefined) {
            batteryLevel.textContent = info.battery + '%';
        }
    }
}

// Hide dashboard
function hideDashboard() {
    const dashboard = document.getElementById('dashboard');
    dashboard.style.display = 'none';
}

// Load chats
async function loadChats() {
    try {
        const response = await fetch('/api/chats');
        const chats = await response.json();

        chatsData = chats;
        renderChats(chats);

        const totalChats = document.getElementById('totalChats');
        const unreadMessages = document.getElementById('unreadMessages');

        totalChats.textContent = chats.length;
        unreadMessages.textContent = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
    } catch (error) {
        console.error('Error loading chats:', error);
        showToast('Failed to load chats', 'error');
    }
}

// Load contacts
async function loadContacts() {
    try {
        const response = await fetch('/api/contacts');
        const contacts = await response.json();

        contactsData = contacts;

        const totalContacts = document.getElementById('totalContacts');
        totalContacts.textContent = contacts.length;
    } catch (error) {
        console.error('Error loading contacts:', error);
        showToast('Failed to load contacts', 'error');
    }
}

// Render chats
function renderChats(chats) {
    const chatList = document.getElementById('chatList');

    if (chats.length === 0) {
        chatList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No chats available</p>
            </div>
        `;
        return;
    }

    chatList.innerHTML = chats.map(chat => {
        const icon = chat.isGroup ? 'fa-users' : 'fa-user';
        const time = formatTimestamp(chat.timestamp);

        return `
            <div class="chat-item" data-chat-id="${chat.id}">
                <div class="avatar">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="chat-item-info">
                    <div class="chat-item-header">
                        <span class="chat-item-name">${chat.name}</span>
                        <span class="chat-item-time">${time}</span>
                    </div>
                    <div class="chat-item-message">
                        ${chat.isGroup ? '👥 Group Chat' : 'Click to view messages'}
                    </div>
                </div>
                ${chat.unreadCount > 0 ? `<div class="chat-item-badge">${chat.unreadCount}</div>` : ''}
            </div>
        `;
    }).join('');

    // Add click handlers
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
            const chatId = item.dataset.chatId;
            openChat(chatId);
        });
    });
}

// Render contacts
function renderContacts(contacts) {
    const chatList = document.getElementById('chatList');

    if (contacts.length === 0) {
        chatList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-address-book"></i>
                <p>No contacts available</p>
            </div>
        `;
        return;
    }

    chatList.innerHTML = contacts.map(contact => {
        const icon = contact.isGroup ? 'fa-users' : (contact.isBusiness ? 'fa-briefcase' : 'fa-user');

        return `
            <div class="chat-item" data-chat-id="${contact.id}">
                <div class="avatar">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="chat-item-info">
                    <div class="chat-item-header">
                        <span class="chat-item-name">${contact.name || contact.number}</span>
                    </div>
                    <div class="chat-item-message">
                        ${contact.number}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => {
            const chatId = item.dataset.chatId;
            openChat(chatId);
        });
    });
}

// Open chat
async function openChat(chatId) {
    currentChatId = chatId;

    // Update active state
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-chat-id="${chatId}"]`)?.classList.add('active');

    // Show active chat
    document.getElementById('emptyChatState').style.display = 'none';
    document.getElementById('activeChat').style.display = 'flex';

    // Load chat details
    try {
        const response = await fetch(`/api/chat/${chatId}`);
        const chat = await response.json();

        document.getElementById('activeChatName').textContent = chat.name;
        document.getElementById('activeChatStatus').textContent = chat.isGroup ? `Group · ${chat.name}` : 'Online';

        // Load messages
        loadMessages(chatId);
    } catch (error) {
        console.error('Error opening chat:', error);
        showToast('Failed to open chat', 'error');
    }
}

// Load messages
async function loadMessages(chatId) {
    try {
        const response = await fetch(`/api/messages/${chatId}`);
        const messages = await response.json();

        renderMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        showToast('Failed to load messages', 'error');
    }
}

// Render messages
function renderMessages(messages) {
    const messagesContainer = document.getElementById('messages');

    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No messages yet</p>
            </div>
        `;
        return;
    }

    messagesContainer.innerHTML = messages.map(msg => {
        const messageClass = msg.fromMe ? 'message-sent' : 'message-received';
        const ackIcon = getAckIcon(msg.ack);
        const time = formatTimestamp(msg.timestamp);

        return `
            <div class="message ${messageClass}" data-message-id="${msg.id}">
                <div class="message-body">${escapeHtml(msg.body)}</div>
                <div class="message-meta">
                    <span class="message-time">${time}</span>
                    ${msg.fromMe ? `<span class="message-ack ack-${getAckClass(msg.ack)}">${ackIcon}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Scroll to bottom
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message || !currentChatId) return;

    try {
        const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chatId: currentChatId,
                message: message
            })
        });

        const result = await response.json();

        if (result.success) {
            input.value = '';
            loadMessages(currentChatId);
            showToast('Message sent!', 'success');
            addActivity(`Message sent to ${document.getElementById('activeChatName').textContent}`);
        } else {
            showToast('Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
    }
}

// Mark as read
async function markAsRead() {
    if (!currentChatId) return;

    try {
        const response = await fetch(`/api/chat/${currentChatId}/read`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Marked as read', 'success');
            loadChats();
        }
    } catch (error) {
        console.error('Error marking as read:', error);
        showToast('Failed to mark as read', 'error');
    }
}

// Handle new message
function handleNewMessage(message) {
    // Reload chats to update unread count
    loadChats();

    // If message is for current chat, reload messages
    if (currentChatId && (message.from === currentChatId || message.to === currentChatId)) {
        loadMessages(currentChatId);
    }

    // Show notification
    if (!message.fromMe) {
        showToast(`New message from ${message.contactName}`, 'info');
    }
}

// Update message acknowledgement
function updateMessageAck(messageId, ack) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        const ackElement = messageElement.querySelector('.message-ack');
        if (ackElement) {
            ackElement.className = `message-ack ack-${getAckClass(ack)}`;
            ackElement.innerHTML = getAckIcon(ack);
        }
    }
}

// Add activity
function addActivity(text) {
    const activityList = document.getElementById('activityList');
    const time = new Date().toLocaleTimeString();

    const existingEmpty = activityList.querySelector('.empty-state');
    if (existingEmpty) {
        activityList.innerHTML = '';
    }

    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
        <div>${text}</div>
        <div class="time">${time}</div>
    `;

    activityList.insertBefore(activityItem, activityList.firstChild);

    // Keep only last 10 activities
    while (activityList.children.length > 10) {
        activityList.removeChild(activityList.lastChild);
    }
}

// Logout
async function logout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Logged out successfully', 'success');
            location.reload();
        }
    } catch (error) {
        console.error('Error logging out:', error);
        showToast('Failed to logout', 'error');
    }
}

// Restart
async function restart() {
    if (!confirm('Are you sure you want to restart the client?')) return;

    try {
        const response = await fetch('/api/restart', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Restarting client...', 'info');
            updateStatus('loading', 'Restarting...');
            hideDashboard();
        }
    } catch (error) {
        console.error('Error restarting:', error);
        showToast('Failed to restart', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Utility functions
function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;

    if (diff < 86400000) { // Less than 24 hours
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) { // Less than 7 days
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function getAckIcon(ack) {
    switch (ack) {
        case -1: return '<i class="fas fa-exclamation-circle"></i>';
        case 0: return '<i class="fas fa-clock"></i>';
        case 1: return '<i class="fas fa-check"></i>';
        case 2: return '<i class="fas fa-check-double"></i>';
        case 3: return '<i class="fas fa-check-double"></i>';
        case 4: return '<i class="fas fa-check-double"></i>';
        default: return '';
    }
}

function getAckClass(ack) {
    switch (ack) {
        case -1: return 'error';
        case 0: return 'sent';
        case 1: return 'sent';
        case 2: return 'delivered';
        case 3: return 'read';
        case 4: return 'read';
        default: return 'sent';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Search functionality
function handleSearch(query) {
    const searchTerm = query.toLowerCase();

    if (currentTab === 'chats') {
        const filtered = chatsData.filter(chat =>
            chat.name.toLowerCase().includes(searchTerm)
        );
        renderChats(filtered);
    } else {
        const filtered = contactsData.filter(contact =>
            (contact.name && contact.name.toLowerCase().includes(searchTerm)) ||
            contact.number.includes(searchTerm)
        );
        renderContacts(filtered);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize socket connection
    initSocket();

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentTab = btn.dataset.tab;

            if (currentTab === 'chats') {
                renderChats(chatsData);
            } else {
                renderContacts(contactsData);
            }
        });
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // Send message
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');

    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Mark as read
    const markReadBtn = document.getElementById('markReadBtn');
    markReadBtn.addEventListener('click', markAsRead);

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', logout);

    // Restart
    const restartBtn = document.getElementById('restartBtn');
    restartBtn.addEventListener('click', restart);
});
