
import { EventEmitter } from 'events'
import { RequestInit } from 'node-fetch'
import * as puppeteer from 'puppeteer'

declare namespace WAWebJS {

    export class Client extends EventEmitter {
        constructor(options: ClientOptions)

        /** Current connection information */
        public info: ClientInfo

        /** Puppeteer page running WhatsApp Web */
        pupPage?: puppeteer.Page

        /** Puppeteer browser running WhatsApp Web */
        pupBrowser?: puppeteer.Browser

        /**Accepts an invitation to join a group */
        acceptInvite(inviteCode: string): Promise<string>

        /** Accepts a private invitation to join a group (v4 invite) */
        acceptGroupV4Invite: (inviteV4: InviteV4Data) => Promise<{status: number}>

        /**Returns an object with information about the invite code's group */
        getInviteInfo(inviteCode: string): Promise<object>

        /** Enables and returns the archive state of the Chat */
        archiveChat(chatId: string): Promise<boolean>

        /** Pins the Chat and returns its new Pin state */
        pinChat(chatId: string): Promise<boolean>

        /** Unpins the Chat and returns its new Pin state */
        unpinChat(chatId: string): Promise<boolean>

        /**
         * Create a new group
         * @param name group title
         * @param participants an array of Contacts or contact IDs to add to the group
         */
        createGroup(name: string, participants: Contact[] | string[]): Promise<CreateGroupResult>

        /** Closes the client */
        destroy(): Promise<void>

        /** Logs out the client, closing the current session */
        logout(): Promise<void>

        /** Get all blocked contacts by host account */
        getBlockedContacts(): Promise<Contact[]>

        /** Get chat instance by ID */
        getChatById(chatId: string): Promise<Chat>

        /** Get all current chat instances */
        getChats(): Promise<Chat[]>

        /** Get contact instance by ID */
        getContactById(contactId: string): Promise<Contact>

        /** Get message by ID */
        getMessageById(messageId: string): Promise<Message>

        /** Get all current contact instances */
        getContacts(): Promise<Contact[]>
        
        /** Get the country code of a WhatsApp ID. (154185968@c.us) => (1) */
        getCountryCode(number: string): Promise<string>

        /** Get the formatted number of a WhatsApp ID. (12345678901@c.us) => (+1 (234) 5678-901) */
        getFormattedNumber(number: string): Promise<string>

        /** Get all current Labels  */
        getLabels(): Promise<Label[]>
        
        /** Change labels in chats  */
        addOrRemoveLabels(labelIds: Array<number|string>, chatIds: Array<string>): Promise<void>

        /** Get Label instance by ID */
        getLabelById(labelId: string): Promise<Label>

        /** Get all Labels assigned to a Chat */
        getChatLabels(chatId: string): Promise<Label[]>

        /** Get all Chats for a specific Label */
        getChatsByLabelId(labelId: string): Promise<Chat[]>

        /** Returns the contact ID's profile picture URL, if privacy settings allow it */
        getProfilePicUrl(contactId: string): Promise<string>

        /** Gets the Contact's common groups with you. Returns empty array if you don't have any common group. */
        getCommonGroups(contactId: string): Promise<ChatId[]>

        /** Gets the current connection state for the client */
        getState(): Promise<WAState>

        /** Returns the version of WhatsApp Web currently being run */
        getWWebVersion(): Promise<string>

        /** Sets up events and requirements, kicks off authentication request */
        initialize(): Promise<void>

        /** Check if a given ID is registered in whatsapp */
        isRegisteredUser(contactId: string): Promise<boolean>

        /** Get the registered WhatsApp ID for a number. Returns null if the number is not registered on WhatsApp. */
        getNumberId(number: string): Promise<ContactId | null>

        /**
         * Mutes this chat forever, unless a date is specified
         * @param chatId ID of the chat that will be muted
         * @param unmuteDate Date when the chat will be unmuted, leave as is to mute forever
         */
        muteChat(chatId: string, unmuteDate?: Date): Promise<void>

        /** Force reset of connection state for the client */
        resetState(): Promise<void>

        /** Send a message to a specific chatId */
        sendMessage(chatId: string, content: MessageContent, options?: MessageSendOptions): Promise<Message>
        
        /** Searches for messages */
        searchMessages(query: string, options?: { chatId?: string, page?: number, limit?: number }): Promise<Message[]>

        /** Marks the client as online */
        sendPresenceAvailable(): Promise<void>

        /** Marks the client as offline */
        sendPresenceUnavailable(): Promise<void>

        /** Mark as seen for the Chat */
        sendSeen(chatId: string): Promise<boolean>

        /** Mark the Chat as unread */
        markChatUnread(chatId: string): Promise<void>

        /** 
         * Sets the current user's status message
         * @param status New status message
         */
        setStatus(status: string): Promise<void>

        /** 
         * Sets the current user's display name
         * @param displayName New display name
         */
        setDisplayName(displayName: string): Promise<boolean>
                
        /** Changes and returns the archive state of the Chat */
        unarchiveChat(chatId: string): Promise<boolean>

        /** Unmutes the Chat */
        unmuteChat(chatId: string): Promise<void>

        /** Sets the current user's profile picture */
        setProfilePicture(media: MessageMedia): Promise<boolean>

        /** Deletes the current user's profile picture */
        deleteProfilePicture(): Promise<boolean>

        /** Generic event */
        on(event: string, listener: (...args: any) => void): this

        /** Emitted when there has been an error while trying to restore an existing session */
        on(event: 'auth_failure', listener: (message: string) => void): this

        /** Emitted when authentication is successful */
        on(event: 'authenticated', listener: (
            /** 
             * Object containing session information, when using LegacySessionAuth. Can be used to restore the session
             */
            session?: ClientSession
        ) => void): this

