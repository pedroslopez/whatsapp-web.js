// WhatsApp Web.js Manager - Enhanced Inject Script
// This script runs in the WhatsApp Web page context and incorporates whatsapp-web.js utilities

(function() {
    'use strict';

    // Import whatsapp-web.js utilities (adapted for Chrome extension)
    const { Store, Utils, Constants } = (() => {
        // Constants from whatsapp-web.js
        const Events = {
            AUTHENTICATED: 'authenticated',
            AUTHENTICATION_FAILURE: 'auth_failure',
            READY: 'ready',
            MESSAGE_RECEIVED: 'message',
            MESSAGE_CREATE: 'message_create',
            MESSAGE_ACK: 'message_ack',
            CONTACT_CHANGED: 'contact_changed',
            GROUP_JOIN: 'group_join',
            GROUP_LEAVE: 'group_leave',
            GROUP_UPDATE: 'group_update',
            QR_RECEIVED: 'qr',
            DISCONNECTED: 'disconnected',
            STATE_CHANGED: 'change_state'
        };

        const MessageTypes = {
            TEXT: 'chat',
            AUDIO: 'audio',
            VOICE: 'ptt',
            IMAGE: 'image',
            VIDEO: 'video',
            DOCUMENT: 'document',
            STICKER: 'sticker',
            LOCATION: 'location',
            CONTACT_CARD: 'vcard',
            CONTACT_CARD_MULTI: 'multi_vcard',
            ORDER: 'order',
            REVOKED: 'revoked',
            PRODUCT: 'product',
            UNKNOWN: 'unknown',
            GROUP_INVITE: 'groups_v4_invite',
            LIST: 'list',
            LIST_RESPONSE: 'list_response',
            BUTTONS_RESPONSE: 'buttons_response',
            PAYMENT: 'payment',
            BROADCAST_NOTIFICATION: 'broadcast_notification',
            CALL_LOG: 'call_log',
            CIPHERTEXT: 'ciphertext',
            DEBUG: 'debug',
            E2E_NOTIFICATION: 'e2e_notification',
            GP2: 'gp2',
            GROUP_NOTIFICATION: 'group_notification',
            HSM: 'hsm',
            INTERACTIVE: 'interactive',
            NATIVE_FLOW: 'native_flow',
            NOTIFICATION: 'notification',
            NOTIFICATION_TEMPLATE: 'notification_template',
            OVERSIZED: 'oversized',
            PROTOCOL: 'protocol',
            REACTION: 'reaction',
            TEMPLATE_BUTTON_REPLY: 'template_button_reply',
            POLL_CREATION: 'poll_creation'
        };

        const WAState = {
            CONFLICT: 'CONFLICT',
            CONNECTED: 'CONNECTED',
            DEPRECATED_VERSION: 'DEPRECATED_VERSION',
            OPENING: 'OPENING',
            PAIRING: 'PAIRING',
            PROXYBLOCK: 'PROXYBLOCK',
            SMB_TOS_BLOCK: 'SMB_TOS_BLOCK',
            TIMEOUT: 'TIMEOUT',
            TOS_BLOCK: 'TOS_BLOCK',
            UNLAUNCHED: 'UNLAUNCHED',
            UNPAIRED: 'UNPAIRED',
            UNPAIRED_IDLE: 'UNPAIRED_IDLE'
        };

        const MessageAck = {
            ACK_ERROR: -1,
            ACK_PENDING: 0,
            ACK_SERVER: 1,
            ACK_DEVICE: 2,
            ACK_READ: 3,
            ACK_PLAYED: 4
        };

        return { Events, MessageTypes, WAState, MessageAck };
    })();

    // Enhanced WhatsApp Web integration
    class WhatsAppWebIntegration {
        constructor() {
            this.isInitialized = false;
            this.isConnected = false;
            this.currentState = 'UNLAUNCHED';
            this.Store = null;
            this.Utils = null;
            this.messageListeners = [];
            this.stateListeners = [];
            this.init();
        }

        init() {
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
                    this.sendToExtension('integration_failed', { error: 'WhatsApp Web not detected' });
                }
            }, 30000);
        }

        initializeIntegration() {
            try {
                this.initStore();
                this.initUtils();
                this.setupEventListeners();
                this.isInitialized = true;
                
                this.sendToExtension('integration_ready', {
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    version: this.getWhatsAppVersion()
                });

                console.log('WhatsApp Web.js Manager integration initialized');
            } catch (error) {
                console.error('Failed to initialize WhatsApp Web integration:', error);
                this.sendToExtension('integration_failed', { error: error.message });
            }
        }

        initStore() {
            // Simplified store initialization - use existing WhatsApp Web objects
            if (window.Store) {
                this.Store = window.Store;
            } else if (window.require) {
                try {
                    // Use basic WhatsApp Web collections
                    this.Store = window.require('WAWebCollections');
                    
                    // Add essential modules if available
                    try {
                        this.Store.Conn = window.require('WAWebConnModel')?.Conn;
                    } catch (e) {
                        console.log('Conn module not available');
                    }
                    
                    try {
                        this.Store.SendMessage = window.require('WAWebSendMsgChatAction');
                    } catch (e) {
                        console.log('SendMessage module not available');
                    }
                    
                    try {
                        this.Store.SendSeen = window.require('WAWebUpdateUnreadChatAction');
                    } catch (e) {
                        console.log('SendSeen module not available');
                    }
                    
                    try {
                        this.Store.User = window.require('WAWebUserPrefsMeUser');
                    } catch (e) {
                        console.log('User module not available');
                    }
                    
                    try {
                        this.Store.WidFactory = window.require('WAWebWidFactory');
                    } catch (e) {
                        console.log('WidFactory module not available');
                    }
                    
                    try {
                        this.Store.Validators = window.require('WALinkify');
                    } catch (e) {
                        console.log('Validators module not available');
                    }
                    
                    try {
                        this.Store.ProfilePic = window.require('WAWebContactProfilePicThumbBridge');
                    } catch (e) {
                        console.log('ProfilePic module not available');
                    }
                    
                    try {
                        this.Store.ChatGetters = window.require('WAWebChatGetters');
                    } catch (e) {
                        console.log('ChatGetters module not available');
                    }
                    
                    try {
                        this.Store.QueryExist = window.require('WAWebQueryExistsJob')?.queryWidExists;
                    } catch (e) {
                        console.log('QueryExist module not available');
                    }
                    
                    try {
                        this.Store.ReplyUtils = window.require('WAWebMsgReply');
                    } catch (e) {
                        console.log('ReplyUtils module not available');
                    }
                    
                    try {
                        this.Store.LinkPreview = window.require('WAWebLinkPreviewChatAction');
                    } catch (e) {
                        console.log('LinkPreview module not available');
                    }
                    
                    try {
                        this.Store.VCard = {
                            ...window.require('WAWebFrontendVcardUtils'),
                            ...window.require('WAWebVcardParsingUtils'),
                            ...window.require('WAWebVcardGetNameFromParsed')
                        };
                    } catch (e) {
                        console.log('VCard modules not available');
                    }
                    
                    try {
                        this.Store.GroupUtils = {
                            ...window.require('WAWebGroupCreateJob'),
                            ...window.require('WAWebGroupModifyInfoJob'),
                            ...window.require('WAWebExitGroupAction')
                        };
                    } catch (e) {
                        console.log('GroupUtils modules not available');
                    }
                    
                    try {
                        this.Store.GroupParticipants = {
                            ...window.require('WAWebModifyParticipantsGroupAction'),
                            ...window.require('WASmaxGroupsAddParticipantsRPC')
                        };
                    } catch (e) {
                        console.log('GroupParticipants modules not available');
                    }
                    
                    try {
                        this.Store.AddressbookContactUtils = {
                            ...window.require('WAWebSaveContactAction'),
                            ...window.require('WAWebDeleteContactAction')
                        };
                    } catch (e) {
                        console.log('AddressbookContactUtils modules not available');
                    }
                    
                } catch (e) {
                    console.warn('Could not initialize WhatsApp Store:', e);
                    // Fallback to basic store
                    this.Store = window.require('WAWebCollections');
                }
            }
        }

        initUtils() {
            // Initialize WhatsApp Web utilities
            this.Utils = {
                // Message utilities
                sendMessage: async (chat, content, options = {}) => {
                    try {
                        if (!this.Store || !this.Store.SendMessage) {
                            throw new Error('SendMessage not available');
                        }
                        
                        const chatModel = await this.getChat(chat);
                        if (!chatModel) {
                            throw new Error('Chat not found');
                        }

                        // Handle different message types
                        if (options.media) {
                            return await this.sendMediaMessage(chatModel, content, options);
                        } else if (options.location) {
                            return await this.sendLocationMessage(chatModel, options.location);
                        } else if (options.contactCard) {
                            return await this.sendContactMessage(chatModel, options.contactCard);
                        } else {
                            return await this.Store.SendMessage.sendTextMsgToChat(chatModel, content, options);
                        }
                    } catch (error) {
                        console.error('Error sending message:', error);
                        throw error;
                    }
                },

                // Chat utilities
                getChat: async (chatId) => {
                    try {
                        if (!this.Store || !this.Store.Chat) {
                            throw new Error('Chat store not available');
                        }
                        return this.Store.Chat.get(chatId) || await this.Store.Chat.findImpl(chatId);
                    } catch (error) {
                        console.error('Error getting chat:', error);
                        return null;
                    }
                },

                // Contact utilities
                getContact: (contactId) => {
                    try {
                        if (!this.Store || !this.Store.Contact) {
                            throw new Error('Contact store not available');
                        }
                        return this.Store.Contact.get(contactId);
                    } catch (error) {
                        console.error('Error getting contact:', error);
                        return null;
                    }
                },

                // Message utilities
                getMessage: (messageId) => {
                    try {
                        if (!this.Store || !this.Store.Msg) {
                            throw new Error('Message store not available');
                        }
                        return this.Store.Msg.get(messageId);
                    } catch (error) {
                        console.error('Error getting message:', error);
                        return null;
                    }
                }
            };
        }

        setupEventListeners() {
            // Monitor connection state
            if (this.Store && this.Store.Conn) {
                this.Store.Conn.on('change:state', (state) => {
                    this.currentState = state;
                    this.isConnected = state === 'CONNECTED';
                    this.sendToExtension('state_changed', { state, isConnected: this.isConnected });
                });
            }

            // Monitor messages
            if (this.Store && this.Store.Msg) {
                this.Store.Msg.on('add', (message) => {
                    this.handleNewMessage(message);
                });
            }

            // Monitor contacts
            if (this.Store && this.Store.Contact) {
                this.Store.Contact.on('add', (contact) => {
                    this.sendToExtension('contact_added', { contact: this.serializeContact(contact) });
                });
            }

            // Monitor chats
            if (this.Store && this.Store.Chat) {
                this.Store.Chat.on('add', (chat) => {
                    this.sendToExtension('chat_added', { chat: this.serializeChat(chat) });
                });
            }
        }

        handleNewMessage(message) {
            try {
                const messageData = this.serializeMessage(message);
                this.sendToExtension('message_received', messageData);
            } catch (error) {
                console.error('Error handling new message:', error);
            }
        }

        // Serialization methods for sending data to extension
        serializeMessage(message) {
            try {
                return {
                    id: message.id?._serialized || message.id,
                    from: message.from,
                    to: message.to,
                    body: message.body,
                    type: message.type,
                    timestamp: message.timestamp,
                    hasMedia: message.hasMedia,
                    isFromMe: message.isFromMe,
                    isGroup: message.isGroup,
                    chat: message.chat?.id?._serialized,
                    author: message.author,
                    notifyName: message.notifyName,
                    quotedMsg: message.quotedMsg ? this.serializeMessage(message.quotedMsg) : null
                };
            } catch (error) {
                console.error('Error serializing message:', error);
                return null;
            }
        }

        serializeContact(contact) {
            try {
                return {
                    id: contact.id?._serialized || contact.id,
                    name: contact.name,
                    pushname: contact.pushname,
                    number: contact.number,
                    isMyContact: contact.isMyContact,
                    isGroup: contact.isGroup,
                    isWAContact: contact.isWAContact,
                    profilePicUrl: contact.profilePicUrl
                };
            } catch (error) {
                console.error('Error serializing contact:', error);
                return null;
            }
        }

        serializeChat(chat) {
            try {
                return {
                    id: chat.id?._serialized || chat.id,
                    name: chat.name,
                    isGroup: chat.isGroup,
                    isReadOnly: chat.isReadOnly,
                    unreadCount: chat.unreadCount,
                    timestamp: chat.timestamp,
                    lastMessage: chat.lastMessage ? this.serializeMessage(chat.lastMessage) : null
                };
            } catch (error) {
                console.error('Error serializing chat:', error);
                return null;
            }
        }

        // Command handlers
        handleExtensionMessage(message) {
            const { type, data } = message.payload;
            
            switch (type) {
                case 'get_contacts':
                    this.getContacts();
                    break;
                case 'get_chats':
                    this.getChats();
                    break;
                case 'get_messages':
                    this.getMessages(data);
                    break;
                case 'send_message':
                    this.sendMessage(data);
                    break;
                case 'send_message_to_user':
                    this.sendMessageToUser(data);
                    break;
                case 'get_chat':
                    this.getChat(data.chatId);
                    break;
                case 'get_contact':
                    this.getContact(data.contactId);
                    break;
                case 'mark_as_read':
                    this.markAsRead(data.chatId);
                    break;
                case 'get_connection_state':
                    this.getConnectionState();
                    break;
                default:
                    console.log('Unknown command:', type);
            }
        }

        // Implementation of command handlers
        async getContacts() {
            try {
                if (!this.Store || !this.Store.Contact) {
                    throw new Error('Contact store not available');
                }
                
                const contacts = this.Store.Contact.getModelsArray();
                const serializedContacts = contacts.map(contact => this.serializeContact(contact)).filter(Boolean);
                
                this.sendToExtension('contacts_data', { contacts: serializedContacts });
            } catch (error) {
                console.error('Error getting contacts:', error);
                this.sendToExtension('contacts_data', { error: error.message });
            }
        }

        async sendMessageToUser(data) {
            try {
                // Validate data parameter
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid data parameter provided');
                }

                const { chatId, message, options = {} } = data;
                
                if (!chatId) {
                    throw new Error('Chat ID is required');
                }

                if (!message || typeof message !== 'string') {
                    throw new Error('Message content is required');
                }

                const chat = await this.Utils.getChat(chatId);
                
                if (!chat) {
                    throw new Error('Chat not found');
                }

                // Send message using WhatsApp Web API
                const result = await this.Utils.sendMessage(chatId, message, options);
                
                this.sendToExtension('message_sent', { 
                    success: true,
                    messageId: result?.id?._serialized || result?.id,
                    chatId,
                    message,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Error sending message:', error);
                this.sendToExtension('message_sent', { 
                    success: false,
                    error: error.message,
                    chatId: data?.chatId || 'unknown',
                    message: data?.message || ''
                });
            }
        }

        async getChats() {
            try {
                if (!this.Store || !this.Store.Chat) {
                    throw new Error('Chat store not available');
                }
                
                const chats = this.Store.Chat.getModelsArray();
                const serializedChats = chats.map(chat => this.serializeChat(chat)).filter(Boolean);
                
                this.sendToExtension('chats_data', { chats: serializedChats });
            } catch (error) {
                console.error('Error getting chats:', error);
                this.sendToExtension('chats_data', { error: error.message });
            }
        }

        async getMessages(data) {
            try {
                // Validate data parameter
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid data parameter provided');
                }

                const { chatId, limit = 50 } = data;
                
                if (!chatId) {
                    throw new Error('Chat ID is required');
                }

                const chat = await this.Utils.getChat(chatId);
                
                if (!chat) {
                    throw new Error('Chat not found');
                }

                // Get messages from chat
                const messages = await chat.fetchMessages({ limit });
                const serializedMessages = messages.map(msg => this.serializeMessage(msg)).filter(Boolean);
                
                this.sendToExtension('messages_data', { 
                    chatId, 
                    messages: serializedMessages 
                });
            } catch (error) {
                console.error('Error getting messages:', error);
                this.sendToExtension('messages_data', { 
                    error: error.message,
                    chatId: data?.chatId || 'unknown'
                });
            }
        }

        async sendMessage(data) {
            try {
                const { chatId, content, options = {} } = data;
                const result = await this.Utils.sendMessage(chatId, content, options);
                
                this.sendToExtension('message_sent', { 
                    success: true, 
                    messageId: result?.id?._serialized || result?.id,
                    data 
                });
            } catch (error) {
                console.error('Error sending message:', error);
                this.sendToExtension('message_sent', { 
                    success: false, 
                    error: error.message,
                    data 
                });
            }
        }

        async getChat(chatId) {
            try {
                const chat = await this.Utils.getChat(chatId);
                if (chat) {
                    this.sendToExtension('chat_data', { chat: this.serializeChat(chat) });
                } else {
                    this.sendToExtension('chat_data', { error: 'Chat not found' });
                }
            } catch (error) {
                console.error('Error getting chat:', error);
                this.sendToExtension('chat_data', { error: error.message });
            }
        }

        async getContact(contactId) {
            try {
                const contact = this.Utils.getContact(contactId);
                if (contact) {
                    this.sendToExtension('contact_data', { contact: this.serializeContact(contact) });
                } else {
                    this.sendToExtension('contact_data', { error: 'Contact not found' });
                }
            } catch (error) {
                console.error('Error getting contact:', error);
                this.sendToExtension('contact_data', { error: error.message });
            }
        }

        async markAsRead(chatId) {
            try {
                const chat = await this.Utils.getChat(chatId);
                if (chat && this.Store.SendSeen) {
                    await this.Store.SendSeen.sendSeen(chat);
                    this.sendToExtension('mark_as_read_result', { success: true, chatId });
                } else {
                    this.sendToExtension('mark_as_read_result', { success: false, error: 'Chat not found or SendSeen not available' });
                }
            } catch (error) {
                console.error('Error marking as read:', error);
                this.sendToExtension('mark_as_read_result', { success: false, error: error.message });
            }
        }

        getConnectionState() {
            this.sendToExtension('connection_state', {
                isConnected: this.isConnected,
                state: this.currentState,
                isInitialized: this.isInitialized
            });
        }

        getWhatsAppVersion() {
            try {
                return window.Debug?.VERSION || 'unknown';
            } catch (error) {
                return 'unknown';
            }
        }

        sendToExtension(type, data) {
            window.postMessage({
                type: 'FROM_INJECT_SCRIPT',
                payload: { type, data }
            }, '*');
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