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
    window.Store.Call = window.mR.findModule('CallCollection')[0].CallCollection;
    window.Store.Cmd = window.mR.findModule('Cmd')[0].Cmd;
    window.Store.CryptoLib = window.mR.findModule('decryptE2EMedia')[0];
    window.Store.DownloadManager = window.mR.findModule('downloadManager')[0].downloadManager;
    window.Store.GroupMetadata = window.mR.findModule('GroupMetadata')[0].default.GroupMetadata;
    window.Store.Invite = window.mR.findModule('resetGroupInviteCode')[0];
    window.Store.InviteInfo = window.mR.findModule('queryGroupInvite')[0];
    window.Store.Label = window.mR.findModule('LabelCollection')[0].LabelCollection;
    window.Store.MediaPrep = window.mR.findModule('prepRawMedia')[0];
    window.Store.MediaObject = window.mR.findModule('getOrCreateMediaObject')[0];
    window.Store.NumberInfo = window.mR.findModule('formattedPhoneNumber')[0];
    window.Store.MediaTypes = window.mR.findModule('msgToMediaType')[0];
    window.Store.MediaUpload = window.mR.findModule('uploadMedia')[0];
    window.Store.MsgKey = window.mR.findModule((module) => module.default && module.default.fromString)[0].default;
    window.Store.MessageInfo = window.mR.findModule('sendQueryMsgInfo')[0];
    window.Store.OpaqueData = window.mR.findModule(module => module.default && module.default.createFromData)[0].default;
    window.Store.QueryExist = window.mR.findModule('queryExists')[0] ? window.mR.findModule('queryExists')[0].queryExists : window.mR.findModule('queryExist')[0].queryWidExists;
    window.Store.QueryProduct = window.mR.findModule('queryProduct')[0];
    window.Store.QueryOrder = window.mR.findModule('queryOrder')[0];
    window.Store.SendClear = window.mR.findModule('sendClear')[0];
    window.Store.SendDelete = window.mR.findModule('sendDelete')[0];
    window.Store.SendMessage = window.mR.findModule('addAndSendMsgToChat')[0];
    window.Store.SendSeen = window.mR.findModule('sendSeen')[0];
    window.Store.User = window.mR.findModule('getMaybeMeUser')[0];
    window.Store.UploadUtils = window.mR.findModule((module) => (module.default && module.default.encryptAndUpload) ? module.default : null)[0].default;
    window.Store.UserConstructor = window.mR.findModule((module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null)[0].default;
    window.Store.Validators = window.mR.findModule('findLinks')[0];
    window.Store.VCard = window.mR.findModule('vcardFromContactModel')[0];
    window.Store.WidFactory = window.mR.findModule('createWid')[0];
    window.Store.ProfilePic = window.mR.findModule('profilePicResync')[0];
    window.Store.PresenceUtils = window.mR.findModule('sendPresenceAvailable')[0];
    window.Store.ChatState = window.mR.findModule('sendChatStateComposing')[0];
    window.Store.GroupParticipants = window.mR.findModule('promoteParticipants')[0];
    window.Store.JoinInviteV4 = window.mR.findModule('sendJoinGroupViaInviteV4')[0];
    window.Store.findCommonGroups = window.mR.findModule('findCommonGroups')[0].findCommonGroups;
    window.Store.StatusUtils = window.mR.findModule('setMyStatus')[0];
    window.Store.ConversationMsgs = window.mR.findModule('loadEarlierMsgs')[0];
    window.Store.sendReactionToMsg = window.mR.findModule('sendReactionToMsg')[0].sendReactionToMsg;
    window.Store.createOrUpdateReactionsModule = window.mR.findModule('createOrUpdateReactions')[0];
    window.Store.EphemeralFields = window.mR.findModule('getEphemeralFields')[0];
    window.Store.ReplyUtils = window.mR.findModule('canReplyMsg').length > 0 && window.mR.findModule('canReplyMsg')[0];
    window.Store.MsgActionChecks = window.mR.findModule('canSenderRevokeMsg')[0];
    window.Store.QuotedMsg = window.mR.findModule('getQuotedMsgObj')[0];
    window.Store.Socket = window.mR.findModule('deprecatedSendIq')[0];
    window.Store.SocketWap = window.mR.findModule('wap')[0];
    window.Store.SearchContext = window.mR.findModule('getSearchContext')[0].getSearchContext;
    window.Store.DrawerManager = window.mR.findModule('DrawerManager')[0].DrawerManager;
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

    if (!window.Store.Chat._find) {
        window.Store.Chat._find = e => {
            const target = window.Store.Chat.get(e);
            return target ? Promise.resolve(target) : Promise.resolve({
                id: e
            });
        };
    }

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
};

