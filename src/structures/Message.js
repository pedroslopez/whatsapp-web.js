'use strict';

const Base = require('./Base');
const MessageMedia = require('./MessageMedia');
const Location = require('./Location');
const Order = require('./Order');
const Payment = require('./Payment');
const Reaction = require('./Reaction');
const {MessageTypes} = require('../util/Constants');

/**
 * Represents a Message on WhatsApp
 * @extends {Base}
 */
class Message extends Base {
    constructor(client, data) {
        super(client);

        if (data) this._patch(data);
    }

    _patch(data) {
        this._data = data;
        
        /**
         * MediaKey that represents the sticker 'ID'
         * @type {string}
         */
        this.mediaKey = data.mediaKey;
        
        /**
         * ID that represents the message
         * @type {object}
         */
        this.id = data.id;

        /**
         * ACK status for the message
         * @type {MessageAck}
         */
        this.ack = data.ack;

        /**
         * Indicates if the message has media available for download
         * @type {boolean}
         */
        this.hasMedia = Boolean(data.mediaKey && data.directPath);

        /**
         * Message content
         * @type {string}
         */
        this.body = this.hasMedia ? data.caption || '' : data.body || '';

        /**
         * Message type
         * @type {MessageTypes}
         */
        this.type = data.type;

        /**
         * Unix timestamp for when the message was created
         * @type {number}
         */
        this.timestamp = data.t;

        /**
         * ID for the Chat that this message was sent to, except if the message was sent by the current user.
         * @type {string}
         */
        this.from = (typeof (data.from) === 'object' && data.from !== null) ? data.from._serialized : data.from;

        /**
         * ID for who this message is for.
         *
         * If the message is sent by the current user, it will be the Chat to which the message is being sent.
         * If the message is sent by another user, it will be the ID for the current user.
         * @type {string}
         */
        this.to = (typeof (data.to) === 'object' && data.to !== null) ? data.to._serialized : data.to;

        /**
         * If the message was sent to a group, this field will contain the user that sent the message.
         * @type {string}
         */
        this.author = (typeof (data.author) === 'object' && data.author !== null) ? data.author._serialized : data.author;

        /**
         * String that represents from which device type the message was sent
         * @type {string}
         */
        this.deviceType = typeof data.id.id === 'string' && data.id.id.length > 21 ? 'android' : typeof data.id.id === 'string' && data.id.id.substring(0, 2) === '3A' ? 'ios' : 'web';
        /**
         * Indicates if the message was forwarded
         * @type {boolean}
         */
        this.isForwarded = data.isForwarded;

        /**
         * Indicates how many times the message was forwarded.
         *
         * The maximum value is 127.
         * @type {number}
         */
        this.forwardingScore = data.forwardingScore || 0;

        /**
         * Indicates if the message is a status update
         * @type {boolean}
         */
        this.isStatus = data.isStatusV3 || data.id.remote === 'status@broadcast';

        /**
         * Indicates if the message was starred
         * @type {boolean}
         */
        this.isStarred = data.star;

        /**
         * Indicates if the message was a broadcast
         * @type {boolean}
         */
        this.broadcast = data.broadcast;

        /**
         * Indicates if the message was sent by the current user
         * @type {boolean}
         */
        this.fromMe = data.id.fromMe;

        /**
         * Indicates if the message was sent as a reply to another message.
         * @type {boolean}
         */
        this.hasQuotedMsg = data.quotedMsg ? true : false;

        /**
         * Indicates whether there are reactions to the message
         * @type {boolean}
         */
        this.hasReaction = data.hasReaction ? true : false;

        /**
         * Indicates the duration of the message in seconds
         * @type {string}
         */
        this.duration = data.duration ? data.duration : undefined;

        /**
         * Location information contained in the message, if the message is type "location"
         * @type {Location}
         */
        this.location = data.type === MessageTypes.LOCATION ? new Location(data.lat, data.lng, data.loc) : undefined;

        /**
         * List of vCards contained in the message.
         * @type {Array<string>}
         */
        this.vCards = data.type === MessageTypes.CONTACT_CARD_MULTI ? data.vcardList.map((c) => c.vcard) : data.type === MessageTypes.CONTACT_CARD ? [data.body] : [];

        /**
         * Group Invite Data
         * @type {object}
         */
        this.inviteV4 = data.type === MessageTypes.GROUP_INVITE ? {
            inviteCode: data.inviteCode,
            inviteCodeExp: data.inviteCodeExp,
            groupId: data.inviteGrp,
            groupName: data.inviteGrpName,
            fromId: data.from._serialized,
            toId: data.to._serialized
        } : undefined;

        /**
         * Indicates the mentions in the message body.
         * @type {Array<string>}
         */
        this.mentionedIds = [];

        if (data.mentionedJidList) {
            this.mentionedIds = data.mentionedJidList;
        }

        /**
         * Order ID for message type ORDER
         * @type {string}
         */
        this.orderId = data.orderId ? data.orderId : undefined;
        /**
         * Order Token for message type ORDER
         * @type {string}
         */
        this.token = data.token ? data.token : undefined;

        /** 
         * Indicates whether the message is a Gif
         * @type {boolean}
         */
        this.isGif = Boolean(data.isGif);

        /**
         * Indicates if the message will disappear after it expires
         * @type {boolean}
         */
        this.isEphemeral = data.isEphemeral;

        /** Title */
        if (data.title) {
            this.title = data.title;
        }

        /** Description */
        if (data.description) {
            this.description = data.description;
        }

        /** Business Owner JID */
        if (data.businessOwnerJid) {
            this.businessOwnerJid = data.businessOwnerJid;
        }

        /** Product ID */
        if (data.productId) {
            this.productId = data.productId;
        }

        /**
         * Links included in the message.
         * @type {Array<{link: string, isSuspicious: boolean}>}
         *
         */
        this.links = data.links;

        /** Buttons */
        if (data.dynamicReplyButtons) {
            this.dynamicReplyButtons = data.dynamicReplyButtons;
        }

        /** Selected Button Id **/
        if (data.selectedButtonId) {
            this.selectedButtonId = data.selectedButtonId;
        }

        /** Selected List row Id **/
        if (data.listResponse && data.listResponse.singleSelectReply.selectedRowId) {
            this.selectedRowId = data.listResponse.singleSelectReply.selectedRowId;
        }

        return super._patch(data);
    }

