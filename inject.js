// WhatsApp Web.js Manager - Inject Script
// This script runs in the WhatsApp Web page context

(function() {
    'use strict';

    // WhatsApp Web integration utilities
    class WhatsAppWebIntegration {
        constructor() {
            this.isInitialized = false;
            this.init();
        }

        init() {
            // Wait for WhatsApp Web to load
            this.waitForWhatsAppWeb();
        }

        waitForWhatsAppWeb() {
            const checkInterval = setInterval(() => {
                if (window.Store || window.require) {
                    clearInterval(checkInterval);
                    this.initializeIntegration();
                }
            }, 1000);

            // Timeout after 30 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!this.isInitialized) {
                    console.warn('WhatsApp Web not detected after 30 seconds');
                }
            }, 30000);
        }

        initializeIntegration() {
            try {
                // Initialize WhatsApp Web store access
                this.initStore();
                this.isInitialized = true;
                
                // Notify extension that integration is ready
                this.sendToExtension('integration_ready', {
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent
                });

                console.log('WhatsApp Web.js Manager integration initialized');
            } catch (error) {
                console.error('Failed to initialize WhatsApp Web integration:', error);
            }
        }

        initStore() {
            // Basic store initialization for WhatsApp Web
            if (window.Store) {
                this.Store = window.Store;
            } else if (window.require) {
                // Try to get Store via require
                try {
                    this.Store = window.require('WAWebCollections');
                } catch (e) {
                    console.warn('Could not access WhatsApp Store');
                }
            }
        }

        sendToExtension(type, data) {
            window.postMessage({
                type: 'FROM_INJECT_SCRIPT',
                payload: { type, data }
            }, '*');
        }

        // Listen for commands from extension
        handleExtensionMessage(message) {
            const { type, data } = message.payload;
            
            switch (type) {
                case 'get_contacts':
                    this.getContacts();
                    break;
                case 'get_chats':
                    this.getChats();
                    break;
                case 'send_message':
                    this.sendMessage(data);
                    break;
                default:
                    console.log('Unknown command:', type);
            }
        }

        getContacts() {
            try {
                if (this.Store && this.Store.Contact) {
                    const contacts = this.Store.Contact.getModelsArray();
                    this.sendToExtension('contacts_data', contacts);
                }
            } catch (error) {
                console.error('Error getting contacts:', error);
            }
        }

        getChats() {
            try {
                if (this.Store && this.Store.Chat) {
                    const chats = this.Store.Chat.getModelsArray();
                    this.sendToExtension('chats_data', chats);
                }
            } catch (error) {
                console.error('Error getting chats:', error);
            }
        }

        sendMessage(data) {
            try {
                // Implementation would depend on WhatsApp Web's internal API
                console.log('Send message request:', data);
                this.sendToExtension('message_sent', { success: true, data });
            } catch (error) {
                console.error('Error sending message:', error);
                this.sendToExtension('message_sent', { success: false, error: error.message });
            }
        }
    }

    // Listen for messages from content script
    window.addEventListener('message', function(event) {
        if (event.source !== window) return;
        
        if (event.data.type && event.data.type === 'FROM_EXTENSION') {
            if (window.whatsappIntegration) {
                window.whatsappIntegration.handleExtensionMessage(event.data);
            }
        }
    });

    // Initialize integration
    window.whatsappIntegration = new WhatsAppWebIntegration();
})();