        /** 
         * Emitted when the battery percentage for the attached device changes
         * @deprecated 
         */
        on(event: 'change_battery', listener: (batteryInfo: BatteryInfo) => void): this

        /** Emitted when the connection state changes */
        on(event: 'change_state', listener: (
            /** the new connection state */
            state: WAState
        ) => void): this

        /** Emitted when the client has been disconnected */
        on(event: 'disconnected', listener: (
            /** reason that caused the disconnect */
            reason: WAState | "NAVIGATION"
        ) => void): this

        /** Emitted when a user joins the chat via invite link or is added by an admin */
        on(event: 'group_join', listener: (
            /** GroupNotification with more information about the action */
            notification: GroupNotification
        ) => void): this

        /** Emitted when a user leaves the chat or is removed by an admin */
        on(event: 'group_leave', listener: (
            /** GroupNotification with more information about the action */
            notification: GroupNotification
        ) => void): this

        /** Emitted when a current user is promoted to an admin or demoted to a regular user */
        on(event: 'group_admin_changed', listener: (
            /** GroupNotification with more information about the action */
            notification: GroupNotification
        ) => void): this

        /** Emitted when group settings are updated, such as subject, description or picture */
        on(event: 'group_update', listener: (
            /** GroupNotification with more information about the action */
            notification: GroupNotification
        ) => void): this

        /** Emitted when a contact or a group participant changed their phone number. */
        on(event: 'contact_changed', listener: (
            /** Message with more information about the event. */
            message: Message,
            /** Old user's id. */
            oldId : String,
            /** New user's id. */
            newId : String,
            /** Indicates if a contact or a group participant changed their phone number. */
            isContact : Boolean
        ) => void): this

        /** Emitted when media has been uploaded for a message sent by the client */
        on(event: 'media_uploaded', listener: (
            /** The message with media that was uploaded */
            message: Message
        ) => void): this

        /** Emitted when a new message is received */
        on(event: 'message', listener: (
            /** The message that was received */
            message: Message
        ) => void): this

        /** Emitted when an ack event occurrs on message type */
        on(event: 'message_ack', listener: (
            /** The message that was affected */
            message: Message,
            /** The new ACK value */
            ack: MessageAck
        ) => void): this
        
        /** Emitted when an ack event occurrs on message type */
        on(event: 'message_edit', listener: (
            /** The message that was affected */
            message: Message,
            /** New text message */
            newBody: String,
            /** Prev text message */
            prevBody: String
        ) => void): this
        
        /** Emitted when a chat unread count changes */
        on(event: 'unread_count', listener: (
            /** The chat that was affected */
            chat: Chat
        ) => void): this

        /** Emitted when a new message is created, which may include the current user's own messages */
        on(event: 'message_create', listener: (
            /** The message that was created */
            message: Message
        ) => void): this

        /** Emitted when a message is deleted for everyone in the chat */
        on(event: 'message_revoke_everyone', listener: (
            /** The message that was revoked, in its current state. It will not contain the original message's data */
            message: Message,
            /**The message that was revoked, before it was revoked. 
             * It will contain the message's original data. 
             * Note that due to the way this data is captured, 
             * it may be possible that this param will be undefined. */
            revoked_msg?: Message | null
        ) => void): this

        /** Emitted when a message is deleted by the current user */
        on(event: 'message_revoke_me', listener: (
            /** The message that was revoked */
            message: Message
        ) => void): this

        /** Emitted when a reaction is sent, received, updated or removed */
        on(event: 'message_reaction', listener: (
            /** The reaction object */
            reaction: Reaction
        ) => void): this

        /** Emitted when a chat is removed */
        on(event: 'chat_removed', listener: (
            /** The chat that was removed */
            chat: Chat
        ) => void): this

        /** Emitted when a chat is archived/unarchived */
        on(event: 'chat_archived', listener: (
            /** The chat that was archived/unarchived */
            chat: Chat,
            /** State the chat is currently in */
            currState: boolean,
            /** State the chat was previously in */
            prevState: boolean
        ) => void): this

        /** Emitted when loading screen is appearing */
        on(event: 'loading_screen', listener: (percent: string, message: string) => void): this

        /** Emitted when the QR code is received */
        on(event: 'qr', listener: (
            /** qr code string
             *  @example ```1@9Q8tWf6bnezr8uVGwVCluyRuBOJ3tIglimzI5dHB0vQW2m4DQ0GMlCGf,f1/vGcW4Z3vBa1eDNl3tOjWqLL5DpYTI84DMVkYnQE8=,ZL7YnK2qdPN8vKo2ESxhOQ==``` */
            qr: string
        ) => void): this

        /** Emitted when a call is received */
        on(event: 'call', listener: (
            /** The call that started */
            call: Call
        ) => void): this

        /** Emitted when the client has initialized and is ready to receive messages */
        on(event: 'ready', listener: () => void): this

        /** Emitted when the RemoteAuth session is saved successfully on the external Database */
        on(event: 'remote_session_saved', listener: () => void): this
    }

    /** Current connection information */
    export interface ClientInfo {
        /** 
         * Current user ID 
         * @deprecated Use .wid instead 
         */
        me: ContactId
        /** Current user ID */
        wid: ContactId
        /** 
         * Information about the phone this client is connected to.  Not available in multi-device. 
         * @deprecated 
         */
        phone: ClientInfoPhone
        /** Platform the phone is running on */
        platform: string
        /** Name configured to be shown in push notifications */
        pushname: string

        /** Get current battery percentage and charging status for the attached device */
        getBatteryStatus: () => Promise<BatteryInfo>
    }

    /** 
     * Information about the phone this client is connected to 
     * @deprecated
     */
    export interface ClientInfoPhone {
        /** WhatsApp Version running on the phone */
        wa_version: string
        /** OS Version running on the phone (iOS or Android version) */
        os_version: string
        /** Device manufacturer */
        device_manufacturer: string
        /** Device model */
        device_model: string
        /** OS build number */
        os_build_number: string
    }