    _getChatId() {
        return this.fromMe ? this.to : this.from;
    }

    /**
     * Reloads this Message object's data in-place with the latest values from WhatsApp Web. 
     * Note that the Message must still be in the web app cache for this to work, otherwise will return null.
     * @returns {Promise<Message>}
     */
    async reload() {
        const newData = await this.client.pupPage.evaluate((msgId) => {
            const msg = window.Store.Msg.get(msgId);
            if(!msg) return null;
            return window.WWebJS.getMessageModel(msg);
        }, this.id._serialized);

        if(!newData) return null;
        
        this._patch(newData);
        return this;
    }

    /**
     * Returns message in a raw format
     * @type {Object}
     */
    get rawData() {
        return this._data;
    }
    
    /**
     * Returns the Chat this message was sent in
     * @returns {Promise<Chat>}
     */
    getChat() {
        return this.client.getChatById(this._getChatId());
    }

    /**
     * Returns the Contact this message was sent from
     * @returns {Promise<Contact>}
     */
    getContact() {
        return this.client.getContactById(this.author || this.from);
    }

    /**
     * Returns the Contacts mentioned in this message
     * @returns {Promise<Array<Contact>>}
     */
    async getMentions() {
        return await Promise.all(this.mentionedIds.map(async m => await this.client.getContactById(m)));
    }

    /**
     * Returns the quoted message, if any
     * @returns {Promise<Message>}
     */
    async getQuotedMessage() {
        if (!this.hasQuotedMsg) return undefined;

        const quotedMsg = await this.client.pupPage.evaluate((msgId) => {
            const msg = window.Store.Msg.get(msgId);
            const quotedMsg = window.Store.QuotedMsg.getQuotedMsgObj(msg);
            return window.WWebJS.getMessageModel(quotedMsg);
        }, this.id._serialized);

        return new Message(this.client, quotedMsg);
    }