exports.LoadUtils = () => {
    window.WWebJS = {};


    // used to parse vcards
    // thanks to https://github.com/woutervroege/node-vcardparser
    window.WWebJS.parseVCardString = function(string) {
        function parseVCardToObject(vcard) {
            card = stripUnixChars(vcard);
            cardLines = splitAtNewLines(card);
            propertyLines = evalProperties(cardLines);
            propertiesChunks = parseLinesToPropertiesChunks(propertyLines);
            properties = parseChunksToProperties(propertiesChunks);
            return properties;
        }
        function parseFile(pathToFile, callback) {
            require("fs").readFile(pathToFile, function(err, data) {
                if(err)
                    return callback(err);
                json = parseVCardToObject(data.toString());
                callback(null, json);		
            })
        }
        function stripUnixChars(str) {
            return str.replace(/\r/g, "");
        }
        function splitAtNewLines(str) {
            return str.split(/\n/g);
        }
        function evalProperties(cardLines) {
            numLines = cardLines.length;
            
            validLines = [];
            validLinesIndex = -1;
            
            for(var i=0;i<numLines;i++) {
                isValidProperty = evalTextLine(cardLines[i]);
                
                if(isValidProperty) {
                    validLinesIndex++;
                    validLines[validLinesIndex] = cardLines[i];
                }
                else {
                    validLines[validLinesIndex] += cardLines[i];			
                }
            }
            
            return validLines;
        }
        function evalTextLine(textLine) {
            hasPropertyElement = textLine.match(/[A-Z]*:/);
    
            if(hasPropertyElement && hasPropertyElement.constructor.name == "Array") {
                return true;
            }
            else {
                return false;
            }
        }
        function parseLinesToPropertiesChunks(propertyLines) {
            numLines = propertyLines.length;
            properties = [];
            
            for(var i=0;i<numLines;i++) {
                properties.push(parsePropertyChunks(propertyLines[i]));
            }
            
            return properties;
        }
        function parsePropertyChunks(propertyLine) {
            arr = propertyLine.split(":");
            chunks = [];
            chunks[0] = arr[0] || "";
            
            chunks[1] = "";		
            for(var i=1;i<arr.length;i++) {
                chunks[1] += (":" + arr[i]);
            }
            chunks[1] = chunks[1].substr(1);
            
            return chunks;
        }
        function parseChunksToProperties(propertiesChunks) {
    
            numPropertiesChunks = propertiesChunks.length;
            properties = {};
            for(var i=0;i<numPropertiesChunks;i++) {
                property = parsePropertyChunksToObject(propertiesChunks[i]);
    
                if(properties[property.name]) {
                    switch(properties[property.name].constructor.name) {
                        case "Object":
                                //convert object to array, store new item into it
                                properties[property.name] = [
                                properties[property.name],
                                property.value
                            ]
                            break;
                        case "Array":	
                            //add new value to array
                            properties[property.name].push(property.value);
                            break;
                    }
                }
                
                else {
                    
                    switch(property.name) {
                        default:
                            properties[property.name] = property.value;			
                            break;
                        case "tel":
                        case "email":
                        case "impp":
                        case "url":
                        case "adr":
                        case "x-socialprofile":
                        case "x-addressbookserver-member":
                        case "member":
                            properties[property.name] = [property.value];
                            break;						
                    }
                }
            }
    
            return properties;
        }
        function parsePropertyChunksToObject(propertyChunks) {
    
    
            obj = {}
            
            leftPart = propertyChunks[0];
            rightPart = propertyChunks[1];
            
            leftPartPieces = leftPart.split(";");
            numLeftPartPieces = leftPartPieces.length;
            
            propTypes = [];
            
            for(var i=1;i<numLeftPartPieces;i++) {
                if(leftPartPieces[i].substr(0, 5).toUpperCase() == "TYPE=") {
                    propTypes.push(leftPartPieces[i].substr(5).toLowerCase());
                }
                if(leftPartPieces[i].substr(0, 5).toUpperCase() == "WAID=") {
                    propTypes.push(leftPartPieces[i].substr(5).toLowerCase());
                }
            }
                
            obj.name = leftPartPieces[0].replace(/(item|ITEM)[0-9]./, "").toLowerCase();
            
            switch(obj.name) {
                case "n":
                    obj.value = parseName(rightPart);
                    obj.test = 'boe';
                    break;
                case "adr":
                    obj.value = parseAddress(rightPart, propTypes);
                    break;
                case "tel":
                case "email":
                case "impp":
                case "url":
                    obj.value = parseMVProperty(rightPart, propTypes);
                    break;
                case "org":
                    obj.value = parseOrganization(rightPart);
                    break;
                case "photo":
                    obj.value = parsePhoto(rightPart, propTypes);
                    break;
                default:
                    obj.value = rightPart
                    break;
            }
            
            return obj;	
        }
        function parseMVProperty(mvValue, types) {
            return {
                type: types,
                value: mvValue
            }
        }
        function parseAddress(adrValues, types) {
            
            addressValues = adrValues.split(";", 7);
            
            address = {
                street: addressValues[0] + addressValues[1] + addressValues[2],
                city: addressValues[3],
                region: addressValues[4],
                zip: addressValues[5],
                country: addressValues[6],
            }
            return {
                type: types,
                value: address
            };
        }
        function parseName(nameValues) {
            nameValues = nameValues.split(";", 5);
            return {
                last: nameValues[0],
                first: nameValues[1],
                middle: nameValues[2],
                prefix: nameValues[3],
                suffix: nameValues[4]
            }
        }
        function parseOrganization(orgValues) {
            orgValues = orgValues.split(";", 2);
            return {
                name: orgValues[0],
                dept: orgValues[1]
            }
        }
        function parsePhoto(base64string, types) {
            return {
                type: types,
                value: base64string
            }
        }
        json = parseVCardToObject(string);
        return json;
    }

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

            content = options.sendMediaAsSticker ? undefined : attOptions.preview;

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
            locationOptions = {
                type: 'location',
                loc: options.location.description,
                lat: options.location.latitude,
                lng: options.location.longitude
            };
            delete options.location;
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
                // enhanced from the previuos version, added the ability to read multiple cards
                let vcards = content.split("END:VCARD")
                let vcardsContacts = []; // initial array where all vcards for the Message object will be stored
                let contentCards = ''; // used only to check if there is at least on valid vcard, appending to `content` will make conflict issues since old (might be invalid) vcards are stored there
                
                // Promise.all to check everything done before going next
                await Promise.all (vcards.map( async (vcard) => { // map through vcards
                    vcard += 'END:VCARD\n' // restore 'END:VCARD\n' after being deleted by `content.split("END:VCARD")`
                    var parsedVCard = window.WWebJS.parseVCardString(vcard); // parse the vcard to JSON object

                    if (Boolean(parsedVCard.fn) && Boolean(parsedVCard.n) && Boolean(parsedVCard.version) && Boolean(parsedVCard.tel) && typeof parsedVCard.tel == 'object' && parsedVCard.tel.length > 0) { // syntax is valid [contains the minimum required fields for vcard]
                        
                        // map through all phone numbers in single vcard
                        await Promise.all(parsedVCard.tel.map(async (tel, index) => {
                                /**
                                 * if the parser found a waid in `tel`, it will attach it to the `tel`.`type` array, so we can read it later
                                 * hint: if waid not present for phone numbers registered on whatsapp, the user will not see 'Message' button on the chat
                                 * if waid is set, then the user is sharing valid (already checked and parsed) whatsapp vcard
                                 */
                                if (!tel.type.length != 2) {
                                    try { // try to get the `waid` and attach 
                                        var vWid = await window.Store.WidFactory.createWid(`${tel.value.replace('+', '').replace(/\s+/g, '')}@c.us`);
                                        var vContact = await window.Store.Contact.find(vWid);
                                        // var vContactModel = await vContact.serialize(); // no need for this since window.Store.VCard.vcardFromContactModel(c) needs unserliazed Contact
                                        vcardsContacts.push(vContact)
                                        if (vContact.isSmb) { // not sure what is `isSmb`, but I found that it's undefined for invalid/non-registered numbers
                                            parsedVCard.tel[index].type.push(vContact.id.user) // again set waid on `tel`.`type`, index 1
                                        } else {
                                        // do something else
                                        }
                                    } catch(_) {
                                        // handle error
                                    }
                                } else {
                                  // waid is set, don't do anything
                                }
                        }));
                        let TELS = ``;
                        parsedVCard.tel.forEach((tel, index) => { // single vcard might contain more than one number, process them here
                            TELS += `TEL;type=${tel.type[0]};${tel.type.length == 2 ? `waid=${tel.type[1]}` : ``}:${tel.value}\n`
                        });
                        // dummy variable for later
                        contentCards += 
                            `BEGIN:VCARD\n` +
                            `VERSION:3.0\n` +
                            `N:${parsedVCard.n.last};${parsedVCard.n.first};${parsedVCard.n.middle};;\n` +
                            `FN:${parsedVCard.fn}\n` +
                            TELS +
                            `END:VCARD\n`
                    }
                }));
                
                if ((contentCards.match(/BEGIN:VCARD/g) || []).length > 1) { // multiple vcards
                    // Promise.all is needed to make sure code is executed and vcards are generated
                    let vcards = await Promise.all(vcardsContacts.map(async (c) => await window.Store.VCard.vcardFromContactModel(c)));
                    vcardOptions = {
                        type: 'multi_vcard',
                        vcardList: vcards,
                        body: undefined
                    };
                } else if ((contentCards.match(/BEGIN:VCARD/g) || []).length == 1) {
                    vcardOptions = {
                        type: 'vcard',
                        // as you see here vcard is in msg body, that's why we check waid above
                        // in fact it's not needed for multi_vcard since vcardList is generated by whatsapp web functions and valid
                        // but in single vcard we need waid because the vcard is checked by us
                        body: window.Store.VCard.vcardFromContactModel(vcardsContacts[0]).vcard,
                        vcardFormattedName: vcardsContacts[0].__x_formattedName
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
        if(options.list){
            if(window.Store.Conn.platform === 'smba' || window.Store.Conn.platform === 'smbi'){
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

        const newMsgId = new window.Store.MsgKey({
            from: meUser,
            to: chat.id,
            id: window.Store.MsgKey.newId(),
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
            const lastMessage = window.Store.Msg.get(chat.lastReceivedKey._serialized);
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
        res.isBusiness = contact.isBusiness;

        if (contact.businessProfile) {
            res.businessProfile = contact.businessProfile.serialize();
        }

        res.isMe = contact.isMe;
        res.isUser = contact.isUser;
        res.isGroup = contact.isGroup;
        res.isWAContact = contact.isWAContact;
        res.isMyContact = contact.isMyContact;
        res.isBlocked = contact.isContactBlocked;
        res.userid = contact.userid;

        return res;
    };

    window.WWebJS.getContact = async contactId => {
        const wid = window.Store.WidFactory.createWid(contactId);
        const contact = await window.Store.Contact.find(wid);
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
};