    /** Options for initializing the whatsapp client */
    export interface ClientOptions {
        /** Timeout for authentication selector in puppeteer
         * @default 0 */
        authTimeoutMs?: number,
        /** Puppeteer launch options. View docs here: https://github.com/puppeteer/puppeteer/ */
        puppeteer?: puppeteer.PuppeteerNodeLaunchOptions & puppeteer.ConnectOptions
		/** Determines how to save and restore sessions. Will use LegacySessionAuth if options.session is set. Otherwise, NoAuth will be used. */
        authStrategy?: AuthStrategy,
        /** The version of WhatsApp Web to use. Use options.webVersionCache to configure how the version is retrieved. */
        webVersion?: string,
        /**  Determines how to retrieve the WhatsApp Web version specified in options.webVersion. */
        webVersionCache?: WebCacheOptions,
        /** How many times should the qrcode be refreshed before giving up
		 * @default 0 (disabled) */
		qrMaxRetries?: number,
        /** 
         * @deprecated This option should be set directly on the LegacySessionAuth
         */
        restartOnAuthFail?: boolean
        /** 
         * @deprecated Only here for backwards-compatibility. You should move to using LocalAuth, or set the authStrategy to LegacySessionAuth explicitly.  
         */
        session?: ClientSession
        /** If another whatsapp web session is detected (another browser), take over the session in the current browser
         * @default false */
        takeoverOnConflict?: boolean,
        /** How much time to wait before taking over the session
         * @default 0 */
        takeoverTimeoutMs?: number,
        /** User agent to use in puppeteer.
         * @default 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36' */
        userAgent?: string
        /** Ffmpeg path to use when formating videos to webp while sending stickers 
         * @default 'ffmpeg' */
        ffmpegPath?: string,
        /** Object with proxy autentication requirements @default: undefined */
        proxyAuthentication?: {username: string, password: string} | undefined
    }

    export interface LocalWebCacheOptions {
        type: 'local',
        path?: string,
        strict?: boolean
    }

    export interface RemoteWebCacheOptions {
        type: 'remote',
        remotePath: string,
        strict?: boolean
    }

    export interface NoWebCacheOptions {
        type: 'none'
    }

    export type WebCacheOptions = NoWebCacheOptions | LocalWebCacheOptions | RemoteWebCacheOptions;

    /**
     * Base class which all authentication strategies extend
     */
    export abstract class AuthStrategy {
        setup: (client: Client) => void;
        beforeBrowserInitialized: () => Promise<void>;
        afterBrowserInitialized: () => Promise<void>;
        onAuthenticationNeeded: () => Promise<{
            failed?: boolean; 
            restart?: boolean; 
            failureEventPayload?: any
        }>;
        getAuthEventPayload: () => Promise<any>;
        afterAuthReady: () => Promise<void>;
        disconnect: () => Promise<void>;
        destroy: () => Promise<void>;
        logout: () => Promise<void>;
    }

    /**
     * No session restoring functionality
     * Will need to authenticate via QR code every time
     */
    export class NoAuth extends AuthStrategy {}

    /**
     * Local directory-based authentication
     */
    export class LocalAuth extends AuthStrategy {
        public clientId?: string;
        public dataPath?: string;
        constructor(options?: {
            clientId?: string,
            dataPath?: string
        })
    }
    
    /**
     * Remote-based authentication
     */
     export class RemoteAuth extends AuthStrategy {
        public clientId?: string;
        public dataPath?: string;
        constructor(options?: {
            store: Store,
            clientId?: string,
            dataPath?: string,
            backupSyncIntervalMs: number
        })
    }

    /** 
     * Remote store interface
     */
    export interface Store {
        sessionExists: (options: { session: string }) => Promise<boolean> | boolean,
        delete: (options: { session: string }) => Promise<any> | any,
        save: (options: { session: string }) => Promise<any> | any,
        extract: (options: { session: string, path: string }) => Promise<any> | any,
    }

    /**
     * Legacy session auth strategy
     * Not compatible with multi-device accounts.
     */
     export class LegacySessionAuth extends AuthStrategy {
        constructor(options?: {
            session?: ClientSession,
            restartOnAuthFail?: boolean,
        })
    }

    /** 
     * Represents a WhatsApp client session
     */
    export interface ClientSession {
        WABrowserId: string,
        WASecretBundle: string,
        WAToken1: string,
        WAToken2: string,
    }

    /** 
     * @deprecated
     */
    export interface BatteryInfo {
        /** The current battery percentage */
        battery: number,
        /** Indicates if the phone is plugged in (true) or not (false) */
        plugged: boolean,
    }

    export interface CreateGroupResult {
        /** ID for the group that was just created */
        gid: string,
        /** participants that were not added to the group. 
         * Keys represent the ID for participant that was not added and its value is a status code
         * that represents the reason why participant could not be added. 
         * This is usually 403 if the user's privacy settings don't allow you to add them to groups. */
        missingParticipants: Record<string, string>
    }

    export interface GroupNotification {
        /** ContactId for the user that produced the GroupNotification */
        author: string,
        /** Extra content */
        body: string,
        /** ID for the Chat that this groupNotification was sent for */
        chatId: string,
        /** ID that represents the groupNotification 
         *  @todo create a more specific type for the id object */
        id: object,
        /** Contact IDs for the users that were affected by this GroupNotification */
        recipientIds: string[],
        /** Unix timestamp for when the groupNotification was created */
        timestamp: number,
        /** GroupNotification type */
        type: GroupNotificationTypes,