    /**
     * Sends a message as a reply to this message. If chatId is specified, it will be sent
     * through the specified Chat. If not, it will send the message
     * in the same Chat as the original message was sent.
     *
     * @param {string|MessageMedia|Location} content
     * @param {string} [chatId]
     * @param {MessageSendOptions} [options]
     * @returns {Promise<Message>}
     */
    async reply(content, chatId, options = {}) {
        if (!chatId) {
            chatId = this._getChatId();
        }

        options = {
            ...options,
            quotedMessageId: this.id._serialized
        };

        return this.client.sendMessage(chatId, content, options);
    }

    /**
     * React to this message with an emoji
     * @param {string} reaction - Emoji to react with. Send an empty string to remove the reaction.
     * @return {Promise}
     */
    async react(reaction){
        await this.client.pupPage.evaluate(async (messageId, reaction) => {
            if (!messageId) { return undefined; }
            
            const msg = await window.Store.Msg.get(messageId);
            await window.Store.sendReactionToMsg(msg, reaction);
        }, this.id._serialized, reaction);
    }

    /**
     * Accept Group V4 Invite
     * @returns {Promise<Object>}
     */
    async acceptGroupV4Invite() {
        return await this.client.acceptGroupV4Invite(this.inviteV4);
    }

    /**
     * Forwards this message to another chat (that you chatted before, otherwise it will fail)
     *
     * @param {string|Chat} chat Chat model or chat ID to which the message will be forwarded
     * @returns {Promise}
     */
    async forward(chat) {
        const chatId = typeof chat === 'string' ? chat : chat.id._serialized;

        await this.client.pupPage.evaluate(async (msgId, chatId) => {
            let msg = window.Store.Msg.get(msgId);
            let chat = window.Store.Chat.get(chatId);

            return await chat.forwardMessages([msg]);
        }, this.id._serialized, chatId);
    }

    /**
     * Downloads and returns the attatched message media
     * @returns {Promise<MessageMedia>}
     */
    async downloadMedia() {
        if (!this.hasMedia) {
            return undefined;
        }

        const result = await this.client.pupPage.evaluate(async (msgId) => {
            const msg = window.Store.Msg.get(msgId);
            if (!msg) {
                return undefined;
            }
            if (msg.mediaData.mediaStage != 'RESOLVED') {
                // try to resolve media
                await msg.downloadMedia({
                    downloadEvenIfExpensive: true,
                    rmrReason: 1
                });
            }

            if (msg.mediaData.mediaStage.includes('ERROR') || msg.mediaData.mediaStage === 'FETCHING') {
                // media could not be downloaded
                return undefined;
            }

            try {
                const decryptedMedia = await window.Store.DownloadManager.downloadAndMaybeDecrypt({
                    directPath: msg.directPath,
                    encFilehash: msg.encFilehash,
                    filehash: msg.filehash,
                    mediaKey: msg.mediaKey,
                    mediaKeyTimestamp: msg.mediaKeyTimestamp,
                    type: msg.type,
                    signal: (new AbortController).signal
                });

                const data = await window.WWebJS.arrayBufferToBase64Async(decryptedMedia);

                return {
                    data,
                    mimetype: msg.mimetype,
                    filename: msg.filename,
                    filesize: msg.size
                };
            } catch (e) {
                if(e.status && e.status === 404) return undefined;
                throw e;
            }
        }, this.id._serialized);

        if (!result) return undefined;
        return new MessageMedia(result.mimetype, result.data, result.filename, result.filesize);
    }

    /**
     * Deletes a message from the chat
     * @param {?boolean} everyone If true and the message is sent by the current user or the user is an admin, will delete it for everyone in the chat.
     */
    async delete(everyone) {
        await this.client.pupPage.evaluate(async (msgId, everyone) => {
            let msg = window.Store.Msg.get(msgId);
            let chat = await window.Store.Chat.find(msg.id.remote);
            
            const canRevoke = window.Store.MsgActionChecks.canSenderRevokeMsg(msg) || window.Store.MsgActionChecks.canAdminRevokeMsg(msg);
            if (everyone && canRevoke) {
                return window.Store.Cmd.sendRevokeMsgs(chat, [msg], { clearMedia: true, type: msg.id.fromMe ? 'Sender' : 'Admin' });
            }

            return window.Store.Cmd.sendDeleteMsgs(chat, [msg], true);
        }, this.id._serialized, everyone);
    }

