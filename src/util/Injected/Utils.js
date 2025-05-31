'use strict';

exports.LoadUtils = () => {
    window.WWebJS = {};

    window.WWebJS.forwardMessage = async (chatId, msgId) => {
        const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
        const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });

        if (window.compareWwebVersions(window.Debug.VERSION, '>', '2.3000.0')) {
            return window.Store.ForwardUtils.forwardMessagesToChats([msg], [chat], true);
        } else {
            return chat.forwardMessages([msg]);
        }
    };

    window.WWebJS.sendSeen = async (chatId) => {
        const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
        if (chat) {
            await window.Store.SendSeen.sendSeen(chat);
            return true;
        }
        return false;
    };

    window.WWebJS.sendMessage = async (chat, content, options = {}) => {
        const isChannel = window.Store.ChatGetters.getIsNewsletter(chat);

        let mediaOptions = {};
        if (options.media) {
            mediaOptions = await window.WWebJS.processMediaData(
                options.media, {
                    forceSticker: options.sendMediaAsSticker,
                    forceGif: options.sendVideoAsGif,
                    forceVoice: options.sendAudioAsVoice,
                    forceDocument: options.sendMediaAsDocument,
                    sendToChannel: isChannel
                });
            mediaOptions.caption = options.caption;
            content = options.sendMediaAsSticker ? undefined : mediaOptions.preview;
            mediaOptions.isViewOnce = options.isViewOnce;
            delete options.media;
            delete options.sendMediaAsSticker;
        }

        let quotedMsgOptions = {};
        if (options.quotedMessageId) {
            let quotedMessage = window.Store.Msg.get(options.quotedMessageId);
            !quotedMessage && (quotedMessage = (await window.Store.Msg.getMessagesById([options.quotedMessageId]))?.messages?.[0]);

            if (quotedMessage['messages'].length == 1) {
                quotedMessage = quotedMessage['messages'][0];

                const canReply = window.Store.ReplyUtils
                    ? window.Store.ReplyUtils.canReplyMsg(quotedMessage.unsafe())
                    : quotedMessage.canReply();

                if (canReply) {
                    quotedMsgOptions = quotedMessage.msgContextInfo(chat);
                }
            } else {
                if (!options.ignoreQuoteErrors) {
                    throw new Error('Could not get the quoted message.');
                }
            }
            
            delete options.ignoreQuoteErrors;
            delete options.quotedMessageId;
        }

        if (options.mentionedJidList) {
            options.mentionedJidList = await Promise.all(
                options.mentionedJidList.map(async (id) => {
                    const wid = window.Store.WidFactory.createWid(id);
                    if (await window.Store.QueryExist(wid)) {
                        return wid;
                    }
                })
            );
            options.mentionedJidList = options.mentionedJidList.filter(Boolean);
        }

        if (options.groupMentions) {
            options.groupMentions = options.groupMentions.map((e) => ({
                groupSubject: e.subject,
                groupJid: window.Store.WidFactory.createWid(e.id)
            }));
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
                kind: 'pollCreation',
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
            const link = window.Store.Validators.findLink(content);
            if (link) {
                let preview = await window.Store.LinkPreview.getLinkPreview(link);
                if (preview && preview.data) {
                    preview = preview.data;
                    preview.preview = true;
                    preview.subtype = 'url';
                    options = {...options, ...preview};
                }
            }
        }

        let buttonOptions = {};
        if (options.buttons) {
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

        const botOptions = {};
        if (options.invokedBotWid) {
            botOptions.messageSecret = window.crypto.getRandomValues(new Uint8Array(32));
            botOptions.botMessageSecret = await window.Store.BotSecret.genBotMsgSecretFromMsgSecret(botOptions.messageSecret);
            botOptions.invokedBotWid = window.Store.WidFactory.createWid(options.invokedBotWid);
            botOptions.botPersonaId = window.Store.BotProfiles.BotProfileCollection.get(options.invokedBotWid).personaId;
            delete options.invokedBotWid;
        }

        const lidUser = window.Store.User.getMaybeMeLidUser();
        const meUser = window.Store.User.getMaybeMeUser();
        const newId = await window.Store.MsgKey.newId();
        let from = chat.id.isLid() ? lidUser : meUser;
        let participant;

        if (chat.isGroup) {
            from = chat.groupMetadata && chat.groupMetadata.isLidAddressingMode ? lidUser : meUser;
            participant = window.Store.WidFactory.toUserWid(from);
        }

        const newMsgKey = new window.Store.MsgKey({
            from: from,
            to: chat.id,
            id: newId,
            participant: participant,
            selfDir: 'out',
        });

        const extraOptions = options.extraOptions || {};
        delete options.extraOptions;

        const ephemeralFields = window.Store.EphemeralFields.getEphemeralFields(chat);

        const message = {
            ...options,
            id: newMsgKey,
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
            ...mediaOptions,
            ...(mediaOptions.toJSON ? mediaOptions.toJSON() : {}),
            ...quotedMsgOptions,
            ...locationOptions,
            ..._pollOptions,
            ...vcardOptions,
            ...buttonOptions,
            ...listOptions,
            ...botOptions,
            ...extraOptions
        };
        
        // Bot's won't reply if canonicalUrl is set (linking)
        if (botOptions) {
            delete message.canonicalUrl;
        }

        if (isChannel) {
            const msg = new window.Store.Msg.modelClass(message);
            const msgDataFromMsgModel = window.Store.SendChannelMessage.msgDataFromMsgModel(msg);
            const isMedia = Object.keys(mediaOptions).length > 0;
            await window.Store.SendChannelMessage.addNewsletterMsgsRecords([msgDataFromMsgModel]);
            chat.msgs.add(msg);
            chat.t = msg.t;

            const sendChannelMsgResponse = await window.Store.SendChannelMessage.sendNewsletterMessageJob({
                msg: msg,
                type: message.type === 'chat' ? 'text' : isMedia ? 'media' : 'pollCreation',
                newsletterJid: chat.id.toJid(),
                ...(isMedia
                    ? {
                        mediaMetadata: msg.avParams(),
                        mediaHandle: isMedia ? mediaOptions.mediaHandle : null,
                    }
                    : {}
                )
            });

            if (sendChannelMsgResponse.success) {
                msg.t = sendChannelMsgResponse.ack.t;
                msg.serverId = sendChannelMsgResponse.serverId;
            }
            msg.updateAck(1, true);
            await window.Store.SendChannelMessage.updateNewsletterMsgRecord(msg);
            return msg;
        }

        await window.Store.SendMessage.addAndSendMsgToChat(chat, message);
        return window.Store.Msg.get(newMsgKey._serialized);
    };
	
    window.WWebJS.editMessage = async (msg, content, options = {}) => {
        const extraOptions = options.extraOptions || {};
        delete options.extraOptions;
        
        if (options.mentionedJidList) {
            options.mentionedJidList = await Promise.all(
                options.mentionedJidList.map(async (id) => {
                    const wid = window.Store.WidFactory.createWid(id);
                    if (await window.Store.QueryExist(wid)) {
                        return wid;
                    }
                })
            );
            options.mentionedJidList = options.mentionedJidList.filter(Boolean);
        }

        if (options.groupMentions) {
            options.groupMentions = options.groupMentions.map((e) => ({
                groupSubject: e.subject,
                groupJid: window.Store.WidFactory.createWid(e.id)
            }));
        }

        if (options.linkPreview) {
            delete options.linkPreview;
            const link = window.Store.Validators.findLink(content);
            if (link) {
                const preview = await window.Store.LinkPreview.getLinkPreview(link);
                preview.preview = true;
                preview.subtype = 'url';
                options = { ...options, ...preview };
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

    window.WWebJS.processMediaData = async (mediaInfo, { forceSticker, forceGif, forceVoice, forceDocument, sendToChannel }) => {
        const file = window.WWebJS.mediaInfoToFile(mediaInfo);
        const opaqueData = await window.Store.OpaqueData.createFromData(file, file.type);
        const mediaPrep = window.Store.MediaPrep.prepRawMedia(
            opaqueData, {
                asSticker: forceSticker,
                asGif: forceGif,
                isPtt: forceVoice,
                asDocument: forceDocument
            });
        const mediaData = await mediaPrep.waitForPrep();
        const mediaObject = window.Store.MediaObject.getOrCreateMediaObject(mediaData.filehash);
        const mediaType = window.Store.MediaTypes.msgToMediaType({
            type: mediaData.type,
            isGif: mediaData.isGif,
            isNewsletter: sendToChannel,
        });

        if (forceVoice && mediaData.type === 'ptt') {
            const waveform = mediaObject.contentInfo.waveform;
            mediaData.waveform =
                waveform || await window.WWebJS.generateWaveform(file);
        }

        if (!(mediaData.mediaBlob instanceof window.Store.OpaqueData)) {
            mediaData.mediaBlob = await window.Store.OpaqueData.createFromData(
                mediaData.mediaBlob,
                mediaData.mediaBlob.type
            );
        }

        mediaData.renderableUrl = mediaData.mediaBlob.url();
        mediaObject.consolidate(mediaData.toJSON());
        mediaData.mediaBlob.autorelease();

        const dataToUpload = {
            mimetype: mediaData.mimetype,
            mediaObject,
            mediaType,
            ...(sendToChannel ? { calculateToken: window.Store.SendChannelMessage.getRandomFilehash } : {})
        };

        const uploadedMedia = !sendToChannel
            ? await window.Store.MediaUpload.uploadMedia(dataToUpload)
            : await window.Store.MediaUpload.uploadUnencryptedMedia(dataToUpload);

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
            firstFrameSidecar: mediaEntry.firstFrameSidecar,
            mediaHandle: sendToChannel ? mediaEntry.handle : null,
        });

        return mediaData;
    };

    window.WWebJS.getMessageModel = (message) => {
        const msg = message.serialize();

        msg.isEphemeral = message.isEphemeral;
        msg.isStatusV3 = message.isStatusV3;
        msg.links = (window.Store.Validators.findLinks(message.mediaObject ? message.caption : message.body)).map((link) => ({
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

    window.WWebJS.getPollVoteModel = async (vote) => {
        const _vote = vote.serialize();
        if (!vote.parentMsgKey) return null;
        const msg =
            window.Store.Msg.get(vote.parentMsgKey) || (await window.Store.Msg.getMessagesById([vote.parentMsgKey]))?.messages?.[0];
        msg && (_vote.parentMessage = window.WWebJS.getMessageModel(msg));
        return _vote;
    };

    window.WWebJS.getChat = async (chatId, { getAsModel = true } = {}) => {
        const isChannel = /@\w*newsletter\b/.test(chatId);
        const chatWid = window.Store.WidFactory.createWid(chatId);
        let chat;

        if (isChannel) {
            try {
                chat = window.Store.NewsletterCollection.get(chatId);
                if (!chat) {
                    await window.Store.ChannelUtils.loadNewsletterPreviewChat(chatId);
                    chat = await window.Store.NewsletterCollection.find(chatWid);
                }
            } catch (err) {
                chat = null;
            }
        } else {
            chat = window.Store.Chat.get(chatWid) || (await window.Store.Chat.find(chatWid));
        }

        return getAsModel && chat
            ? await window.WWebJS.getChatModel(chat, { isChannel: isChannel })
            : chat;
    };

    window.WWebJS.getChannelMetadata = async (inviteCode) => {
        const response =
            await window.Store.ChannelUtils.queryNewsletterMetadataByInviteCode(
                inviteCode,
                window.Store.ChannelUtils.getRoleByIdentifier(inviteCode)
            );

        const picUrl = response.newsletterPictureMetadataMixin?.picture[0]?.queryPictureDirectPathOrEmptyResponseMixinGroup.value.directPath;

        return {
            id: response.idJid,
            createdAtTs: response.newsletterCreationTimeMetadataMixin.creationTimeValue,
            titleMetadata: {
                title: response.newsletterNameMetadataMixin.nameElementValue,
                updatedAtTs: response.newsletterNameMetadataMixin.nameUpdateTime
            },
            descriptionMetadata: {
                description: response.newsletterDescriptionMetadataMixin.descriptionQueryDescriptionResponseMixin.elementValue,
                updatedAtTs: response.newsletterDescriptionMetadataMixin.descriptionQueryDescriptionResponseMixin.updateTime
            },
            inviteLink: `https://whatsapp.com/channel/${response.newsletterInviteLinkMetadataMixin.inviteCode}`,
            membershipType: window.Store.ChannelUtils.getRoleByIdentifier(inviteCode),
            stateType: response.newsletterStateMetadataMixin.stateType,
            pictureUrl: picUrl ? `https://pps.whatsapp.net${picUrl}` : null,
            subscribersCount: response.newsletterSubscribersMetadataMixin.subscribersCount,
            isVerified: response.newsletterVerificationMetadataMixin.verificationState === 'verified'
        };
    };

    window.WWebJS.getChats = async () => {
        const chats = window.Store.Chat.getModelsArray();
        const chatPromises = chats.map(chat => window.WWebJS.getChatModel(chat));
        return await Promise.all(chatPromises);
    };

    window.WWebJS.getChannels = async () => {
        const channels = window.Store.NewsletterCollection.getModelsArray();
        const channelPromises = channels?.map((channel) => window.WWebJS.getChatModel(channel, { isChannel: true }));
        return await Promise.all(channelPromises);
    };

    window.WWebJS.getChatModel = async (chat, { isChannel = false } = {}) => {
        if (!chat) return null;

        const model = chat.serialize();
        model.isGroup = false;
        model.isMuted = chat.mute?.expiration !== 0;
        if (isChannel) {
            model.isChannel = window.Store.ChatGetters.getIsNewsletter(chat);
        } else {
            model.formattedTitle = chat.formattedTitle;
        }

        if (chat.groupMetadata) {
            model.isGroup = true;
            const chatWid = window.Store.WidFactory.createWid(chat.id._serialized);
            await window.Store.GroupMetadata.update(chatWid);
            model.groupMetadata.participants._models
                .filter(x => x.id._serialized.endsWith('@lid'))
                .forEach(x => { x.id = x.contact.phoneNumber; });
            model.groupMetadata = chat.groupMetadata.serialize();
            model.isReadOnly = chat.groupMetadata.announce;
        }

        if (chat.newsletterMetadata) {
            await window.Store.NewsletterMetadataCollection.update(chat.id);
            model.channelMetadata = chat.newsletterMetadata.serialize();
            model.channelMetadata.createdAtTs = chat.newsletterMetadata.creationTime;
        }

        model.lastMessage = null;
        if (model.msgs && model.msgs.length) {
            const lastMessage = chat.lastReceivedKey
                ? window.Store.Msg.get(chat.lastReceivedKey._serialized) || (await window.Store.Msg.getMessagesById([chat.lastReceivedKey._serialized]))?.messages?.[0]
                : null;
            lastMessage && (model.lastMessage = window.WWebJS.getMessageModel(lastMessage));
        }

        delete model.msgs;
        delete model.msgUnsyncedButtonReplyMsgs;
        delete model.unsyncedButtonReplies;

        return model;
    };

    window.WWebJS.getContactModel = contact => {
        let res = contact.serialize();
        res.isBusiness = contact.isBusiness === undefined ? false : contact.isBusiness;

        if (contact.businessProfile) {
            res.businessProfile = contact.businessProfile.serialize();
        }

        res.isMe = window.Store.ContactMethods.getIsMe(contact);
        res.isUser = window.Store.ContactMethods.getIsUser(contact);
        res.isGroup = window.Store.ContactMethods.getIsGroup(contact);
        res.isWAContact = window.Store.ContactMethods.getIsWAContact(contact);
        res.isMyContact = window.Store.ContactMethods.getIsMyContact(contact);
        res.isBlocked = contact.isContactBlocked;
        res.userid = window.Store.ContactMethods.getUserid(contact);
        res.isEnterprise = window.Store.ContactMethods.getIsEnterprise(contact);
        res.verifiedName = window.Store.ContactMethods.getVerifiedName(contact);
        res.verifiedLevel = window.Store.ContactMethods.getVerifiedLevel(contact);
        res.statusMute = window.Store.ContactMethods.getStatusMute(contact);
        res.name = window.Store.ContactMethods.getName(contact);
        res.shortName = window.Store.ContactMethods.getShortName(contact);
        res.pushname = window.Store.ContactMethods.getPushname(contact);

        return res;
    };

    window.WWebJS.getContact = async contactId => {
        const wid = window.Store.WidFactory.createWid(contactId);
        let contact = await window.Store.Contact.find(wid);
        if (contact.id._serialized.endsWith('@lid')) {
            contact.id = contact.phoneNumber;
        }
        const bizProfile = await window.Store.BusinessProfile.fetchBizProfile(wid);
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
        let chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
        if (chat !== undefined) {
            await window.Store.SendClear.sendClear(chat, false);
            return true;
        }
        return false;
    };

    window.WWebJS.sendDeleteChat = async (chatId) => {
        let chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
        if (chat !== undefined) {
            await window.Store.SendDelete.sendDelete(chat);
            return true;
        }
        return false;
    };

    window.WWebJS.sendChatstate = async (state, chatId) => {
        chatId = window.Store.WidFactory.createWid(chatId);

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
            const code = resultArgs?.value.error || '200';
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

        await window.Store.GroupQueryAndUpdate({ id: groupId });

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

    window.WWebJS.subscribeToUnsubscribeFromChannel = async (channelId, action, options = {}) => {
        const channel = await window.WWebJS.getChat(channelId, { getAsModel: false });

        if (!channel || channel.newsletterMetadata.membershipType === 'owner') return false;
        options = { eventSurface: 3, deleteLocalModels: options.deleteLocalModels ?? true };

        try {
            if (action === 'Subscribe') {
                await window.Store.ChannelUtils.subscribeToNewsletterAction(channel, options);
            } else if (action === 'Unsubscribe') {
                await window.Store.ChannelUtils.unsubscribeFromNewsletterAction(channel, options);
            } else return false;
            return true;
        } catch (err) {
            if (err.name === 'ServerStatusCodeError') return false;
            throw err;
        }
    };

    window.WWebJS.pinUnpinMsgAction = async (msgId, action, duration) => {
        const message = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
        if (!message) return false;
        const response = await window.Store.pinUnpinMsg(message, action, duration);
        return response.messageSendResult === 'OK';
    };
    
    window.WWebJS.getStatusModel = status => {
        const res = status.serialize();
        delete res._msgs;
        return res;
    };

    window.WWebJS.getAllStatuses = () => {
        const statuses = window.Store.Status.getModelsArray();
        return statuses.map(status => window.WWebJS.getStatusModel(status));
    };
};
