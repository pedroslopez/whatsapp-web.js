# WhatsApp Web.js Manager - Chrome Extension

<div align="center">
    <img src="icons/icon128.png" alt="WhatsApp Web.js Manager" width="128" height="128">
    <h2>A comprehensive Chrome extension for managing WhatsApp Web</h2>
    <p>
        <img src="https://img.shields.io/badge/Chrome-Extension-brightgreen.svg" alt="Chrome Extension" />
        <img src="https://img.shields.io/badge/Manifest-V3-blue.svg" alt="Manifest V3" />
        <img src="https://img.shields.io/badge/License-Apache%202.0-yellow.svg" alt="License" />
    </p>
</div>

## 🚀 Features

### 📊 **Dashboard & Monitoring**
- Real-time connection status with WhatsApp Web
- Message statistics and analytics
- Contact and group management
- Media file organization

### 🤖 **Automation & Auto-Reply**
- Customizable auto-reply messages
- Keyword-based message monitoring
- Scheduled message sending
- Smart response templates

### 🔧 **Advanced Management**
- Export/import chat data
- Message search and filtering
- Contact organization tools
- Group administration features

### 🛡️ **Privacy & Security**
- Local data storage (no cloud sync)
- Encrypted message logs
- Secure session management
- Privacy-focused design

## 📥 Installation

### Method 1: Chrome Web Store (Recommended)
*Coming Soon - Extension is under review*

### Method 2: Direct Installation from GitHub
1. **Download the latest release** from [GitHub Releases](https://github.com/bioenable/whatsapp-web.js/releases)
2. **Extract the ZIP file** to a folder on your computer
3. **Follow the Manual Installation steps below**

### Method 3: Manual Installation (Developer Mode)

1. **Download the Extension**
   ```bash
   git clone https://github.com/bioenable/whatsapp-web.js.git
   cd whatsapp-web.js
   ```

2. **Enable Developer Mode in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the downloaded extension folder
   - The extension should now appear in your Chrome toolbar

## 🎯 Quick Start

1. **Install the Extension** following the instructions above

2. **Open WhatsApp Web**
   - Navigate to [web.whatsapp.com](https://web.whatsapp.com)
   - Log in with your WhatsApp account

3. **Access the Extension**
   - Click the WhatsApp Web.js Manager icon in your Chrome toolbar
   - The extension popup will show your connection status

4. **Configure Settings**
   - Right-click the extension icon and select "Options"
   - Configure auto-reply, monitoring, and other features

## 🔧 Usage

### Setting Up Auto-Reply
1. Open the extension popup
2. Navigate to the "Automation" tab
3. Enable auto-reply and set your message
4. Configure delay and trigger conditions

### Message Monitoring
1. Go to extension Options (right-click icon → Options)
2. Enable message logging and notifications
3. Set up keyword monitoring for important messages

### Contact Management
1. Use the "Contacts" tab in the extension popup
2. View, search, and organize your contacts
3. Export contact lists for backup

## 🛠️ Configuration

The extension offers comprehensive configuration options:

### Auto-Reply Settings
- **Enable/Disable**: Toggle auto-reply functionality
- **Message Templates**: Create custom response messages
- **Delay Settings**: Configure response timing (1-60 seconds)
- **Trigger Conditions**: Set when auto-reply should activate

### Monitoring Options
- **Message Logging**: Keep local logs of conversations
- **Keyword Alerts**: Get notified for specific words/phrases
- **Desktop Notifications**: Chrome notification integration

### Connection Settings
- **Auto-Reconnect**: Automatically reconnect on connection loss
- **Session Timeout**: Configure inactive session handling
- **Backup Settings**: Automatic data backup options

## 📁 File Structure

```
whatsapp-web.js/
├── manifest.json          # Extension manifest (Chrome Extension config)
├── background.js          # Service worker (main extension logic)
├── popup.html            # Extension popup interface
├── content.js            # Content script (injected into WhatsApp Web)
├── inject.js             # Page script (interacts with WhatsApp Web)
├── options.html          # Extension settings page
├── lib/                  # Local whatsapp-web.js library
│   ├── index.js          # Main library entry point
│   ├── src/              # Library source files
│   └── package.json      # Library package info
├── styles/
│   └── popup.css         # Styling for popup interface
├── icons/
│   ├── icon16.png        # Extension icons (various sizes)
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🔒 Permissions

The extension requires the following permissions:

- **storage**: To save your settings and preferences
- **activeTab**: To interact with WhatsApp Web pages
- **notifications**: To show desktop notifications
- **background**: To run background processes
- **downloads**: To export data and media files
- **clipboardWrite/Read**: For copy/paste functionality

## 🚨 Important Notes

> **⚠️ Disclaimer**: This extension is not officially affiliated with WhatsApp or Meta. Use at your own risk. WhatsApp may block accounts that use unofficial tools.

- This extension works only with [web.whatsapp.com](https://web.whatsapp.com)
- Ensure you're logged into WhatsApp Web before using extension features
- Some features may stop working if WhatsApp updates their web interface
- Keep the extension updated for the best experience

## 🐛 Troubleshooting

### Extension Not Working
1. Refresh the WhatsApp Web page
2. Disable and re-enable the extension
3. Check if you're logged into WhatsApp Web
4. Try restarting Chrome

### Auto-Reply Not Responding
1. Verify auto-reply is enabled in settings
2. Check the message delay settings
3. Ensure you're not in an active conversation
4. Verify WhatsApp Web connection status

### Connection Issues
1. Check your internet connection
2. Refresh WhatsApp Web page
3. Clear browser cache and cookies
4. Try incognito mode

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) library
- Icons from various open-source icon libraries
- Chrome Extension documentation and community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/bioenable/whatsapp-web.js/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bioenable/whatsapp-web.js/discussions)
- **Email**: support@bioenable.com

---

<div align="center">
    <p>Made with ❤️ for the WhatsApp Web community</p>
    <p>⭐ Star this repository if you find it helpful!</p>
</div>