        /** Returns the Chat this GroupNotification was sent in */
        getChat: () => Promise<Chat>,
        /** Returns the Contact this GroupNotification was produced by */
        getContact: () => Promise<Contact>,
        /** Returns the Contacts affected by this GroupNotification */
        getRecipients: () => Promise<Contact[]>,
        /** Sends a message to the same chat this GroupNotification was produced in */
        reply: (content: MessageContent, options?: MessageSendOptions) => Promise<Message>,

    }
    
    /** whatsapp web url */
    export const WhatsWebURL: string

    /** default client options */
    export const DefaultOptions: ClientOptions

    /** Chat types */
    export enum ChatTypes {
        SOLO = 'solo',
        GROUP = 'group',
        UNKNOWN = 'unknown',
    }

    /** Events that can be emitted by the client */
    export enum Events {
        AUTHENTICATED = 'authenticated',
        AUTHENTICATION_FAILURE = 'auth_failure',
        READY = 'ready',
        MESSAGE_RECEIVED = 'message',
        MESSAGE_CREATE = 'message_create',
        MESSAGE_REVOKED_EVERYONE = 'message_revoke_everyone',
        MESSAGE_REVOKED_ME = 'message_revoke_me',
        MESSAGE_ACK = 'message_ack',
        MESSAGE_EDIT = 'message_edit',
        MEDIA_UPLOADED = 'media_uploaded',
        CONTACT_CHANGED = 'contact_changed',
        GROUP_JOIN = 'group_join',
        GROUP_LEAVE = 'group_leave',
        GROUP_ADMIN_CHANGED = 'group_admin_changed',
        GROUP_UPDATE = 'group_update',
        QR_RECEIVED = 'qr',
        LOADING_SCREEN = 'loading_screen',
        DISCONNECTED = 'disconnected',
        STATE_CHANGED = 'change_state',
        BATTERY_CHANGED = 'change_battery',
        REMOTE_SESSION_SAVED = 'remote_session_saved',
        CALL = 'call'
    }

    /** Group notification types */
    export enum GroupNotificationTypes {
        ADD = 'add',
        INVITE = 'invite',
        REMOVE = 'remove',
        LEAVE = 'leave',
        SUBJECT = 'subject',
        DESCRIPTION = 'description',
        PICTURE = 'picture',
        ANNOUNCE = 'announce',
        RESTRICT = 'restrict',
    }

    /** Message ACK */
    export enum MessageAck {
        ACK_ERROR = -1,
        ACK_PENDING = 0,
        ACK_SERVER = 1,
        ACK_DEVICE = 2,
        ACK_READ = 3,
        ACK_PLAYED = 4,
    }

    /** Message types */
    export enum MessageTypes {
        TEXT = 'chat',
        AUDIO = 'audio',
        VOICE = 'ptt',
        IMAGE = 'image',
        VIDEO = 'video',
        DOCUMENT = 'document',
        STICKER = 'sticker',
        LOCATION = 'location',
        CONTACT_CARD = 'vcard',
        CONTACT_CARD_MULTI = 'multi_vcard',
        REVOKED = 'revoked',
        ORDER = 'order',
        PRODUCT = 'product',
        PAYMENT = 'payment',
        UNKNOWN = 'unknown',
        GROUP_INVITE = 'groups_v4_invite',
        LIST = 'list',
        LIST_RESPONSE = 'list_response',
        BUTTONS_RESPONSE = 'buttons_response',
        BROADCAST_NOTIFICATION = 'broadcast_notification',
        CALL_LOG = 'call_log',
        CIPHERTEXT = 'ciphertext',
        DEBUG = 'debug',
        E2E_NOTIFICATION = 'e2e_notification',
        GP2 = 'gp2',
        GROUP_NOTIFICATION = 'group_notification',
        HSM = 'hsm',
        INTERACTIVE = 'interactive',
        NATIVE_FLOW = 'native_flow',
        NOTIFICATION = 'notification',
        NOTIFICATION_TEMPLATE = 'notification_template',
        OVERSIZED = 'oversized',
        PROTOCOL = 'protocol',
        REACTION = 'reaction',
        TEMPLATE_BUTTON_REPLY = 'template_button_reply',
    }

    /** Client status */
    export enum Status {
        INITIALIZING = 0,
        AUTHENTICATING = 1,
        READY = 3,
    }

    /** WhatsApp state */
    export enum WAState {
        CONFLICT = 'CONFLICT',
        CONNECTED = 'CONNECTED',
        DEPRECATED_VERSION = 'DEPRECATED_VERSION',
        OPENING = 'OPENING',
        PAIRING = 'PAIRING',
        PROXYBLOCK = 'PROXYBLOCK',
        SMB_TOS_BLOCK = 'SMB_TOS_BLOCK',
        TIMEOUT = 'TIMEOUT',
        TOS_BLOCK = 'TOS_BLOCK',
        UNLAUNCHED = 'UNLAUNCHED',
        UNPAIRED = 'UNPAIRED',
        UNPAIRED_IDLE = 'UNPAIRED_IDLE',
    }

    export type MessageInfo = {
        delivery: Array<{id: ContactId, t: number}>,
        deliveryRemaining: number,
        played: Array<{id: ContactId, t: number}>,
        playedRemaining: number,
        read: Array<{id: ContactId, t: number}>,
        readRemaining: number
    }

    export type InviteV4Data = {
        inviteCode: string,
        inviteCodeExp: number,
        groupId: string,
        groupName?: string,
        fromId: string,
        toId: string
    }

