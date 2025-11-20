# WhatsApp Web.js GUI Manager

A comprehensive web-based GUI for managing WhatsApp Web.js applications. This modern, feature-rich interface allows you to control your WhatsApp bot, send/receive messages, manage chats, and monitor activity in real-time.

## Features

- **Real-time Messaging**: Send and receive WhatsApp messages through a clean web interface
- **QR Code Authentication**: Easy authentication with QR code scanning
- **Chat Management**: View all your chats, contacts, and groups
- **Live Updates**: Real-time message notifications via WebSocket
- **Contact Directory**: Browse and manage your WhatsApp contacts
- **Message Acknowledgments**: See delivery and read receipts
- **Activity Monitor**: Track recent WhatsApp activity
- **Statistics Dashboard**: View chat counts, unread messages, and battery status
- **Dark Theme**: Beautiful dark-themed interface optimized for long usage
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18.0.0 or higher)
- **npm** (comes with Node.js)
- A WhatsApp account with phone access for QR code scanning

## Installation

### Step 1: Navigate to the GUI directory

```bash
cd gui
```

### Step 2: Install dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (web server)
- Socket.IO (real-time communication)
- QRCode (QR code generation)
- whatsapp-web.js (WhatsApp API)

### Step 3: Start the server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Accessing the GUI

Once the server starts, you'll see:

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   WhatsApp Web.js GUI Manager                                 ║
║                                                               ║
║   Server running on: http://localhost:3000                    ║
║                                                               ║
║   Open this URL in your browser to manage WhatsApp           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

### Access Instructions:

1. **Open your web browser** (Chrome, Firefox, Safari, Edge)
2. **Navigate to**: `http://localhost:3000`
3. **Wait for initialization** (this may take 30-60 seconds)
4. **Scan the QR code** when it appears

### Remote Access:

To access from another device on the same network:

1. Find your computer's IP address:
   - **Windows**: `ipconfig` in Command Prompt
   - **Mac/Linux**: `ifconfig` or `ip addr` in Terminal

2. Access via: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

3. Make sure your firewall allows port 3000

## First-Time Setup

### 1. QR Code Authentication

When you first access the GUI:

1. A **QR code** will appear on screen
2. Open **WhatsApp** on your phone
3. Go to **Settings** → **Linked Devices**
4. Tap **"Link a Device"**
5. **Scan the QR code** displayed on your screen
6. Wait for authentication (usually 5-10 seconds)

### 2. Dashboard Loading

After successful authentication:

- The dashboard will load automatically
- Your chats and contacts will be fetched
- You'll see your WhatsApp profile information
- Statistics will be displayed in the right panel

## Using the GUI

### Main Interface Sections

#### 1. **Header Bar** (Top)
- **Status Indicator**: Shows connection status (Connected/Disconnected/Loading)
- **Logout Button**: Disconnect and clear session
- **Restart Button**: Restart the WhatsApp client

#### 2. **Sidebar** (Left)
- **User Profile**: Your WhatsApp name and number
- **Tabs**: Switch between Chats and Contacts
- **Search Bar**: Find specific chats or contacts
- **Chat List**: All your conversations with unread counts

#### 3. **Chat Area** (Center)
- **Chat Header**: Contact/group name and status
- **Messages**: Conversation history with timestamps
- **Message Input**: Send new messages
- **Mark as Read**: Button to mark current chat as read

#### 4. **Info Panel** (Right)
- **Statistics**:
  - Total Chats count
  - Unread Messages count
  - Total Contacts
  - Phone Battery Level
- **Recent Activity**: Live activity feed

### Sending Messages

1. **Select a chat** from the sidebar
2. **Type your message** in the input box at the bottom
3. **Press Enter** or click the send button
4. Watch for **delivery receipts**:
   - ⏱️ Pending
   - ✓ Sent
   - ✓✓ Delivered
   - ✓✓ (blue) Read

### Managing Chats

- **Click any chat** to open it
- **Search** using the search box
- **Unread count** shown as badges
- **Switch tabs** to view Contacts instead of Chats

### Notifications

Toast notifications appear for:
- New incoming messages
- Message sent confirmations
- Connection status changes
- Errors or warnings

## Session Persistence

Your WhatsApp session is saved locally in:
```
.wwebjs_auth/session-gui-session/
```

This means:
- You only need to scan QR code **once**
- Sessions persist across server restarts
- You can close and reopen the browser without re-authenticating

To **clear your session**:
1. Click the **Logout** button in the GUI, OR
2. Delete the `.wwebjs_auth/` directory manually

## Troubleshooting

### QR Code Not Appearing

**Problem**: QR code doesn't show after starting the server

**Solutions**:
1. Wait 30-60 seconds for initialization
2. Check browser console for errors (F12)
3. Restart the server
4. Clear browser cache
5. Try a different browser

### Authentication Failed

**Problem**: QR scan fails or times out

**Solutions**:
1. Ensure phone has internet connection
2. Make sure WhatsApp is up to date
3. Try clicking "Restart" button
4. Clear session folder and try again
5. Check if WhatsApp Web works normally

