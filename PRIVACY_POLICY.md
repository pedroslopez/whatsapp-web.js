# Privacy Policy - WhatsApp Web.js Manager Extension

**Last Updated: July 15, 2024**

## Overview

WhatsApp Web.js Manager ("the Extension") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect information when you use our Chrome extension.

## Information We Collect

### Data Stored Locally
The Extension stores the following data **locally on your device only**:

- **Extension Settings**: Your preferences for auto-reply, monitoring, and other features
- **Message Logs**: Optional message logs (only if you enable logging in settings)
- **Contact Data**: Cached contact information from WhatsApp Web for functionality
- **Session Data**: Connection status and temporary session information

### Data We DO NOT Collect

- **Personal Messages**: We do not transmit, store, or access your WhatsApp messages on external servers
- **Contact Information**: Your contacts are not sent to external servers
- **Login Credentials**: We do not collect or store your WhatsApp login information
- **Location Data**: We do not collect location information
- **Browsing History**: We do not track your browsing outside of WhatsApp Web

## How We Use Information

The Extension uses locally stored data to:

- Provide auto-reply functionality
- Monitor messages for specified keywords
- Maintain connection status with WhatsApp Web
- Save your preferences and settings
- Display contact and chat information in the extension interface

## Data Storage and Security

### Local Storage Only
- **All data is stored locally** on your device using Chrome's storage API
- **No cloud synchronization** - your data never leaves your device
- **No external servers** - we do not operate any servers that collect your data

### Security Measures
- Data is stored using Chrome's secure storage mechanisms
- Extension follows Chrome's security best practices
- Minimal permissions requested (only what's necessary for functionality)

## Data Sharing

**We do not share any data with third parties** because:
- We don't collect data on external servers
- All processing happens locally on your device
- No analytics or tracking services are used

## Third-Party Services

### WhatsApp Web Integration
- The Extension interacts with WhatsApp Web (web.whatsapp.com)
- WhatsApp's privacy policy governs their data handling
- We do not send any data to WhatsApp beyond normal web interactions

### No External APIs
- The Extension does not communicate with external APIs
- No data is sent to external services

## Your Rights and Controls

### Data Control
- **Access**: All your data is stored locally and accessible to you
- **Deletion**: Uninstalling the extension removes all stored data
- **Modification**: You can change or delete settings at any time
- **Export**: You can backup settings manually if needed

### Settings Control
You can control data usage through the Extension's settings:
- Enable/disable message logging
- Configure auto-reply features
- Manage notification preferences
- Clear stored data

## Children's Privacy

The Extension is not intended for children under 13. We do not knowingly collect information from children under 13. WhatsApp itself has age restrictions that apply.

## Changes to Privacy Policy

We may update this Privacy Policy to reflect changes in our practices or for legal requirements. Changes will be posted in this document with an updated "Last Updated" date.

## Compliance

### Chrome Web Store Policies
This Extension complies with:
- Chrome Web Store Developer Program Policies
- Limited Use Policy for Chrome Extensions
- User Data Privacy requirements

### Data Protection
- No personal data is transmitted to external servers
- Data minimization principles are followed
- User consent is obtained for optional features

## Contact Information

If you have questions about this Privacy Policy or the Extension's privacy practices:

- **GitHub Issues**: [Create an issue](https://github.com/your-username/whatsapp-webjs-manager-extension/issues)
- **GitHub Discussions**: [Join the discussion](https://github.com/your-username/whatsapp-webjs-manager-extension/discussions)
- **Email**: your-email@example.com

## Technical Implementation

### Chrome Storage API
The Extension uses Chrome's `chrome.storage.sync` and `chrome.storage.local` APIs:
- `storage.sync`: For user settings (synced across devices if user chooses)
- `storage.local`: For temporary data and large data sets

### Permissions Explanation
The Extension requests these permissions:
- **storage**: To save your settings and preferences
- **activeTab**: To interact with WhatsApp Web pages only
- **notifications**: To show desktop notifications (optional)
- **background**: To maintain connection status
- **downloads**: To export data files (optional)
- **clipboardWrite/Read**: For copy/paste functionality (optional)

## Open Source

This Extension is open source, allowing you to:
- Review the code for privacy compliance
- Verify data handling practices
- Contribute to improvements
- Report security issues

## Disclaimer

This Extension is not affiliated with WhatsApp Inc. or Meta Platforms Inc. WhatsApp is a trademark of WhatsApp Inc.

---

**By using the WhatsApp Web.js Manager Extension, you acknowledge that you have read and understood this Privacy Policy.**