    /**
     * Represents a Message on WhatsApp
     * 
     * @example
     * {
     *   mediaKey: undefined,
     *   id: {
     *     fromMe: false,
     *     remote: `554199999999@c.us`,
     *     id: '1234567890ABCDEFGHIJ',
     *     _serialized: `false_554199999999@c.us_1234567890ABCDEFGHIJ`
     *   },
     *   ack: -1,
     *   hasMedia: false,
     *   body: 'Hello!',
     *   type: 'chat',
     *   timestamp: 1591482682,
     *   from: `554199999999@c.us`,
     *   to: `554188888888@c.us`,
     *   author: undefined,
     *   isForwarded: false,
     *   broadcast: false,
     *   fromMe: false,
     *   hasQuotedMsg: false,
     *   hasReaction: false,
     *   location: undefined,
     *   mentionedIds: []
     * }
     */
    export interface Message {
        /** ACK status for the message */
        ack: MessageAck,
        /** If the message was sent to a group, this field will contain the user that sent the message. */
        author?: string,
        /** String that represents from which device type the message was sent */
        deviceType: string,
        /** Message content */
        body: string,
        /** Indicates if the message was a broadcast */
        broadcast: boolean,
        /** Indicates if the message was a status update */
        isStatus: boolean,
        /** Indicates if the message is a Gif */
        isGif: boolean,
        /** Indicates if the message will disappear after it expires */
        isEphemeral: boolean,
        /** ID for the Chat that this message was sent to, except if the message was sent by the current user */
        from: string,
        /** Indicates if the message was sent by the current user */
        fromMe: boolean,
        /** Indicates if the message has media available for download */
        hasMedia: boolean,
        /** Indicates if the message was sent as a reply to another message */
        hasQuotedMsg: boolean,
        /** Indicates whether there are reactions to the message */
        hasReaction: boolean,
        /** Indicates the duration of the message in seconds */
        duration: string,
        /** ID that represents the message */
        id: MessageId,
        /** Indicates if the message was forwarded */
        isForwarded: boolean,
        /**
         * Indicates how many times the message was forwarded.
         * The maximum value is 127.
         */
        forwardingScore: number,
        /** Indicates if the message was starred */
        isStarred: boolean,
        /** Location information contained in the message, if the message is type "location" */
        location: Location,
        /** List of vCards contained in the message */
        vCards: string[],
        /** Invite v4 info */
        inviteV4?: InviteV4Data,
        /** MediaKey that represents the sticker 'ID' */
        mediaKey?: string,
        /** Indicates the mentions in the message body. */
        mentionedIds: [],
        /** Unix timestamp for when the message was created */
        timestamp: number,
        /**
         * ID for who this message is for.
         * If the message is sent by the current user, it will be the Chat to which the message is being sent.
         * If the message is sent by another user, it will be the ID for the current user.
         */
        to: string,
        /** Message type */
        type: MessageTypes,
        /** Links included in the message. */
        links: Array<{
            link: string,
            isSuspicious: boolean
        }>,
        /** Order ID */
        orderId: string,
        /** title */
        title?: string,
        /** description*/
        description?: string,
        /** Business Owner JID */
        businessOwnerJid?: string,
        /** Product JID */
        productId?: string,
        /** Last edit time */
        latestEditSenderTimestampMs?: number,
        /** Last edit message author */
        latestEditMsgKey?: MessageId,
        /** Message buttons */
        dynamicReplyButtons?: object,
        /** Selected button ID */
        selectedButtonId?: string,
        /** Selected list row ID */
        selectedRowId?: string,
        /** Returns message in a raw format */
        rawData: object,
        /* 
        * Reloads this Message object's data in-place with the latest values from WhatsApp Web. 
        * Note that the Message must still be in the web app cache for this to work, otherwise will return null.
        */
        reload: () => Promise<Message>,
        /** Accept the Group V4 Invite in message */
        acceptGroupV4Invite: () => Promise<{status: number}>,
        /** Deletes the message from the chat */
        delete: (everyone?: boolean) => Promise<void>,
        /** Downloads and returns the attached message media */
        downloadMedia: () => Promise<MessageMedia>,
        /** Returns the Chat this message was sent in */
        getChat: () => Promise<Chat>,
        /** Returns the Contact this message was sent from */
        getContact: () => Promise<Contact>,
        /** Returns the Contacts mentioned in this message */
        getMentions: () => Promise<Contact[]>,
        /** Returns the quoted message, if any */
        getQuotedMessage: () => Promise<Message>,
        /** 
         * Sends a message as a reply to this message. 
         * If chatId is specified, it will be sent through the specified Chat.
         * If not, it will send the message in the same Chat as the original message was sent. 
         */
        reply: (content: MessageContent, chatId?: string, options?: MessageSendOptions) => Promise<Message>,
        /** React to this message with an emoji*/
        react: (reaction: string) => Promise<void>,
        /** 
         * Forwards this message to another chat (that you chatted before, otherwise it will fail)
         */
        forward: (chat: Chat | string) => Promise<void>,
        /** Star this message */
        star: () => Promise<void>,
        /** Unstar this message */
        unstar: () => Promise<void>,
        /** Get information about message delivery status */
        getInfo: () => Promise<MessageInfo | null>,
        /**
         * Gets the order associated with a given message
         */
        getOrder: () => Promise<Order>,
        /**
         * Gets the payment details associated with a given message
         */
        getPayment: () => Promise<Payment>,
        /**
         * Gets the reactions associated with the given message
         */
        getReactions: () => Promise<ReactionList[]>,
        /** Edits the current message */
        edit: (content: MessageContent, options?: MessageEditOptions) => Promise<Message | null>,
    }

    /** ID that represents a message */
    export interface MessageId {
        fromMe: boolean,
        remote: string,
        id: string,
        _serialized: string,
    }

    /** Location information */
    export class Location {
        description?: string | null
        latitude: string
        longitude: string
        
        constructor(latitude: number, longitude: number, description?: string)
    }

    export interface Label {
        /** Label name */
        name: string,
        /** Label ID */
        id: string,
        /** Color assigned to the label */
        hexColor: string,

        /** Get all chats that have been assigned this Label */
        getChats: () => Promise<Chat[]>
    }