### Can't Send Messages

**Problem**: Messages fail to send

**Solutions**:
1. Check if chat is actually selected
2. Verify connection status is "Connected"
3. Ensure the chat exists in WhatsApp
4. Check server console for errors
5. Restart the client

### Disconnection Issues

**Problem**: Frequently disconnects

**Solutions**:
1. Check internet connection stability
2. Ensure phone stays connected to internet
3. Don't logout from WhatsApp Web on phone
4. Check server logs for error messages
5. Restart both server and browser

### Port Already in Use

**Problem**: Error: "Port 3000 already in use"

**Solutions**:
1. Stop any other process using port 3000
2. Change port in server.js:
   ```javascript
   const PORT = process.env.PORT || 3001;
   ```
3. Or set environment variable:
   ```bash
   PORT=3001 npm start
   ```

### Puppeteer Errors

**Problem**: Browser launch errors

**Solutions**:
1. Install required dependencies:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install -y chromium-browser

   # Or install Chrome manually
   ```
2. On Linux servers, ensure X11 or use headless mode (already configured)
3. Check Puppeteer logs in server console

## Configuration

### Customizing Port

Edit `gui/server.js`:

```javascript
const PORT = process.env.PORT || 3000; // Change 3000 to your preferred port
```

Or use environment variable:

```bash
PORT=8080 npm start
```

### Session Configuration

The GUI uses LocalAuth strategy with session ID `gui-session`. To change:

Edit `gui/server.js`:

```javascript
authStrategy: new LocalAuth({
    clientId: 'your-custom-session-name'
})
```

### Puppeteer Options

Modify Puppeteer settings in `gui/server.js`:

```javascript
puppeteer: {
    headless: true,  // Set to false to see browser
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Add more args as needed
    ]
}
```

## API Endpoints

The GUI exposes these REST API endpoints:

### Status & Info
- `GET /api/status` - Get client status
- `GET /api/chats` - Get all chats
- `GET /api/contacts` - Get all contacts
- `GET /api/chat/:chatId` - Get specific chat details

### Messaging
- `GET /api/messages/:chatId` - Get messages from a chat
- `POST /api/send-message` - Send a message
- `POST /api/chat/:chatId/read` - Mark chat as read

### Client Control
- `POST /api/logout` - Logout from WhatsApp
- `POST /api/restart` - Restart the client

### WebSocket Events

Real-time events via Socket.IO:
- `qr` - QR code data
- `loading` - Loading progress
- `authenticated` - Authentication success
- `ready` - Client ready
- `message` - New message received
- `message_ack` - Message acknowledgment
- `disconnected` - Client disconnected

## Security Considerations

⚠️ **Important Security Notes**:

1. **Local Network Only**: By default, the server binds to all interfaces. For production:
   ```javascript
   server.listen(PORT, 'localhost'); // Only local access
   ```

2. **No Authentication**: The GUI has no login system. Anyone with access to the URL can control your WhatsApp. Consider:
   - Running on localhost only
   - Using a reverse proxy with authentication
   - Implementing your own auth layer

3. **HTTPS**: For remote access, use HTTPS:
   - Set up a reverse proxy (nginx, Apache)
   - Use Let's Encrypt for SSL certificates

4. **Firewall**: Restrict access to port 3000:
   ```bash
   # Allow only specific IP
   sudo ufw allow from 192.168.1.0/24 to any port 3000
   ```

## Performance Tips

1. **Message Limit**: Default fetches 50 messages. Adjust in `server.js`:
   ```javascript
   const messages = await chat.fetchMessages({ limit: 100 });
   ```

2. **Polling**: To reduce load, implement caching for contacts/chats

3. **Memory**: For long-running instances, monitor memory usage:
   ```bash
   node --max-old-space-size=4096 server.js
   ```

## Development

### File Structure

```
gui/
├── server.js              # Express + Socket.IO server
├── package.json           # Dependencies
├── public/
│   ├── index.html        # Main HTML
│   ├── css/
│   │   └── style.css     # Styles
│   └── js/
│       └── app.js        # Frontend logic
└── README.md             # This file
```

### Adding Features

To add new features:

1. **Backend**: Add routes in `server.js`
2. **Frontend**: Update `app.js` for logic and `index.html` for UI
3. **Styling**: Modify `style.css`

### Contributing

Feel free to enhance the GUI by:
- Adding media message support
- Implementing group management
- Adding file uploads
- Creating message search
- Building analytics dashboard

## Support

For issues with:
- **whatsapp-web.js**: https://github.com/pedroslopez/whatsapp-web.js
- **This GUI**: Check server console logs and browser console

## License

This GUI is built on top of whatsapp-web.js (Apache-2.0 License).

## Changelog

### Version 1.0.0
- Initial release
- QR code authentication
- Chat and contact management
- Real-time messaging
- Message acknowledgments
- Activity monitoring
- Statistics dashboard
- Dark theme UI

---

**Enjoy managing your WhatsApp with this modern GUI! 🚀**

For questions or issues, check the troubleshooting section above.
