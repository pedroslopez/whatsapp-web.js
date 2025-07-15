# Usage Guide - WhatsApp Web.js Manager Extension

This comprehensive guide will help you get the most out of the WhatsApp Web.js Manager Chrome Extension.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Extension Interface](#extension-interface)
3. [Features Overview](#features-overview)
4. [Auto-Reply Setup](#auto-reply-setup)
5. [Message Monitoring](#message-monitoring)
6. [Contact Management](#contact-management)
7. [Settings Configuration](#settings-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [FAQ](#faq)

## 🚀 Getting Started

### Prerequisites
- ✅ Google Chrome (version 88+)
- ✅ WhatsApp account with WhatsApp Web access
- ✅ Extension installed (see [INSTALLATION.md](INSTALLATION.md))

### First Launch
1. **Open WhatsApp Web**: Navigate to [web.whatsapp.com](https://web.whatsapp.com)
2. **Log In**: Scan the QR code with your phone
3. **Activate Extension**: Click the extension icon in your Chrome toolbar
4. **Grant Permissions**: Allow necessary permissions when prompted

## 🎛️ Extension Interface

### Main Popup Window
The extension popup contains several tabs:

#### 📊 Dashboard Tab
- **Connection Status**: Shows if you're connected to WhatsApp Web
- **Quick Stats**: Message counts, active features, etc.
- **Recent Activity**: Latest extension actions

#### 💬 Messages Tab
- **Recent Messages**: List of recent conversations
- **Quick Reply**: Send messages directly from the extension
- **Message Search**: Find specific messages

#### 👥 Contacts Tab
- **Contact List**: View all your WhatsApp contacts
- **Contact Search**: Find contacts quickly
- **Contact Actions**: Message, call, or view contact details

#### 👥 Groups Tab
- **Group List**: View all your WhatsApp groups
- **Group Management**: Admin functions for groups you manage
- **Group Search**: Find specific groups

#### 📁 Media Tab
- **Media Overview**: See recent media files
- **Download Management**: Batch download options
- **Media Search**: Find specific media files

#### 🤖 Automation Tab
- **Auto-Reply Settings**: Configure automatic responses
- **Scheduled Messages**: Set up messages to send later
- **Rules Management**: Create custom automation rules

### Settings Panel (Right-click → Options)
Access comprehensive settings through the dedicated options page.

## ✨ Features Overview

### 🤖 Auto-Reply System
Automatically respond to incoming messages based on your rules.

**Use Cases:**
- Business hours messages
- Vacation auto-responders
- FAQ responses
- Emergency contact information

### 📝 Message Monitoring
Track and alert on specific keywords or phrases.

**Use Cases:**
- Monitor mentions of your name/business
- Track important project keywords
- Customer service escalation triggers
- Compliance monitoring

### 👥 Contact Management
Enhanced contact organization and interaction.

**Features:**
- Contact search and filtering
- Bulk actions
- Contact export/import
- Interaction history

### 📊 Analytics & Reporting
Track your WhatsApp Web usage and patterns.

**Metrics:**
- Message volume
- Response times
- Active hours
- Contact interactions

## 🤖 Auto-Reply Setup

### Basic Auto-Reply

1. **Open Settings**: Right-click extension icon → Options
2. **Navigate to Auto-Reply**: Find the Auto-Reply section
3. **Enable Feature**: Toggle "Enable Auto Reply"
4. **Set Message**: Enter your auto-reply message
5. **Configure Delay**: Set response delay (1-60 seconds)
6. **Save Settings**: Click "Save Settings"

### Advanced Auto-Reply Rules

#### Time-Based Rules
```
Business Hours: Monday-Friday 9AM-5PM
Message: "Thanks for your message! I'll respond during business hours (9AM-5PM, Mon-Fri)."

After Hours: All other times
Message: "I'm currently unavailable. I'll get back to you during business hours."
```

#### Keyword-Based Rules
```
Keywords: "urgent", "emergency"
Message: "I see this is urgent. Please call [your phone number] for immediate assistance."

Keywords: "price", "quote", "cost"
Message: "Thanks for your interest! Please visit [your website] for current pricing."
```

#### Contact-Based Rules
```
Unknown Numbers: Not in contacts
Message: "Hello! Please let me know who you are and how I can help you."

VIP Contacts: Specific contact groups
Message: "Thanks for reaching out! I'll prioritize your message."
```

### Auto-Reply Best Practices
- ✅ Keep messages concise and helpful
- ✅ Include relevant contact information
- ✅ Set appropriate delays (5-10 seconds recommended)
- ✅ Test rules before activating
- ⚠️ Don't spam - use reasonable frequency limits
- ⚠️ Avoid auto-replying to groups unless necessary

## 📝 Message Monitoring

### Setting Up Keyword Monitoring

1. **Access Settings**: Extension options → Monitoring section
2. **Enable Monitoring**: Toggle "Keyword Monitoring"
3. **Add Keywords**: Enter keywords separated by commas
4. **Configure Alerts**: Choose notification preferences
5. **Save Configuration**: Apply your settings

### Keyword Examples
```
Business Keywords: "order", "purchase", "buy", "price", "quote"
Support Keywords: "help", "problem", "issue", "error", "bug"
Urgent Keywords: "urgent", "asap", "emergency", "immediately"
Competitor Keywords: "competitor-name", "alternative", "switch"
```

### Monitoring Actions
- **Desktop Notifications**: Get alerted when keywords are detected
- **Message Logging**: Keep a record of flagged messages
- **Auto-Tagging**: Automatically categorize messages
- **Escalation**: Forward important messages to specific contacts

## 👥 Contact Management

### Organizing Contacts

#### Contact Lists
- **Favorites**: Star important contacts
- **Business**: Tag business contacts
- **Personal**: Separate personal contacts
- **Blocked**: Manage blocked contacts

#### Bulk Actions
- **Export Contacts**: Save contact lists as CSV/JSON
- **Import Contacts**: Add contacts from files
- **Bulk Message**: Send messages to multiple contacts
- **Group Operations**: Add contacts to groups

### Contact Insights
- **Last Interaction**: When you last messaged
- **Message Frequency**: How often you communicate
- **Response Time**: Average response patterns
- **Interaction Type**: Calls, messages, media shared

## ⚙️ Settings Configuration

### General Settings
```
Theme: Light/Dark mode
Language: Interface language
Startup: Auto-connect on browser start
Updates: Auto-update preferences
```

### Privacy Settings
```
Data Logging: Enable/disable message logs
Sync Settings: Sync across devices
Clear Data: Remove stored information
Export Data: Backup your settings
```

### Notification Settings
```
Desktop Notifications: Enable/disable
Sound Alerts: Notification sounds
Frequency: How often to check
Priority Contacts: VIP notifications
```

### Advanced Settings
```
API Limits: Rate limiting
Cache Size: Local storage limits
Debug Mode: Developer features
Backup: Automatic backups
```

## 🛠️ Troubleshooting

### Common Issues

#### Extension Not Working
**Symptoms**: Extension popup doesn't open or shows errors

**Solutions**:
1. Refresh WhatsApp Web page
2. Disable and re-enable extension
3. Check Chrome extensions page for errors
4. Restart Chrome browser
5. Check if you're logged into WhatsApp Web

#### Auto-Reply Not Functioning
**Symptoms**: Messages not being sent automatically

**Solutions**:
1. Verify auto-reply is enabled in settings
2. Check if you're in an active conversation
3. Ensure proper delay settings
4. Test with a friend's number
5. Check console for error messages

#### Connection Issues
**Symptoms**: Shows "Disconnected" status

**Solutions**:
1. Refresh WhatsApp Web
2. Check internet connection
3. Clear browser cache and cookies
4. Try incognito mode
5. Disable other WhatsApp extensions

#### Performance Issues
**Symptoms**: Extension running slowly

**Solutions**:
1. Clear extension data
2. Reduce monitoring keywords
3. Disable unnecessary features
4. Check available storage space
5. Update Chrome browser

### Debug Mode
Enable debug mode for detailed error information:
1. Go to extension settings
2. Enable "Debug Mode"
3. Open browser console (F12)
4. Look for extension-specific logs

## 📝 Best Practices

### Security
- ✅ Keep extension updated
- ✅ Use strong, unique passwords
- ✅ Review permissions regularly
- ✅ Enable two-factor authentication on WhatsApp
- ❌ Don't share auto-reply messages with sensitive info

### Performance
- ✅ Limit keyword monitoring to essential terms
- ✅ Clear old logs regularly
- ✅ Use reasonable auto-reply delays
- ✅ Monitor extension resource usage
- ❌ Don't enable every feature if not needed

### Privacy
- ✅ Review data logging settings
- ✅ Export/backup settings regularly
- ✅ Understand what data is stored locally
- ✅ Use privacy-focused settings
- ❌ Don't log sensitive conversations

### Productivity
- ✅ Set up contact groups for efficiency
- ✅ Use templates for common responses
- ✅ Schedule messages for appropriate times
- ✅ Monitor response patterns
- ❌ Don't over-automate personal conversations

## ❓ FAQ

### General Questions

**Q: Is this extension official from WhatsApp?**
A: No, this is a third-party extension. Use at your own risk.

**Q: Will using this extension get my WhatsApp account banned?**
A: WhatsApp may restrict accounts using unofficial tools. Use responsibly.

**Q: Does the extension work on mobile?**
A: No, this is a Chrome desktop extension only.

**Q: Can I use this with WhatsApp Business?**
A: Yes, it works with both regular WhatsApp Web and WhatsApp Business Web.

### Features

**Q: Can I schedule messages for later?**
A: Yes, use the Automation tab to set up scheduled messages.

**Q: Does auto-reply work in groups?**
A: It can, but we recommend disabling it for groups to avoid spam.

**Q: Can I export my chat history?**
A: You can export data you've logged, but not full WhatsApp history.

**Q: How many keywords can I monitor?**
A: There's no hard limit, but too many may impact performance.

### Technical

**Q: Where is my data stored?**
A: All data is stored locally on your device using Chrome's storage API.

**Q: Can I sync settings across devices?**
A: Yes, if you enable Chrome sync for extensions.

**Q: How do I backup my settings?**
A: Use the export function in extension settings.

**Q: What happens if I uninstall the extension?**
A: All locally stored data will be removed.

### Support

**Q: Where can I get help?**
A: Check GitHub issues, discussions, or contact support via email.

**Q: How do I report bugs?**
A: Create an issue on the GitHub repository with detailed information.

**Q: Can I request new features?**
A: Yes, use GitHub discussions for feature requests.

**Q: Is the extension open source?**
A: Yes, you can review and contribute to the code on GitHub.

---

## 📞 Need More Help?

- 📖 **Documentation**: Check other `.md` files in this repository
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-username/whatsapp-webjs-manager-extension/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-username/whatsapp-webjs-manager-extension/discussions)
- 📧 **Direct Support**: your-email@example.com

---

*Made with ❤️ for the WhatsApp Web community*