    /** Options for sending a message */
    export interface MessageSendOptions {
        /** Show links preview. Has no effect on multi-device accounts. */
        linkPreview?: boolean
        /** Send audio as voice message with a generated waveform */
        sendAudioAsVoice?: boolean
        /** Send video as gif */
        sendVideoAsGif?: boolean
        /** Send media as sticker */
        sendMediaAsSticker?: boolean
        /** Send media as document */
        sendMediaAsDocument?: boolean
        /** Send photo/video as a view once message */
        isViewOnce?: boolean
        /** Automatically parse vCards and send them as contacts */
        parseVCards?: boolean
        /** Image or videos caption */
        caption?: string
        /** Id of the message that is being quoted (or replied to) */
        quotedMessageId?: string
        /** Contacts that are being mentioned in the message */
        mentions?: Contact[]
        /** Send 'seen' status */
        sendSeen?: boolean
        /** Media to be sent */
        media?: MessageMedia
        /** Extra options */
        extra?: any
        /** Sticker name, if sendMediaAsSticker is true */
        stickerName?: string
        /** Sticker author, if sendMediaAsSticker is true */
        stickerAuthor?: string
        /** Sticker categories, if sendMediaAsSticker is true */
        stickerCategories?: string[]
    }

    /** Options for editing a message */
    export interface MessageEditOptions {
        /** Show links preview. Has no effect on multi-device accounts. */
        linkPreview?: boolean
        /** Contacts that are being mentioned in the message */
        mentions?: Contact[]
        /** Extra options */
        extra?: any
    }

    export interface MediaFromURLOptions {
        client?: Client
        filename?: string
        unsafeMime?: boolean
        reqOptions?: RequestInit
    }

    /** Media attached to a message */
    export class MessageMedia {
        /** MIME type of the attachment */
        mimetype: string
        /** Base64-encoded data of the file */
        data: string
        /** Document file name. Value can be null */
        filename?: string | null
        /** Document file size in bytes. Value can be null. */
        filesize?: number | null

        /**
         * @param {string} mimetype MIME type of the attachment
         * @param {string} data Base64-encoded data of the file
         * @param {?string} filename Document file name. Value can be null
         * @param {?number} filesize Document file size in bytes. Value can be null.
         */
        constructor(mimetype: string, data: string, filename?: string | null, filesize?: number | null)

        /** Creates a MessageMedia instance from a local file path */
        static fromFilePath: (filePath: string) => MessageMedia

        /** Creates a MessageMedia instance from a URL */
        static fromUrl: (url: string, options?: MediaFromURLOptions) => Promise<MessageMedia>
    }

    export type MessageContent = string | MessageMedia | Location | Contact | Contact[] | List | Buttons

    /**
     * Represents a Contact on WhatsApp
     *
     * @example 
     * {
     *   id: {
     *     server: 'c.us',
     *     user: '554199999999',
     *     _serialized: `554199999999@c.us`
     *   },
     *   number: '554199999999',
     *   isBusiness: false,
     *   isEnterprise: false,
     *   labels: [],
     *   name: undefined,
     *   pushname: 'John',
     *   sectionHeader: undefined,
     *   shortName: undefined,
     *   statusMute: false,
     *   type: 'in',
     *   verifiedLevel: undefined,
     *   verifiedName: undefined,
     *   isMe: false,
     *   isUser: true,
     *   isGroup: false,
     *   isWAContact: true,
     *   isMyContact: false
     * }
     */
    export interface Contact {
        /** Contact's phone number */
        number: string,
        /** Indicates if the contact is a business contact */
        isBusiness: boolean,
        /** ID that represents the contact */
        id: ContactId,
        /** Indicates if the contact is an enterprise contact */
        isEnterprise: boolean,
        /** Indicates if the contact is a group contact */
        isGroup: boolean,
        /** Indicates if the contact is the current user's contact */
        isMe: boolean,
        /** Indicates if the number is saved in the current phone's contacts */
        isMyContact: boolean
        /** Indicates if the contact is a user contact */
        isUser: boolean,
        /** Indicates if the number is registered on WhatsApp */
        isWAContact: boolean,
        /** Indicates if you have blocked this contact */
        isBlocked: boolean,
        /** @todo verify labels type. didn't have any documentation */
        labels?: string[],
        /** The contact's name, as saved by the current user */
        name?: string,
        /** The name that the contact has configured to be shown publically */
        pushname: string,
        /** @todo missing documentation */
        sectionHeader: string,
        /** A shortened version of name */
        shortName?: string,
        /** Indicates if the status from the contact is muted */
        statusMute: boolean,
        /** @todo missing documentation */
        type: string,
        /** @todo missing documentation */
        verifiedLevel?: undefined,
        /** @todo missing documentation */
        verifiedName?: undefined,

        /** Returns the contact's profile picture URL, if privacy settings allow it */
        getProfilePicUrl: () => Promise<string>,

        /** Returns the Chat that corresponds to this Contact.  
         * Will return null when getting chat for currently logged in user.
         */
        getChat: () => Promise<Chat>,
        
        /** Returns the contact's countrycode, (1541859685@c.us) => (1) */
        getCountryCode(): Promise<string>,
        
        /** Returns the contact's formatted phone number, (12345678901@c.us) => (+1 (234) 5678-901) */
        getFormattedNumber(): Promise<string>,
        
        /** Blocks this contact from WhatsApp */
        block: () => Promise<boolean>,

        /** Unlocks this contact from WhatsApp */
        unblock: () => Promise<boolean>,

        /** Gets the Contact's current "about" info. Returns null if you don't have permission to read their status.  */
        getAbout: () => Promise<string | null>,
        
        /** Gets the Contact's common groups with you. Returns empty array if you don't have any common group. */
        getCommonGroups: () => Promise<ChatId[]>

    }

    export interface ContactId {
        server: string,
        user: string,
        _serialized: string,
    }

