const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// WhatsApp Client
let client = null;
let isClientReady = false;
let qrCodeData = null;
let clientInfo = null;

// Initialize WhatsApp Client
function initializeClient() {
    client = new Client({
        authStrategy: new LocalAuth({
            clientId: 'gui-session'
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
                '--disable-gpu'
            ]
        }
    });

    // QR Code event
    client.on('qr', async (qr) => {
        console.log('QR Code received');
        qrCodeData = await qrcode.toDataURL(qr);
        io.emit('qr', qrCodeData);
    });

    // Loading event
    client.on('loading_screen', (percent, message) => {
        console.log('Loading...', percent, message);
        io.emit('loading', { percent, message });
    });

    // Authenticated event
    client.on('authenticated', () => {
        console.log('Client authenticated');
        qrCodeData = null;
        io.emit('authenticated');
    });

    // Auth failure event
    client.on('auth_failure', (msg) => {
        console.error('Auth failure:', msg);
        io.emit('auth_failure', msg);
    });

    // Ready event
    client.on('ready', async () => {
        console.log('Client is ready!');
        isClientReady = true;

        // Get client info
        clientInfo = {
            info: client.info,
            platform: await client.getWWebVersion(),
            battery: await client.getBatteryLevel()
        };

        io.emit('ready', clientInfo);
    });

    // Message event
    client.on('message', async (message) => {
        console.log('Message received:', message.from);

        const chat = await message.getChat();
        const contact = await message.getContact();

        io.emit('message', {
            id: message.id._serialized,
            from: message.from,
            to: message.to,
            body: message.body,
            type: message.type,
            timestamp: message.timestamp,
            fromMe: message.fromMe,
            hasMedia: message.hasMedia,
            chatName: chat.name,
            contactName: contact.pushname || contact.name || message.from,
            isGroup: chat.isGroup
        });
    });

    // Message acknowledgement
    client.on('message_ack', (msg, ack) => {
        io.emit('message_ack', {
            id: msg.id._serialized,
            ack: ack
        });
    });

    // Disconnected event
    client.on('disconnected', (reason) => {
        console.log('Client disconnected:', reason);
        isClientReady = false;
        io.emit('disconnected', reason);
    });

    // Change state event
    client.on('change_state', (state) => {
        console.log('State changed:', state);
        io.emit('state_change', state);
    });

    // Initialize the client
    client.initialize();
}

// API Routes

// Get client status
app.get('/api/status', (req, res) => {
    res.json({
        ready: isClientReady,
        hasQR: qrCodeData !== null,
        info: clientInfo
    });
});

// Get chats
app.get('/api/chats', async (req, res) => {
    try {
        if (!isClientReady) {
            return res.status(400).json({ error: 'Client not ready' });
        }

        const chats = await client.getChats();
        const chatList = chats.map(chat => ({
            id: chat.id._serialized,
            name: chat.name,
            isGroup: chat.isGroup,
            unreadCount: chat.unreadCount,
            timestamp: chat.timestamp,
            archived: chat.archived,
            pinned: chat.pinned,
            isMuted: chat.isMuted,
            isReadOnly: chat.isReadOnly
        }));

        res.json(chatList);
    } catch (error) {
        console.error('Error getting chats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get contacts
app.get('/api/contacts', async (req, res) => {
    try {
        if (!isClientReady) {
            return res.status(400).json({ error: 'Client not ready' });
        }

        const contacts = await client.getContacts();
        const contactList = contacts
            .filter(contact => contact.isMyContact)
            .map(contact => ({
                id: contact.id._serialized,
                name: contact.name || contact.pushname,
                number: contact.number,
                isMyContact: contact.isMyContact,
                isUser: contact.isUser,
                isGroup: contact.isGroup,
                isBusiness: contact.isBusiness
            }));

        res.json(contactList);
    } catch (error) {
        console.error('Error getting contacts:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get messages from a chat
app.get('/api/messages/:chatId', async (req, res) => {
    try {
        if (!isClientReady) {
            return res.status(400).json({ error: 'Client not ready' });
        }

        const chat = await client.getChatById(req.params.chatId);
        const messages = await chat.fetchMessages({ limit: 50 });

        const messageList = messages.map(msg => ({
            id: msg.id._serialized,
            body: msg.body,
            type: msg.type,
            timestamp: msg.timestamp,
            from: msg.from,
            to: msg.to,
            fromMe: msg.fromMe,
            hasMedia: msg.hasMedia,
            ack: msg.ack
        }));

        res.json(messageList);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send message
app.post('/api/send-message', async (req, res) => {
    try {
        if (!isClientReady) {
            return res.status(400).json({ error: 'Client not ready' });
        }

        const { chatId, message } = req.body;

        if (!chatId || !message) {
            return res.status(400).json({ error: 'chatId and message are required' });
        }

        const msg = await client.sendMessage(chatId, message);

        res.json({
            success: true,
            messageId: msg.id._serialized
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
});

// Logout
app.post('/api/logout', async (req, res) => {
    try {
        if (client) {
            await client.logout();
            isClientReady = false;
            qrCodeData = null;
            clientInfo = null;
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'No active client' });
        }
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ error: error.message });
    }
});

// Restart client
app.post('/api/restart', async (req, res) => {
    try {
        if (client) {
            await client.destroy();
        }
        isClientReady = false;
        qrCodeData = null;
        clientInfo = null;

        setTimeout(() => {
            initializeClient();
        }, 1000);

        res.json({ success: true });
    } catch (error) {
        console.error('Error restarting:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get chat by ID
app.get('/api/chat/:chatId', async (req, res) => {
    try {
        if (!isClientReady) {
            return res.status(400).json({ error: 'Client not ready' });
        }

        const chat = await client.getChatById(req.params.chatId);

        res.json({
            id: chat.id._serialized,
            name: chat.name,
            isGroup: chat.isGroup,
            unreadCount: chat.unreadCount,
            timestamp: chat.timestamp,
            archived: chat.archived,
            pinned: chat.pinned,
            isMuted: chat.isMuted
        });
    } catch (error) {
        console.error('Error getting chat:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark chat as read
app.post('/api/chat/:chatId/read', async (req, res) => {
    try {
        if (!isClientReady) {
            return res.status(400).json({ error: 'Client not ready' });
        }

        const chat = await client.getChatById(req.params.chatId);
        await chat.sendSeen();

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: error.message });
    }
});

// Socket.IO events
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send current status on connection
    socket.emit('status', {
        ready: isClientReady,
        hasQR: qrCodeData !== null,
        qr: qrCodeData,
        info: clientInfo
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   WhatsApp Web.js GUI Manager                                 ║
║                                                               ║
║   Server running on: http://localhost:${PORT}                    ║
║                                                               ║
║   Open this URL in your browser to manage WhatsApp           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);

    // Initialize WhatsApp client
    initializeClient();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    if (client) {
        await client.destroy();
    }
    process.exit(0);
});