    /**
     * Stars this message
     */
    async star() {
        await this.client.pupPage.evaluate(async (msgId) => {
            let msg = window.Store.Msg.get(msgId);
            
            if (window.Store.MsgActionChecks.canStarMsg(msg)) {
                let chat = await window.Store.Chat.find(msg.id.remote);
                return window.Store.Cmd.sendStarMsgs(chat, [msg], false);
            }
        }, this.id._serialized);
    }

    /**
     * Unstars this message
     */
    async unstar() {
        await this.client.pupPage.evaluate(async (msgId) => {
            let msg = window.Store.Msg.get(msgId);

            if (window.Store.MsgActionChecks.canStarMsg(msg)) {
                let chat = await window.Store.Chat.find(msg.id.remote);
                return window.Store.Cmd.sendUnstarMsgs(chat, [msg], false);
            }
        }, this.id._serialized);
    }

    /**
     * Message Info
     * @typedef {Object} MessageInfo
     * @property {Array<{id: ContactId, t: number}>} delivery Contacts to which the message has been delivered to
     * @property {number} deliveryRemaining Amount of people to whom the message has not been delivered to
     * @property {Array<{id: ContactId, t: number}>} played Contacts who have listened to the voice message
     * @property {number} playedRemaining Amount of people who have not listened to the message
     * @property {Array<{id: ContactId, t: number}>} read Contacts who have read the message
     * @property {number} readRemaining Amount of people who have not read the message
     */

    /**
     * Get information about message delivery status. May return null if the message does not exist or is not sent by you.
     * @returns {Promise<?MessageInfo>}
     */
    async getInfo() {
        const info = await this.client.pupPage.evaluate(async (msgId) => {
            const msg = window.Store.Msg.get(msgId);
            if (!msg) return null;

            return await window.Store.MessageInfo.sendQueryMsgInfo(msg.id);
        }, this.id._serialized);

        return info;
    }

    /**
     * Gets the order associated with a given message
     * @return {Promise<Order>}
     */
    async getOrder() {
        if (this.type === MessageTypes.ORDER) {
            const result = await this.client.pupPage.evaluate((orderId, token, chatId) => {
                return window.WWebJS.getOrderDetail(orderId, token, chatId);
            }, this.orderId, this.token, this._getChatId());
            if (!result) return undefined;
            return new Order(this.client, result);
        }
        return undefined;
    }
    /**
     * Gets the payment details associated with a given message
     * @return {Promise<Payment>}
     */
    async getPayment() {
        if (this.type === MessageTypes.PAYMENT) {
            const msg = await this.client.pupPage.evaluate(async (msgId) => {
                const msg = window.Store.Msg.get(msgId);
                if(!msg) return null;
                return msg.serialize();
            }, this.id._serialized);
            return new Payment(this.client, msg);
        }
        return undefined;
    }


    /**
     * Reaction List
     * @typedef {Object} ReactionList
     * @property {string} id Original emoji
     * @property {string} aggregateEmoji aggregate emoji
     * @property {boolean} hasReactionByMe Flag who sent the reaction
     * @property {Array<Reaction>} senders Reaction senders, to this message
     */

    /**
     * Gets the reactions associated with the given message
     * @return {Promise<ReactionList[]>}
     */
    async getReactions() {
        if (!this.hasReaction) {
            return undefined;
        }

        const reactions = await this.client.pupPage.evaluate(async (msgId) => {
            const msgReactions = await window.Store.Reactions.find(msgId);
            if (!msgReactions || !msgReactions.reactions.length) return null;
            return msgReactions.reactions.serialize();
        }, this.id._serialized);

        if (!reactions) {
            return undefined;
        }

        return reactions.map(reaction => {
            reaction.senders = reaction.senders.map(sender => {
                sender.timestamp = Math.round(sender.timestamp / 1000);
                return new Reaction(this.client, sender);
            });
            return reaction;
        });
    }
}

module.exports = Message;