    export interface BusinessContact extends Contact {
        /** 
         * The contact's business profile
         * @todo add a more specific type for the object
         */
        businessProfile: object
    }

    export interface PrivateContact extends Contact {

    }

    /**
     * Represents a Chat on WhatsApp
     *
     * @example
     * {
     *   id: {
     *     server: 'c.us',
     *     user: '554199999999',
     *     _serialized: `554199999999@c.us`
     *   },
     *   name: '+55 41 9999-9999',
     *   isGroup: false,
     *   isReadOnly: false,
     *   unreadCount: 6,
     *   timestamp: 1591484087,
     *   archived: false
     * }
     */
    export interface Chat {
        /** Indicates if the Chat is archived */
        archived: boolean,
        /** ID that represents the chat */
        id: ChatId,
        /** Indicates if the Chat is a Group Chat */
        isGroup: boolean,
        /** Indicates if the Chat is readonly */
        isReadOnly: boolean,
        /** Indicates if the Chat is muted */
        isMuted: boolean,
        /** Unix timestamp for when the mute expires */
        muteExpiration: number,
        /** Title of the chat */
        name: string,
        /** Unix timestamp for when the last activity occurred */
        timestamp: number,
        /** Amount of messages unread */
        unreadCount: number,
        /** Last message fo chat */
        lastMessage: Message,

        /** Archives this chat */
        archive: () => Promise<void>,
        /** Pins this chat and returns its new Pin state */
        pin: () => Promise<boolean>,
        /** Unpins this chat and returns its new Pin state */
        unpin: () => Promise<boolean>,
        /** Clears all messages from the chat */
        clearMessages: () => Promise<boolean>,
        /** Stops typing or recording in chat immediately. */
        clearState: () => Promise<boolean>,
        /** Deletes the chat */
        delete: () => Promise<boolean>,
        /** Loads chat messages, sorted from earliest to latest. */
        fetchMessages: (searchOptions: MessageSearchOptions) => Promise<Message[]>,
        /** Mutes this chat forever, unless a date is specified */
        mute: (unmuteDate?: Date) => Promise<void>,
        /** Send a message to this chat */
        sendMessage: (content: MessageContent, options?: MessageSendOptions) => Promise<Message>,
        /** Set the message as seen */
        sendSeen: () => Promise<void>,
        /** Simulate recording audio in chat. This will last for 25 seconds */
        sendStateRecording: () => Promise<void>,
        /** Simulate typing in chat. This will last for 25 seconds. */
        sendStateTyping: () => Promise<void>,
        /** un-archives this chat */
        unarchive: () => Promise<void>,
        /** Unmutes this chat */
        unmute: () => Promise<void>,
        /** Returns the Contact that corresponds to this Chat. */
        getContact: () => Promise<Contact>,
        /** Marks this Chat as unread */
        markUnread: () => Promise<void>
        /** Returns array of all Labels assigned to this Chat */
        getLabels: () => Promise<Label[]>
        /** Add or remove labels to this Chat */
        changeLabels: (labelIds: Array<string | number>) => Promise<void>
    }

    export interface MessageSearchOptions {
        /**
         * The amount of messages to return. If no limit is specified, the available messages will be returned.
         * Note that the actual number of returned messages may be smaller if there aren't enough messages in the conversation. 
         * Set this to Infinity to load all messages.
         */
        limit?: number
        /**
        * Return only messages from the bot number or vise versa. To get all messages, leave the option undefined.
        */
        fromMe?: boolean
    }

    /**
     * Id that represents the chat
     * 
     * @example
     * id: {
     *   server: 'c.us',
     *   user: '554199999999',
     *   _serialized: `554199999999@c.us`
     * },
     */
    export interface ChatId {
        /**
         * Whatsapp server domain
         * @example `c.us`
         */
        server: string,
        /**
         * User whatsapp number
         * @example `554199999999`
         */
        user: string,
        /**
         * Serialized id
         * @example `554199999999@c.us`
         */
        _serialized: string,
    }

    export interface PrivateChat extends Chat {

    }

    export type GroupParticipant = {
        id: ContactId,
        isAdmin: boolean
        isSuperAdmin: boolean
    }

    /** Promotes or demotes participants by IDs to regular users or admins */
    export type ChangeParticipantsPermissions = 
        (participantIds: Array<string>) => Promise<{ status: number }>

    /** Adds or removes a list of participants by ID to the group */
    export type ChangeGroupParticipants = 
        (participantIds: Array<string>) => Promise<{
            status: number;
            participants: Array<{
                [key: string]: {
                    code: number
                }
            }>
         } & {
             [key: string]: number;
         }>

    export interface GroupChat extends Chat {
        /** Group owner */
        owner: ContactId;
        /** Date at which the group was created */
        createdAt: Date;
        /** Group description */
        description: string;
        /** Group participants */
        participants: Array<GroupParticipant>;
        /** Adds a list of participants by ID to the group */
        addParticipants: ChangeGroupParticipants;
        /** Removes a list of participants by ID to the group */
        removeParticipants: ChangeGroupParticipants;
        /** Promotes participants by IDs to admins */
        promoteParticipants: ChangeParticipantsPermissions;
        /** Demotes participants by IDs to regular users */
        demoteParticipants: ChangeParticipantsPermissions;
        /** Updates the group subject */
        setSubject: (subject: string) => Promise<boolean>;
        /** Updates the group description */
        setDescription: (description: string) => Promise<boolean>;
        /** Updates the group settings to only allow admins to send messages 
         * @param {boolean} [adminsOnly=true] Enable or disable this option 
         * @returns {Promise<boolean>} Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
         */
        setMessagesAdminsOnly: (adminsOnly?: boolean) => Promise<boolean>;
        /**
         * Updates the group settings to only allow admins to edit group info (title, description, photo).
         * @param {boolean} [adminsOnly=true] Enable or disable this option 
         * @returns {Promise<boolean>} Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
         */
        setInfoAdminsOnly: (adminsOnly?: boolean) => Promise<boolean>;
        /** Gets the invite code for a specific group */
        getInviteCode: () => Promise<string>;
        /** Invalidates the current group invite code and generates a new one */
        revokeInvite: () => Promise<void>;
        /** Makes the bot leave the group */
        leave: () => Promise<void>;
        /** Sets the group's picture.*/
        setPicture: (media: MessageMedia) => Promise<boolean>;
        /** Deletes the group's picture */
        deletePicture: () => Promise<boolean>;
    }

