# WhatsApp Web.js Manager Extension

A comprehensive and modern Chrome extension that provides a powerful interface for managing WhatsApp Web through the whatsapp-web.js library. This extension integrates directly with WhatsApp Web in your browser, offering advanced features for message management, contact handling, and automation.

## 🚀 Features

### Core Functionality
- **Direct WhatsApp Web Integration**: Seamlessly connects to WhatsApp Web without external dependencies
- **Real-time Message Management**: Send, receive, and manage messages directly from the extension
- **Contact Management**: View, search, and manage your WhatsApp contacts
- **Chat Management**: Access and manage all your WhatsApp chats
- **Right Sidebar Interface**: Modern sidebar interface for easy access and management

### Advanced Features
- **Message Automation**: Set up auto-replies and message monitoring
- **Data Export/Import**: Export and import your WhatsApp data
- **Real-time Notifications**: Get notified of new messages and events
- **Search & Filter**: Advanced search and filtering capabilities
- **Activity Logging**: Track all extension activities and events

### Sidebar Interface
- **Dashboard**: Overview of messages, contacts, and chats with quick actions
- **Messages Tab**: View, search, and filter messages by chat
- **Contacts Tab**: Manage contacts with search and filtering options
- **Automation Tab**: Configure auto-replies and monitoring settings
- **Settings Tab**: Extension configuration and data management

## 📦 Installation

### From Source
1. Clone the repository:
   ```bash
   git clone https://github.com/bioenable/whatsapp-web-chrome-extension.git
   cd whatsapp-web-chrome-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `build` folder

### From Release
1. Download the latest release ZIP file
2. Extract the ZIP file
3. Load the extracted folder in Chrome as described above

## 🔧 Usage

### Initial Setup
1. Install the extension
2. Open WhatsApp Web (https://web.whatsapp.com)
3. Scan the QR code with your phone
4. The extension will automatically connect to WhatsApp Web

### Using the Sidebar
1. Click the extension icon in your browser toolbar
2. The sidebar will open on the right side of your browser
3. Navigate between tabs to access different features:
   - **Dashboard**: Overview and quick actions
   - **Messages**: View and manage messages
   - **Contacts**: Manage your contacts
   - **Automation**: Configure automation settings
   - **Settings**: Extension configuration

### Key Features
- **Refresh Data**: Click the refresh button to update contacts, chats, and messages
- **Search**: Use the search boxes to filter messages and contacts
- **Export Data**: Export your WhatsApp data for backup
- **Auto-reply**: Set up automatic replies to incoming messages
- **Message Logging**: Enable logging to track all messages

## 🛠️ Technical Details

### Architecture
- **Background Script**: Manages extension state and communication
- **Content Script**: Injects into WhatsApp Web pages
- **Inject Script**: Integrates with WhatsApp Web's internal APIs
- **Sidebar**: Modern UI for extension management
- **Popup**: Quick access interface

### Communication Flow
1. **Background Script** ↔ **Content Script**: Manages WhatsApp Web integration
2. **Content Script** ↔ **Inject Script**: Executes WhatsApp Web operations
3. **Sidebar** ↔ **Background Script**: UI interactions and data requests
4. **WhatsApp Web** ↔ **Inject Script**: Direct API access

### Fixed Issues
- **Module Loading**: Resolved WhatsApp Web module dependency issues
- **Communication**: Fixed extension context invalidation errors
- **Connection**: Improved connection stability and retry mechanisms
- **UI Responsiveness**: Enhanced sidebar interface with proper state management

## 📁 Project Structure

```
whatsapp-web-chrome-extension/
├── src/
│   ├── background.js          # Background service worker
│   ├── content.js             # Content script for WhatsApp Web
│   ├── inject.js              # WhatsApp Web integration script
│   ├── sidebar.html           # Sidebar interface
│   ├── sidebar.js             # Sidebar functionality
│   ├── sidebar.css            # Sidebar styling
│   ├── popup.html             # Extension popup
│   ├── options.html           # Options page
│   └── manifest.json          # Extension manifest
├── lib/                       # whatsapp-web.js library
├── styles/                    # CSS styles
├── icons/                     # Extension icons
├── build/                     # Built extension
├── package.json               # Project configuration
└── README.md                  # This file
```

## 🔒 Permissions

The extension requires the following permissions:
- `storage`: Save settings and data
- `activeTab`: Access current tab
- `tabs`: Manage browser tabs
- `sidePanel`: Display sidebar interface
- `notifications`: Show desktop notifications
- `background`: Run background processes
- `downloads`: Export data
- `clipboardWrite/Read`: Copy/paste functionality

## 🚨 Important Notes

### WhatsApp Web Requirements
- You must be logged into WhatsApp Web for the extension to work
- The extension only works on https://web.whatsapp.com
- Keep WhatsApp Web open for the extension to function

### Privacy & Security
- The extension only accesses WhatsApp Web data
- No data is sent to external servers
- All data is stored locally in your browser
- You can export and delete your data at any time

### Limitations
- The extension requires WhatsApp Web to be open
- Some features may be limited by WhatsApp Web's API
- The extension cannot bypass WhatsApp Web's security measures

## 🐛 Troubleshooting

### Common Issues

**Extension shows "Disconnected"**
- Make sure WhatsApp Web is open and you're logged in
- Refresh the WhatsApp Web page
- Check if the extension is enabled

**"Extension context invalidated" error**
- Reload the extension from chrome://extensions/
- Close and reopen WhatsApp Web
- Clear browser cache and cookies

**Sidebar not loading**
- Check if the extension has the `sidePanel` permission
- Try refreshing the page
- Restart the browser

**Messages not loading**
- Ensure you're logged into WhatsApp Web
- Check the browser console for errors
- Try refreshing the data from the sidebar

### Debug Mode
1. Open Chrome DevTools
2. Go to the Console tab
3. Look for messages starting with "WhatsApp Web.js Manager"
4. Check for any error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - The underlying WhatsApp Web library
- Chrome Extension APIs - For the extension framework
- WhatsApp Web - For the web interface

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Include browser version, extension version, and error messages

---

**Note**: This extension is not affiliated with WhatsApp Inc. Use at your own risk and in compliance with WhatsApp's Terms of Service.
