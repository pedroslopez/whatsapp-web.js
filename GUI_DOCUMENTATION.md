# WhatsApp Web.js - Web GUI Manager

## Overview

This repository now includes a **comprehensive web-based GUI** for managing your WhatsApp Web.js application! 🎉

The GUI provides a modern, feature-rich interface to control WhatsApp, send/receive messages, manage chats, and monitor activity in real-time.

## Quick Access

### Fast Start (3 Simple Commands)

```bash
cd gui
npm install
npm start
```

Then open: **http://localhost:3000**

### Even Faster Start (One Command)

```bash
./START_GUI.sh
```

## Features at a Glance

✅ **Real-time Messaging** - Send and receive WhatsApp messages
✅ **QR Code Authentication** - Easy setup with QR code scanning
✅ **Chat Management** - View all chats, contacts, and groups
✅ **Live Updates** - Real-time notifications via WebSocket
✅ **Contact Directory** - Browse and manage contacts
✅ **Message Receipts** - See delivery and read status
✅ **Activity Monitor** - Track recent activity
✅ **Statistics Dashboard** - View counts and battery status
✅ **Beautiful Dark Theme** - Modern, eye-friendly interface
✅ **Responsive Design** - Works on desktop and mobile

## Directory Structure

```
whatsapp-web.js/
├── gui/                      # GUI Application (NEW!)
│   ├── server.js            # Express + Socket.IO server
│   ├── package.json         # GUI dependencies
│   ├── public/              # Frontend files
│   │   ├── index.html       # Main interface
│   │   ├── css/
│   │   │   └── style.css    # Styling
│   │   └── js/
│   │       └── app.js       # Frontend logic
│   ├── README.md            # Full documentation
│   ├── QUICK_START.md       # Quick start guide
│   └── .gitignore
├── START_GUI.sh             # Quick startup script
└── [existing whatsapp-web.js files...]
```

## Documentation

- **📖 Full Guide**: [gui/README.md](gui/README.md)
- **⚡ Quick Start**: [gui/QUICK_START.md](gui/QUICK_START.md)
- **📚 Main Docs**: https://docs.wwebjs.dev/

## How to Use

### First Time Setup

1. **Navigate to GUI directory**
   ```bash
   cd gui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open browser**
   - Go to: `http://localhost:3000`

5. **Scan QR Code**
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices → Link a Device
   - Scan the QR code shown on screen

6. **Start messaging!**
   - Dashboard loads automatically
   - Click any chat to start messaging

### Daily Use

Simply run:
```bash
./START_GUI.sh
```

Or:
```bash
cd gui && npm start
```

## Access URLs

- **Local**: `http://localhost:3000`
- **Network**: `http://YOUR_IP:3000`

To find your IP:
- **Windows**: `ipconfig`
- **Mac/Linux**: `ifconfig` or `ip addr`

## Main Interface

### Header
- ✅ Connection status indicator
- 🔐 Logout button
- 🔄 Restart button

### Sidebar
- 👤 Your WhatsApp profile
- 💬 Chats / 📞 Contacts tabs
- 🔍 Search functionality
- 📋 List of all conversations

### Chat Area
- 💬 Message history
- ⌨️ Message input
- ✅ Mark as read button
- 📊 Delivery receipts

### Info Panel
- 📊 Total chats
- ✉️ Unread messages
- 👥 Total contacts
- 🔋 Phone battery level
- 🔔 Recent activity feed

## Features in Detail

### Real-Time Messaging
- Send and receive messages instantly
- See typing indicators
- Get message delivery notifications
- View read receipts

### Session Management
- QR code authentication
- Session persistence (scan once)
- Auto-reconnection
- Logout and restart options

### Chat Management
- View all individual and group chats
- Search through conversations
- See unread message counts
- Mark chats as read

### Contact Management
- Browse all contacts
- Search contacts
- View contact details
- Start new conversations

### Activity Monitoring
- Live activity feed
- Real-time statistics
- Battery status monitoring
- Connection status tracking

## Configuration

### Change Port

Edit `gui/server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Change port here
```

Or use environment variable:
```bash
PORT=8080 npm start
```

### Customize Session

Edit `gui/server.js`:
```javascript
authStrategy: new LocalAuth({
    clientId: 'your-custom-name'
})
```

## API Endpoints

The GUI provides REST API endpoints:

### Information
- `GET /api/status` - Client status
- `GET /api/chats` - All chats
- `GET /api/contacts` - All contacts
- `GET /api/chat/:chatId` - Chat details
- `GET /api/messages/:chatId` - Chat messages

### Actions
- `POST /api/send-message` - Send message
- `POST /api/chat/:chatId/read` - Mark as read
- `POST /api/logout` - Logout
- `POST /api/restart` - Restart client

### WebSocket Events
- `qr` - QR code received
- `loading` - Loading progress
- `authenticated` - Auth successful
- `ready` - Client ready
- `message` - New message
- `message_ack` - Message acknowledgment
- `disconnected` - Client disconnected

## Troubleshooting

### QR Code Not Showing
- Wait 30-60 seconds for initialization
- Restart the server
- Clear browser cache

### Can't Connect
- Check if port 3000 is available
- Verify firewall settings
- Try different browser

### Messages Not Sending
- Check connection status (should be green)
- Verify chat is selected
- Restart client if needed

### Session Lost
- Check if `.wwebjs_auth` folder exists
- Don't logout from WhatsApp Web on phone
- Ensure stable internet connection

See [gui/README.md](gui/README.md) for detailed troubleshooting.

## Security Notes

⚠️ **Important**:

1. **No Authentication**: GUI has no login - anyone with URL access can control WhatsApp
2. **Local Use**: Best for local/trusted networks
3. **HTTPS**: Use reverse proxy for remote access
4. **Firewall**: Restrict port 3000 access

For production use, implement authentication and use HTTPS.

## Tech Stack

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **WhatsApp**: whatsapp-web.js library
- **Real-time**: WebSocket (Socket.IO)
- **QR Codes**: qrcode library
- **Browser**: Puppeteer

## Requirements

- Node.js v18.0.0+
- npm (comes with Node.js)
- Modern web browser
- WhatsApp account

## Development

To contribute or modify:

1. **Frontend**: Edit files in `gui/public/`
2. **Backend**: Modify `gui/server.js`
3. **Styling**: Update `gui/public/css/style.css`
4. **Logic**: Change `gui/public/js/app.js`

For auto-reload during development:
```bash
npm run dev  # Requires nodemon
```

## Support & Resources

- **Full Documentation**: [gui/README.md](gui/README.md)
- **Quick Start**: [gui/QUICK_START.md](gui/QUICK_START.md)
- **WhatsApp Web.js**: https://github.com/pedroslopez/whatsapp-web.js
- **Guide**: https://guide.wwebjs.dev/

## What's Next?

Possible enhancements:
- Media message support (images, videos, audio)
- Group management features
- File upload functionality
- Message search
- Analytics dashboard
- Multi-language support
- Custom themes
- User authentication

## License

This GUI is built on whatsapp-web.js (Apache-2.0 License).

---

## Screenshots Preview

### QR Code Authentication
- Clean QR code display
- Step-by-step instructions
- Loading progress indicator

### Dashboard
- Dark theme interface
- Three-panel layout
- Real-time updates

### Chat Interface
- Message bubbles with timestamps
- Delivery receipts
- Clean message input

### Statistics Panel
- Live chat counts
- Unread messages
- Battery status
- Activity feed

---

**Ready to start? Run `./START_GUI.sh` and enjoy! 🚀**

For questions or issues, check the [Full Documentation](gui/README.md).