    /**
     * Represents the metadata associated with a given product
     *
     */
    export interface ProductMetadata {
        /** Product Id */
        id: string,
        /** Product Name */
        name: string,
        /** Product Description */
        description: string,
        /** Retailer ID */
        retailer_id?: string
    }

    /**
     * Represents a Product on Whatsapp
     * @example
     * {
     * "id": "123456789",
     * "price": "150000",
     * "thumbnailId": "123456789",
     * "thumbnailUrl": "https://mmg.whatsapp.net",
     * "currency": "GTQ",
     * "name": "Store Name",
     * "quantity": 1
     * }
     */
    export interface Product {
        /** Product Id */
        id: string,
        /** Price */
        price?: string,
        /** Product Thumbnail*/
        thumbnailUrl: string,
        /** Currency */
        currency: string,
        /** Product Name */
        name: string,
        /** Product Quantity*/
        quantity: number,
        /** Gets the Product metadata */
        getData: () => Promise<ProductMetadata>
    }

    /**
     * Represents a Order on WhatsApp
     *
     * @example
     * {
     * "products": [
     * {
     * "id": "123456789",
     * "price": "150000",
     * "thumbnailId": "123456789",
     * "thumbnailUrl": "https://mmg.whatsapp.net",
     * "currency": "GTQ",
     * "name": "Store Name",
     * "quantity": 1
     * }
     * ],
     * "subtotal": "150000",
     * "total": "150000",
     * "currency": "GTQ",
     * "createdAt": 1610136796,
     * "sellerJid": "55555555@s.whatsapp.net"
     * }
     */
    export interface Order {
        /** List of products*/
        products: Array<Product>,
        /** Order Subtotal */
        subtotal: string,
        /** Order Total */
        total: string,
        /** Order Currency */
        currency: string,
        /** Order Created At*/
        createdAt: number;
    }

    /**
     * Represents a Payment on WhatsApp
     *
     * @example
     * {
     * id: {
     * fromMe: true,
     * remote: {
     * server: 'c.us',
     * user: '5511999999999',
     * _serialized: '5511999999999@c.us'
     * },
     *  id: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
     * _serialized: 'true_5511999999999@c.us_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
     * },
     * paymentCurrency: 'BRL',
     * paymentAmount1000: 1000,
     * paymentMessageReceiverJid: {
     * server: 'c.us',
     * user: '5511999999999',
     * _serialized: '5511999999999@c.us'
     * },
     * paymentTransactionTimestamp: 1623463058,
     * paymentStatus: 4,
     * paymentTxnStatus: 4,
     * paymentNote: 'note'
     * }
     */
    export interface Payment {
        /** Payment Id*/
        id: object,
        /** Payment currency */
        paymentCurrency: string,
        /** Payment ammount  */
        paymentAmount1000 : number,
        /** Payment receiver */
        paymentMessageReceiverJid : object,
        /** Payment transaction timestamp */
        paymentTransactionTimestamp : number,
        /** Payment paymentStatus */
        paymentStatus : number,
        /** Integer that represents the payment Text */
        paymentTxnStatus  : number,
        /** The note sent with the payment */
        paymentNote  : string;
    }
    
    /**
     * Represents a Call on WhatsApp
     *
     * @example
     * Call {
     * id: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
     * from: '5511999999@c.us',
     * timestamp: 1625003709,
     * isVideo: false,
     * isGroup: false,
     * fromMe: false,
     * canHandleLocally: false,
     * webClientShouldHandle: false,
     * participants: []
     * }
     */
    export interface Call {
        /** Call Id */
        id: string,
        /** from */
        from?: string,
        /** Unix timestamp for when the call was created*/
        timestamp: number,
        /** Is video */
        isVideo: boolean,
        /** Is Group */
        isGroup: boolean,
        /** Indicates if the call was sent by the current user */
        fromMe: boolean,
        /** indicates if the call can be handled in waweb */
        canHandleLocally: boolean,
        /** indicates if the call should be handled in waweb */
        webClientShouldHandle: boolean,
        /** Object with participants */
        participants: object

        /** Reject the call */
        reject: () => Promise<void>
    }

    /** Message type List */
    export class List {
        body: string
        buttonText: string
        sections: Array<any>
        title?: string | null
        footer?: string | null
        
        constructor(body: string, buttonText: string, sections: Array<any>, title?: string | null, footer?: string | null)
    }
    
    /** Message type Buttons */
    export class Buttons {
        body: string | MessageMedia
        buttons: Array<{ buttonId: string; buttonText: {displayText: string}; type: number }>
        title?: string | null
        footer?: string | null
        
        constructor(body: string, buttons: Array<{ id?: string; body: string }>, title?: string | null, footer?: string | null)
    }

    /** Message type Reaction */
    export class Reaction {
        id: MessageId
        orphan: number
        orphanReason?: string
        timestamp: number
        reaction: string
        read: boolean
        msgId: MessageId
        senderId: string
        ack?: number
    }
    
    export type ReactionList = {
        id: string,
        aggregateEmoji: string,
        hasReactionByMe: boolean,
        senders: Array<Reaction>
    }
}

export = WAWebJS
