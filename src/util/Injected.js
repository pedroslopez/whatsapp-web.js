'use strict';

// Exposes the internal Store to the WhatsApp Web client
exports.ExposeStore = (moduleRaidStr) => {
    eval('var moduleRaid = ' + moduleRaidStr);
    // eslint-disable-next-line no-undef
    window.mR = moduleRaid();
    window.Store = Object.assign({}, window.mR.findModule(m => m.default && m.default.Chat)[0].default);
    window.Store.AppState = window.mR.findModule('Socket')[0].Socket;
    window.Store.Conn = window.mR.findModule('Conn')[0].Conn;
    window.Store.BlockContact = window.mR.findModule('blockContact')[0];
    window.Store.Call = window.mR.findModule((module) => module.default && module.default.Call)[0].default.Call;
    window.Store.Cmd = window.mR.findModule('Cmd')[0].Cmd;
    window.Store.CryptoLib = window.mR.findModule('decryptE2EMedia')[0];
    window.Store.DownloadManager = window.mR.findModule('downloadManager')[0].downloadManager;
    window.Store.GroupMetadata = window.mR.findModule('GroupMetadata')[0].default.GroupMetadata;
    window.Store.GroupMetadata.queryAndUpdate = window.mR.findModule('queryAndUpdateGroupMetadataById')[0].queryAndUpdateGroupMetadataById;
    window.Store.Label = window.mR.findModule('LabelCollection')[0].LabelCollection;
    window.Store.ContactCollection = window.mR.findModule('ContactCollection')[0].ContactCollection;
    window.Store.MediaPrep = window.mR.findModule('prepRawMedia')[0];
    window.Store.MediaObject = window.mR.findModule('getOrCreateMediaObject')[0];
    window.Store.NumberInfo = window.mR.findModule('formattedPhoneNumber')[0];
    window.Store.MediaTypes = window.mR.findModule('msgToMediaType')[0];
    window.Store.MediaUpload = window.mR.findModule('uploadMedia')[0];
    window.Store.MsgKey = window.mR.findModule((module) => module.default && module.default.fromString)[0].default;
    window.Store.MessageInfo = window.mR.findModule('sendQueryMsgInfo')[0];
    window.Store.OpaqueData = window.mR.findModule(module => module.default && module.default.createFromData)[0].default;
    window.Store.QueryProduct = window.mR.findModule('queryProduct')[0];
    window.Store.QueryOrder = window.mR.findModule('queryOrder')[0];
    window.Store.SendClear = window.mR.findModule('sendClear')[0];
    window.Store.SendDelete = window.mR.findModule('sendDelete')[0];
    window.Store.SendMessage = window.mR.findModule('addAndSendMsgToChat')[0];
    window.Store.EditMessage = window.mR.findModule('addAndSendMessageEdit')[0];
    window.Store.SendSeen = window.mR.findModule('sendSeen')[0];
    window.Store.User = window.mR.findModule('getMaybeMeUser')[0];
    window.Store.ContactMethods = window.mR.findModule('getUserid')[0];
    window.Store.BusinessProfileCollection = window.mR.findModule('BusinessProfileCollection')[0].BusinessProfileCollection;
    window.Store.UploadUtils = window.mR.findModule((module) => (module.default && module.default.encryptAndUpload) ? module.default : null)[0].default;
    window.Store.UserConstructor = window.mR.findModule((module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null)[0].default;
    window.Store.Validators = window.mR.findModule('findLinks')[0];
    window.Store.VCard = window.mR.findModule('vcardFromContactModel')[0];
    window.Store.WidFactory = window.mR.findModule('createWid')[0];
    window.Store.ProfilePic = window.mR.findModule('profilePicResync')[0];
    window.Store.PresenceUtils = window.mR.findModule('sendPresenceAvailable')[0];
    window.Store.ChatState = window.mR.findModule('sendChatStateComposing')[0];
    window.Store.findCommonGroups = window.mR.findModule('findCommonGroups')[0].findCommonGroups;
    window.Store.StatusUtils = window.mR.findModule('setMyStatus')[0];
    window.Store.ConversationMsgs = window.mR.findModule('loadEarlierMsgs')[0];
    window.Store.sendReactionToMsg = window.mR.findModule('sendReactionToMsg')[0].sendReactionToMsg;
    window.Store.createOrUpdateReactionsModule = window.mR.findModule('createOrUpdateReactions')[0];
    window.Store.EphemeralFields = window.mR.findModule('getEphemeralFields')[0];
    window.Store.MsgActionChecks = window.mR.findModule('canSenderRevokeMsg')[0];
    window.Store.QuotedMsg = window.mR.findModule('getQuotedMsgObj')[0];
    window.Store.Socket = window.mR.findModule('deprecatedSendIq')[0];
    window.Store.SocketWap = window.mR.findModule('wap')[0];
    window.Store.SearchContext = window.mR.findModule('getSearchContext')[0].getSearchContext;
    window.Store.DrawerManager = window.mR.findModule('DrawerManager')[0].DrawerManager;
    window.Store.LidUtils = window.mR.findModule('getCurrentLid')[0];
    window.Store.WidToJid = window.mR.findModule('widToUserJid')[0];
    window.Store.JidToWid = window.mR.findModule('userJidToUserWid')[0];
    
    /* eslint-disable no-undef, no-cond-assign */
    window.Store.QueryExist = ((m = window.mR.findModule('queryExists')[0]) ? m.queryExists : window.mR.findModule('queryExist')[0].queryWidExists);
    window.Store.ReplyUtils = (m = window.mR.findModule('canReplyMsg')).length > 0 && m[0];
    /* eslint-enable no-undef, no-cond-assign */

    window.Store.StickerTools = {
        ...window.mR.findModule('toWebpSticker')[0],
        ...window.mR.findModule('addWebpMetadata')[0]
    };
    window.Store.GroupUtils = {
        ...window.mR.findModule('createGroup')[0],
        ...window.mR.findModule('setGroupDescription')[0],
        ...window.mR.findModule('sendExitGroup')[0],
        ...window.mR.findModule('sendSetPicture')[0]
    };
    window.Store.GroupParticipants = {
        ...window.mR.findModule('promoteParticipants')[0],
        ...window.mR.findModule('sendAddParticipantsRPC')[0]
    };
    window.Store.GroupInvite = {
        ...window.mR.findModule('resetGroupInviteCode')[0],
        ...window.mR.findModule('queryGroupInvite')[0]
    };
    window.Store.GroupInviteV4 = {
        ...window.mR.findModule('queryGroupInviteV4')[0],
        ...window.mR.findModule('sendGroupInviteMessage')[0]
    };
    window.Store.MembershipRequestUtils = {
        ...window.mR.findModule('getMembershipApprovalRequests')[0],
        ...window.mR.findModule('sendMembershipRequestsActionRPC')[0]
    };

    if (!window.Store.Chat._find) {
        window.Store.Chat._find = e => {
            const target = window.Store.Chat.get(e);
            return target ? Promise.resolve(target) : Promise.resolve({
                id: e
            });
        };
    }
    
    // eslint-disable-next-line no-undef
    if ((m = window.mR.findModule('ChatCollection')[0]) && m.ChatCollection && typeof m.ChatCollection.findImpl === 'undefined' && typeof m.ChatCollection._find !== 'undefined') m.ChatCollection.findImpl = m.ChatCollection._find;

    // TODO remove these once everybody has been updated to WWebJS with legacy sessions removed
    const _linkPreview = window.mR.findModule('queryLinkPreview');
    if (_linkPreview && _linkPreview[0] && _linkPreview[0].default) {
        window.Store.Wap = _linkPreview[0].default;
    }

    const _isMDBackend = window.mR.findModule('isMDBackend');
    if(_isMDBackend && _isMDBackend[0] && _isMDBackend[0].isMDBackend) {
        window.Store.MDBackend = _isMDBackend[0].isMDBackend();
    } else {
        window.Store.MDBackend = true;
    }

    const _features = window.mR.findModule('FEATURE_CHANGE_EVENT')[0];
    if(_features) {
        window.Store.Features = _features.LegacyPhoneFeatures;
    }

    /**
     * Target options object description
     * @typedef {Object} TargetOptions
     * @property {string|number} moduleId The name or a key of the target module to search
     * @property {number} index The index value of the target module
     * @property {string} property The function name to get from a module
     */

    /**
     * Function to modify functions
     * @param {TargetOptions} target Options specifying the target function to search for modifying
     * @param {Function} callback Modified function
     */
    window.injectToFunction = (target, callback) => {
        const module = typeof target.moduleId === 'string'
            ? window.mR.findModule(target.moduleId)
            : window.mR.modules[target.moduleId];
        const originalFunction = module[target.index][target.property];
        const modifiedFunction = (...args) => callback(originalFunction, ...args);
        module[target.index][target.property] = modifiedFunction;
    };

    window.injectToFunction({ moduleId: 'mediaTypeFromProtobuf', index: 0, property: 'mediaTypeFromProtobuf' }, (func, ...args) => { const [proto] = args; return proto.locationMessage ? null : func(...args); });

    window.injectToFunction({ moduleId: 'typeAttributeFromProtobuf', index: 0, property: 'typeAttributeFromProtobuf' }, (func, ...args) => { const [proto] = args; return proto.locationMessage || proto.groupInviteMessage ? 'text' : func(...args); });
};

exports.LoadUtils = () => {
    window.WWebJS = {};

    window.WWebJS.sendSeen = async (chatId) => {
        let chat = window.Store.Chat.get(chatId);
        if (chat !== undefined) {
            await window.Store.SendSeen.sendSeen(chat, false);
            return true;
        }
        return false;

    };

    window.WWebJS.sendMessage = async (chat, content, options = {}) => {
        let attOptions = {};
        if (options.attachment) {
            attOptions = options.sendMediaAsSticker
                ? await window.WWebJS.processStickerData(options.attachment)
                : await window.WWebJS.processMediaData(options.attachment, {
                    forceVoice: options.sendAudioAsVoice,
                    forceDocument: options.sendMediaAsDocument,
                    forceGif: options.sendVideoAsGif
                });
            
            if (options.caption){
                attOptions.caption = options.caption; 
            }
            content = options.sendMediaAsSticker ? undefined : attOptions.preview;
            attOptions.isViewOnce = options.isViewOnce;

            delete options.attachment;
            delete options.sendMediaAsSticker;
        }
        let quotedMsgOptions = {};
        if (options.quotedMessageId) {
            let quotedMessage = window.Store.Msg.get(options.quotedMessageId);

            // TODO remove .canReply() once all clients are updated to >= v2.2241.6
            const canReply = window.Store.ReplyUtils ? 
                window.Store.ReplyUtils.canReplyMsg(quotedMessage.unsafe()) : 
                quotedMessage.canReply();

            if (canReply) {
                quotedMsgOptions = quotedMessage.msgContextInfo(chat);
            }
            delete options.quotedMessageId;
        }

        if (options.mentionedJidList) {
            options.mentionedJidList = options.mentionedJidList.map(cId => window.Store.Contact.get(cId).id);
        }

        let locationOptions = {};
        if (options.location) {
            let { latitude, longitude, description, url } = options.location;
            url = window.Store.Validators.findLink(url)?.href;
            url && !description && (description = url);
            locationOptions = {
                type: 'location',
                loc: description,
                lat: latitude,
                lng: longitude,
                clientUrl: url
            };
            delete options.location;
        }

        let _pollOptions = {};
        if (options.poll) {
            const { pollName, pollOptions } = options.poll;
            const { allowMultipleAnswers, messageSecret } = options.poll.options;
            _pollOptions = {
                type: 'poll_creation',
                pollName: pollName,
                pollOptions: pollOptions,
                pollSelectableOptionsCount: allowMultipleAnswers ? 0 : 1,
                messageSecret:
                Array.isArray(messageSecret) && messageSecret.length === 32
                    ? new Uint8Array(messageSecret)
                    : window.crypto.getRandomValues(new Uint8Array(32))
            };
            delete options.poll;
        }

        let vcardOptions = {};
        if (options.contactCard) {
            let contact = window.Store.Contact.get(options.contactCard);
            vcardOptions = {
                body: window.Store.VCard.vcardFromContactModel(contact).vcard,
                type: 'vcard',
                vcardFormattedName: contact.formattedName
            };
            delete options.contactCard;
        } else if (options.contactCardList) {
            let contacts = options.contactCardList.map(c => window.Store.Contact.get(c));
            let vcards = contacts.map(c => window.Store.VCard.vcardFromContactModel(c));
            vcardOptions = {
                type: 'multi_vcard',
                vcardList: vcards,
                body: undefined
            };
            delete options.contactCardList;
        } else if (options.parseVCards && typeof (content) === 'string' && content.startsWith('BEGIN:VCARD')) {
            delete options.parseVCards;
            try {
                const parsed = window.Store.VCard.parseVcard(content);
                if (parsed) {
                    vcardOptions = {
                        type: 'vcard',
                        vcardFormattedName: window.Store.VCard.vcardGetNameFromParsed(parsed)
                    };
                }
            } catch (_) {
                // not a vcard
            }
        }

        if (options.linkPreview) {
            delete options.linkPreview;

            // Not supported yet by WhatsApp Web on MD
            if(!window.Store.MDBackend) {
                const link = window.Store.Validators.findLink(content);
                if (link) {
                    const preview = await window.Store.Wap.queryLinkPreview(link.url);
                    preview.preview = true;
                    preview.subtype = 'url';
                    options = { ...options, ...preview };
                }
            }
        }
        
        let buttonOptions = {};
        if(options.buttons){
            let caption;
            if (options.buttons.type === 'chat') {
                content = options.buttons.body;
                caption = content;
            } else {
                caption = options.caption ? options.caption : ' '; //Caption can't be empty
            }
            buttonOptions = {
                productHeaderImageRejected: false,
                isFromTemplate: false,
                isDynamicReplyButtonsMsg: true,
                title: options.buttons.title ? options.buttons.title : undefined,
                footer: options.buttons.footer ? options.buttons.footer : undefined,
                dynamicReplyButtons: options.buttons.buttons,
                replyButtons: options.buttons.buttons,
                caption: caption
            };
            delete options.buttons;
        }

        let listOptions = {};
        if (options.list) {
            if (window.Store.Conn.platform === 'smba' || window.Store.Conn.platform === 'smbi') {
                throw '[LT01] Whatsapp business can\'t send this yet';
            }
            listOptions = {
                type: 'list',
                footer: options.list.footer,
                list: {
                    ...options.list,
                    listType: 1
                },
                body: options.list.description
            };
            delete options.list;
            delete listOptions.list.footer;
        }

        const meUser = window.Store.User.getMaybeMeUser();
        const isMD = window.Store.MDBackend;
        const newId = await window.Store.MsgKey.newId();
        
        const newMsgId = new window.Store.MsgKey({
            from: meUser,
            to: chat.id,
            id: newId,
            participant: isMD && chat.id.isGroup() ? meUser : undefined,
            selfDir: 'out',
        });

        const extraOptions = options.extraOptions || {};
        delete options.extraOptions;

        const ephemeralFields = window.Store.EphemeralFields.getEphemeralFields(chat);

        const message = {
            ...options,
            id: newMsgId,
            ack: 0,
            body: content,
            from: meUser,
            to: chat.id,
            local: true,
            self: 'out',
            t: parseInt(new Date().getTime() / 1000),
            isNewMsg: true,
            type: 'chat',
            ...ephemeralFields,
            ...locationOptions,
            ..._pollOptions,
            ...attOptions,
            ...(attOptions.toJSON ? attOptions.toJSON() : {}),
            ...quotedMsgOptions,
            ...vcardOptions,
            ...buttonOptions,
            ...listOptions,
            ...extraOptions
        };

        await window.Store.SendMessage.addAndSendMsgToChat(chat, message);
        return window.Store.Msg.get(newMsgId._serialized);
    };
	
    window.WWebJS.editMessage = async (msg, content, options = {}) => {

        const extraOptions = options.extraOptions || {};
        delete options.extraOptions;
        
        if (options.mentionedJidList) {
            options.mentionedJidList = options.mentionedJidList.map(cId => window.Store.Contact.get(cId).id);
        }

        if (options.linkPreview) {
            options.linkPreview = null;

            // Not supported yet by WhatsApp Web on MD
            if(!window.Store.MDBackend) {
                const link = window.Store.Validators.findLink(content);
                if (link) {
                    const preview = await window.Store.Wap.queryLinkPreview(link.url);
                    preview.preview = true;
                    preview.subtype = 'url';
                    options = { ...options, ...preview };
                }
            }
        }


        const internalOptions = {
            ...options,
            ...extraOptions
        };

        await window.Store.EditMessage.sendMessageEdit(msg, content, internalOptions);
        return window.Store.Msg.get(msg.id._serialized);
    };

    window.WWebJS.toStickerData = async (mediaInfo) => {
        if (mediaInfo.mimetype == 'image/webp') return mediaInfo;

        const file = window.WWebJS.mediaInfoToFile(mediaInfo);
        const webpSticker = await window.Store.StickerTools.toWebpSticker(file);
        const webpBuffer = await webpSticker.arrayBuffer();
        const data = window.WWebJS.arrayBufferToBase64(webpBuffer);

        return {
            mimetype: 'image/webp',
            data
        };
    };

    window.WWebJS.processStickerData = async (mediaInfo) => {
        if (mediaInfo.mimetype !== 'image/webp') throw new Error('Invalid media type');

        const file = window.WWebJS.mediaInfoToFile(mediaInfo);
        let filehash = await window.WWebJS.getFileHash(file);
        let mediaKey = await window.WWebJS.generateHash(32);

        const controller = new AbortController();
        const uploadedInfo = await window.Store.UploadUtils.encryptAndUpload({
            blob: file,
            type: 'sticker',
            signal: controller.signal,
            mediaKey
        });

        const stickerInfo = {
            ...uploadedInfo,
            clientUrl: uploadedInfo.url,
            deprecatedMms3Url: uploadedInfo.url,
            uploadhash: uploadedInfo.encFilehash,
            size: file.size,
            type: 'sticker',
            filehash
        };

        return stickerInfo;
    };

    window.WWebJS.processMediaData = async (mediaInfo, { forceVoice, forceDocument, forceGif }) => {
        const file = window.WWebJS.mediaInfoToFile(mediaInfo);
        const mData = await window.Store.OpaqueData.createFromData(file, file.type);
        const mediaPrep = window.Store.MediaPrep.prepRawMedia(mData, { asDocument: forceDocument });
        const mediaData = await mediaPrep.waitForPrep();
        const mediaObject = window.Store.MediaObject.getOrCreateMediaObject(mediaData.filehash);

        const mediaType = window.Store.MediaTypes.msgToMediaType({
            type: mediaData.type,
            isGif: mediaData.isGif
        });

        if (forceVoice && mediaData.type === 'audio') {
            mediaData.type = 'ptt';
            const waveform = mediaObject.contentInfo.waveform;
            mediaData.waveform =
                waveform ?? await window.WWebJS.generateWaveform(file);
        }

        if (forceGif && mediaData.type === 'video') {
            mediaData.isGif = true;
        }

        if (forceDocument) {
            mediaData.type = 'document';
        }

        if (!(mediaData.mediaBlob instanceof window.Store.OpaqueData)) {
            mediaData.mediaBlob = await window.Store.OpaqueData.createFromData(mediaData.mediaBlob, mediaData.mediaBlob.type);
        }

        mediaData.renderableUrl = mediaData.mediaBlob.url();
        mediaObject.consolidate(mediaData.toJSON());
        mediaData.mediaBlob.autorelease();

        const uploadedMedia = await window.Store.MediaUpload.uploadMedia({
            mimetype: mediaData.mimetype,
            mediaObject,
            mediaType
        });

        const mediaEntry = uploadedMedia.mediaEntry;
        if (!mediaEntry) {
            throw new Error('upload failed: media entry was not created');
        }

        mediaData.set({
            clientUrl: mediaEntry.mmsUrl,
            deprecatedMms3Url: mediaEntry.deprecatedMms3Url,
            directPath: mediaEntry.directPath,
            mediaKey: mediaEntry.mediaKey,
            mediaKeyTimestamp: mediaEntry.mediaKeyTimestamp,
            filehash: mediaObject.filehash,
            encFilehash: mediaEntry.encFilehash,
            uploadhash: mediaEntry.uploadHash,
            size: mediaObject.size,
            streamingSidecar: mediaEntry.sidecar,
            firstFrameSidecar: mediaEntry.firstFrameSidecar
        });

        return mediaData;
    };

    window.WWebJS.getMessageModel = message => {
        const msg = message.serialize();

        msg.isEphemeral = message.isEphemeral;
        msg.isStatusV3 = message.isStatusV3;
        msg.links = (message.getRawLinks()).map(link => ({
            link: link.href,
            isSuspicious: Boolean(link.suspiciousCharacters && link.suspiciousCharacters.size)
        }));

        if (msg.buttons) {
            msg.buttons = msg.buttons.serialize();
        }
        if (msg.dynamicReplyButtons) {
            msg.dynamicReplyButtons = JSON.parse(JSON.stringify(msg.dynamicReplyButtons));
        }
        if (msg.replyButtons) {
            msg.replyButtons = JSON.parse(JSON.stringify(msg.replyButtons));
        }

        if (typeof msg.id.remote === 'object') {
            msg.id = Object.assign({}, msg.id, { remote: msg.id.remote._serialized });
        }

        delete msg.pendingAckUpdate;

        return msg;
    };


    window.WWebJS.getChatModel = async chat => {

        let res = chat.serialize();
        res.isGroup = chat.isGroup;
        res.formattedTitle = chat.formattedTitle;
        res.isMuted = chat.mute && chat.mute.isMuted;

        if (chat.groupMetadata) {
            const chatWid = window.Store.WidFactory.createWid((chat.id._serialized));
            await window.Store.GroupMetadata.update(chatWid);
            res.groupMetadata = chat.groupMetadata.serialize();
        }
        
        res.lastMessage = null;
        if (res.msgs && res.msgs.length) {
            const lastMessage = chat.lastReceivedKey ? window.Store.Msg.get(chat.lastReceivedKey._serialized) : null;
            if (lastMessage) {
                res.lastMessage = window.WWebJS.getMessageModel(lastMessage);
            }
        }
        
        delete res.msgs;
        delete res.msgUnsyncedButtonReplyMsgs;
        delete res.unsyncedButtonReplies;

        return res;
    };

    window.WWebJS.getChat = async chatId => {
        const chatWid = window.Store.WidFactory.createWid(chatId);
        const chat = await window.Store.Chat.find(chatWid);
        return await window.WWebJS.getChatModel(chat);
    };

    window.WWebJS.getChats = async () => {
        const chats = window.Store.Chat.getModelsArray();

        const chatPromises = chats.map(chat => window.WWebJS.getChatModel(chat));
        return await Promise.all(chatPromises);
    };

    window.WWebJS.getContactModel = contact => {
        let res = contact.serialize();
        res.isBusiness = contact.isBusiness === undefined ? false : contact.isBusiness;

        if (contact.businessProfile) {
            res.businessProfile = contact.businessProfile.serialize();
        }

        // TODO: remove useOldImplementation and its checks once all clients are updated to >= v2.2327.4
        const useOldImplementation
            = window.compareWwebVersions(window.Debug.VERSION, '<', '2.2327.4');

        res.isMe = useOldImplementation
            ? contact.isMe
            : window.Store.ContactMethods.getIsMe(contact);
        res.isUser = useOldImplementation
            ? contact.isUser
            : window.Store.ContactMethods.getIsUser(contact);
        res.isGroup = useOldImplementation
            ? contact.isGroup
            : window.Store.ContactMethods.getIsGroup(contact);
        res.isWAContact = useOldImplementation
            ? contact.isWAContact
            : window.Store.ContactMethods.getIsWAContact(contact);
        res.isMyContact = useOldImplementation
            ? contact.isMyContact
            : window.Store.ContactMethods.getIsMyContact(contact);
        res.isBlocked = contact.isContactBlocked;
        res.userid = useOldImplementation
            ? contact.userid
            : window.Store.ContactMethods.getUserid(contact);
        res.isEnterprise = useOldImplementation
            ? contact.isEnterprise
            : window.Store.ContactMethods.getIsEnterprise(contact);
        res.verifiedName = useOldImplementation
            ? contact.verifiedName
            : window.Store.ContactMethods.getVerifiedName(contact);
        res.verifiedLevel = useOldImplementation
            ? contact.verifiedLevel
            : window.Store.ContactMethods.getVerifiedLevel(contact);
        res.statusMute = useOldImplementation
            ? contact.statusMute
            : window.Store.ContactMethods.getStatusMute(contact);
        res.name = useOldImplementation
            ? contact.name
            : window.Store.ContactMethods.getName(contact);
        res.shortName = useOldImplementation
            ? contact.shortName
            : window.Store.ContactMethods.getShortName(contact);
        res.pushname = useOldImplementation
            ? contact.pushname
            : window.Store.ContactMethods.getPushname(contact);

        return res;
    };

    window.WWebJS.getContact = async contactId => {
        const wid = window.Store.WidFactory.createWid(contactId);
        const contact = await window.Store.Contact.find(wid);
        const bizProfile = await window.Store.BusinessProfileCollection.fetchBizProfile(wid);
        bizProfile.profileOptions && (contact.businessProfile = bizProfile);
        return window.WWebJS.getContactModel(contact);
    };

    window.WWebJS.getContacts = () => {
        const contacts = window.Store.Contact.getModelsArray();
        return contacts.map(contact => window.WWebJS.getContactModel(contact));
    };

    window.WWebJS.mediaInfoToFile = ({ data, mimetype, filename }) => {
        const binaryData = window.atob(data);

        const buffer = new ArrayBuffer(binaryData.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binaryData.length; i++) {
            view[i] = binaryData.charCodeAt(i);
        }

        const blob = new Blob([buffer], { type: mimetype });
        return new File([blob], filename, {
            type: mimetype,
            lastModified: Date.now()
        });
    };

    window.WWebJS.arrayBufferToBase64 = (arrayBuffer) => {
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    window.WWebJS.arrayBufferToBase64Async = (arrayBuffer) =>
        new Promise((resolve, reject) => {
            const blob = new Blob([arrayBuffer], {
                type: 'application/octet-stream',
            });
            const fileReader = new FileReader();
            fileReader.onload = () => {
                const [, data] = fileReader.result.split(',');
                resolve(data);
            };
            fileReader.onerror = (e) => reject(e);
            fileReader.readAsDataURL(blob);
        });

    window.WWebJS.getFileHash = async (data) => {
        let buffer = await data.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    };

    window.WWebJS.generateHash = async (length) => {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    };

    /**
     * Referenced from and modified:
     * @see https://github.com/wppconnect-team/wa-js/commit/290ebfefe6021b3d17f7fdfdda5545bb0473b26f
     */
    window.WWebJS.generateWaveform = async (audioFile) => {
        try {
            const audioData = await audioFile.arrayBuffer();
            const audioContext = new AudioContext();
            const audioBuffer = await audioContext.decodeAudioData(audioData);

            const rawData = audioBuffer.getChannelData(0);
            const samples = 64;
            const blockSize = Math.floor(rawData.length / samples);
            const filteredData = [];
            for (let i = 0; i < samples; i++) {
                const blockStart = blockSize * i;
                let sum = 0;
                for (let j = 0; j < blockSize; j++) {
                    sum = sum + Math.abs(rawData[blockStart + j]);
                }
                filteredData.push(sum / blockSize);
            }

            const multiplier = Math.pow(Math.max(...filteredData), -1);
            const normalizedData = filteredData.map((n) => n * multiplier);

            const waveform = new Uint8Array(
                normalizedData.map((n) => Math.floor(100 * n))
            );

            return waveform;
        } catch (e) {
            return undefined;
        }
    };

    window.WWebJS.sendClearChat = async (chatId) => {
        let chat = window.Store.Chat.get(chatId);
        if (chat !== undefined) {
            await window.Store.SendClear.sendClear(chat, false);
            return true;
        }
        return false;
    };

    window.WWebJS.sendDeleteChat = async (chatId) => {
        let chat = window.Store.Chat.get(chatId);
        if (chat !== undefined) {
            await window.Store.SendDelete.sendDelete(chat);
            return true;
        }
        return false;
    };

    window.WWebJS.sendChatstate = async (state, chatId) => {
        if (window.Store.MDBackend) {
            chatId = window.Store.WidFactory.createWid(chatId);
        }
        switch (state) {
        case 'typing':
            await window.Store.ChatState.sendChatStateComposing(chatId);
            break;
        case 'recording':
            await window.Store.ChatState.sendChatStateRecording(chatId);
            break;
        case 'stop':
            await window.Store.ChatState.sendChatStatePaused(chatId);
            break;
        default:
            throw 'Invalid chatstate';
        }

        return true;
    };

    window.WWebJS.getLabelModel = label => {
        let res = label.serialize();
        res.hexColor = label.hexColor;

        return res;
    };

    window.WWebJS.getLabels = () => {
        const labels = window.Store.Label.getModelsArray();
        return labels.map(label => window.WWebJS.getLabelModel(label));
    };

    window.WWebJS.getLabel = (labelId) => {
        const label = window.Store.Label.get(labelId);
        return window.WWebJS.getLabelModel(label);
    };

    window.WWebJS.getChatLabels = async (chatId) => {
        const chat = await window.WWebJS.getChat(chatId);
        return (chat.labels || []).map(id => window.WWebJS.getLabel(id));
    };

    window.WWebJS.getOrderDetail = async (orderId, token, chatId) => {
        const chatWid = window.Store.WidFactory.createWid(chatId);
        return window.Store.QueryOrder.queryOrder(chatWid, orderId, 80, 80, token);
    };

    window.WWebJS.getProductMetadata = async (productId) => {
        let sellerId = window.Store.Conn.wid;
        let product = await window.Store.QueryProduct.queryProduct(sellerId, productId);
        if (product && product.data) {
            return product.data;
        }

        return undefined;
    };

    window.WWebJS.rejectCall = async (peerJid, id) => {
        peerJid = peerJid.split('@')[0] + '@s.whatsapp.net';
        let userId = window.Store.User.getMaybeMeUser().user + '@s.whatsapp.net';
        const stanza = window.Store.SocketWap.wap('call', {
            id: window.Store.SocketWap.generateId(),
            from: window.Store.SocketWap.USER_JID(userId),
            to: window.Store.SocketWap.USER_JID(peerJid),
        }, [
            window.Store.SocketWap.wap('reject', {
                'call-id': id,
                'call-creator': window.Store.SocketWap.USER_JID(peerJid),
                count: '0',
            })
        ]);
        await window.Store.Socket.deprecatedCastStanza(stanza);
    };

    window.WWebJS.cropAndResizeImage = async (media, options = {}) => {
        if (!media.mimetype.includes('image'))
            throw new Error('Media is not an image');

        if (options.mimetype && !options.mimetype.includes('image'))
            delete options.mimetype;

        options = Object.assign({ size: 640, mimetype: media.mimetype, quality: .75, asDataUrl: false }, options);

        const img = await new Promise ((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = `data:${media.mimetype};base64,${media.data}`;
        });

        const sl = Math.min(img.width, img.height);
        const sx = Math.floor((img.width - sl) / 2);
        const sy = Math.floor((img.height - sl) / 2);

        const canvas = document.createElement('canvas');
        canvas.width = options.size;
        canvas.height = options.size;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, sl, sl, 0, 0, options.size, options.size);

        const dataUrl = canvas.toDataURL(options.mimetype, options.quality);

        if (options.asDataUrl)
            return dataUrl;

        return Object.assign(media, {
            mimetype: options.mimeType,
            data: dataUrl.replace(`data:${options.mimeType};base64,`, '')
        });
    };

    window.WWebJS.setPicture = async (chatid, media) => {
        const thumbnail = await window.WWebJS.cropAndResizeImage(media, { asDataUrl: true, mimetype: 'image/jpeg', size: 96 });
        const profilePic = await window.WWebJS.cropAndResizeImage(media, { asDataUrl: true, mimetype: 'image/jpeg', size: 640 });

        const chatWid = window.Store.WidFactory.createWid(chatid);
        try {
            const collection = window.Store.ProfilePicThumb.get(chatid);
            if (!collection.canSet()) return;

            const res = await window.Store.GroupUtils.sendSetPicture(chatWid, thumbnail, profilePic);
            return res ? res.status === 200 : false;
        } catch (err) {
            if(err.name === 'ServerStatusCodeError') return false;
            throw err;
        }
    };

    window.WWebJS.deletePicture = async (chatid) => {
        const chatWid = window.Store.WidFactory.createWid(chatid);
        try {
            const collection = window.Store.ProfilePicThumb.get(chatid);
            if (!collection.canDelete()) return;

            const res = await window.Store.GroupUtils.requestDeletePicture(chatWid);
            return res ? res.status === 200 : false;
        } catch (err) {
            if(err.name === 'ServerStatusCodeError') return false;
            throw err;
        }
    };
    
    window.WWebJS.getProfilePicThumbToBase64 = async (chatWid) => {
        const profilePicCollection = await window.Store.ProfilePicThumb.find(chatWid);

        const _readImageAsBase64 = (imageBlob) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = function () {
                    const base64Image = reader.result;
                    if (base64Image == null) {
                        resolve(undefined);
                    } else {
                        const base64Data = base64Image.toString().split(',')[1];
                        resolve(base64Data);
                    }
                };
                reader.readAsDataURL(imageBlob);
            });
        };

        if (profilePicCollection?.img) {
            try {
                const response = await fetch(profilePicCollection.img);
                if (response.ok) {
                    const imageBlob = await response.blob();
                    if (imageBlob) {
                        const base64Image = await _readImageAsBase64(imageBlob);
                        return base64Image;
                    }
                }
            } catch (error) { /* empty */ }
        }
        return undefined;
    };

    window.WWebJS.getAddParticipantsRpcResult = async (groupMetadata, groupWid, participantWid) => {
        const participantLidArgs = groupMetadata?.isLidAddressingMode
            ? {
                phoneNumber: participantWid,
                lid: window.Store.LidUtils.getCurrentLid(participantWid)
            }
            : { phoneNumber: participantWid };

        const iqTo = window.Store.WidToJid.widToGroupJid(groupWid);

        const participantArgs =
            participantLidArgs.lid
                ? [{
                    participantJid: window.Store.WidToJid.widToUserJid(participantLidArgs.lid),
                    phoneNumberMixinArgs: {
                        anyPhoneNumber: window.Store.WidToJid.widToUserJid(participantLidArgs.phoneNumber)
                    }
                }]
                : [{
                    participantJid: window.Store.WidToJid.widToUserJid(participantLidArgs.phoneNumber)
                }];

        let rpcResult, resultArgs;
        const isOldImpl = window.compareWwebVersions(window.Debug.VERSION, '<=', '2.2335.9');
        const data = {
            name: undefined,
            code: undefined,
            inviteV4Code: undefined,
            inviteV4CodeExp: undefined
        };

        try {
            rpcResult = await window.Store.GroupParticipants.sendAddParticipantsRPC({ participantArgs, iqTo });
            resultArgs = isOldImpl
                ? rpcResult.value.addParticipant[0].addParticipantsParticipantMixins
                : rpcResult.value.addParticipant[0]
                    .addParticipantsParticipantAddedOrNonRegisteredWaUserParticipantErrorLidResponseMixinGroup
                    .value
                    .addParticipantsParticipantMixins;
        } catch (err) {
            data.code = 400;
            return data;
        }

        if (rpcResult.name === 'AddParticipantsResponseSuccess') {
            const code = resultArgs?.value.error ?? '200';
            data.name = resultArgs?.name;
            data.code = +code;
            data.inviteV4Code = resultArgs?.value.addRequestCode;
            data.inviteV4CodeExp = resultArgs?.value.addRequestExpiration?.toString();
        }

        else if (rpcResult.name === 'AddParticipantsResponseClientError') {
            const { code: code } = rpcResult.value.errorAddParticipantsClientErrors.value;
            data.code = +code;
        }

        else if (rpcResult.name === 'AddParticipantsResponseServerError') {
            const { code: code } = rpcResult.value.errorServerErrors.value;
            data.code = +code;
        }

        return data;
    };

    window.WWebJS.membershipRequestAction = async (groupId, action, requesterIds, sleep) => {
        const groupWid = window.Store.WidFactory.createWid(groupId);
        const group = await window.Store.Chat.find(groupWid);
        const toApprove = action === 'Approve';
        let membershipRequests;
        let response;
        let result = [];

        await window.Store.GroupMetadata.queryAndUpdate(groupWid);

        if (!requesterIds?.length) {
            membershipRequests = group.groupMetadata.membershipApprovalRequests._models.map(({ id }) => id);
        } else {
            !Array.isArray(requesterIds) && (requesterIds = [requesterIds]);
            membershipRequests = requesterIds.map(r => window.Store.WidFactory.createWid(r));
        }

        if (!membershipRequests.length) return [];

        const participantArgs = membershipRequests.map(m => ({
            participantArgs: [
                {
                    participantJid: window.Store.WidToJid.widToUserJid(m)
                }
            ]
        }));

        const groupJid = window.Store.WidToJid.widToGroupJid(groupWid);
        
        const _getSleepTime = (sleep) => {
            if (!Array.isArray(sleep) || (sleep.length === 2 && sleep[0] === sleep[1])) {
                return sleep;
            }
            if (sleep.length === 1) {
                return sleep[0];
            }
            sleep[1] - sleep[0] < 100 && (sleep[0] = sleep[1]) && (sleep[1] += 100);
            return Math.floor(Math.random() * (sleep[1] - sleep[0] + 1)) + sleep[0];
        };

        const membReqResCodes = {
            default: `An unknown error occupied while ${toApprove ? 'approving' : 'rejecting'} the participant membership request`,
            400: 'ParticipantNotFoundError',
            401: 'ParticipantNotAuthorizedError',
            403: 'ParticipantForbiddenError',
            404: 'ParticipantRequestNotFoundError',
            408: 'ParticipantTemporarilyBlockedError',
            409: 'ParticipantConflictError',
            412: 'ParticipantParentLinkedGroupsResourceConstraintError',
            500: 'ParticipantResourceConstraintError'
        };

        try {
            for (const participant of participantArgs) {
                response = await window.Store.MembershipRequestUtils.sendMembershipRequestsActionRPC({
                    iqTo: groupJid,
                    [toApprove ? 'approveArgs' : 'rejectArgs']: participant
                });

                if (response.name === 'MembershipRequestsActionResponseSuccess') {
                    const value = toApprove
                        ? response.value.membershipRequestsActionApprove
                        : response.value.membershipRequestsActionReject;
                    if (value?.participant) {
                        const [_] = value.participant.map(p => {
                            const error = toApprove
                                ? value.participant[0].membershipRequestsActionAcceptParticipantMixins?.value.error
                                : value.participant[0].membershipRequestsActionRejectParticipantMixins?.value.error;
                            return {
                                requesterId: window.Store.WidFactory.createWid(p.jid)._serialized,
                                ...(error
                                    ? { error: +error, message: membReqResCodes[error] || membReqResCodes.default }
                                    : { message: `${toApprove ? 'Approved' : 'Rejected'} successfully` })
                            };
                        });
                        _ && result.push(_);
                    }
                } else {
                    result.push({
                        requesterId: window.Store.JidToWid.userJidToUserWid(participant.participantArgs[0].participantJid)._serialized,
                        message: 'ServerStatusCodeError'
                    });
                }

                sleep &&
                    participantArgs.length > 1 &&
                    participantArgs.indexOf(participant) !== participantArgs.length - 1 &&
                    (await new Promise((resolve) => setTimeout(resolve, _getSleepTime(sleep))));
            }
            return result;
        } catch (err) {
            return [];
        }
    };
};
