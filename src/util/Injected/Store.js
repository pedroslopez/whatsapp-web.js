'use strict';

exports.ExposeStore = () => {
    // preserve original compare helper exactly
    window.compareWwebVersions = (lOperand, operator, rOperand) => {
        if (!['>', '>=', '<', '<=', '='].includes(operator)) {
            throw new class _ extends Error {
                constructor(m) { super(m); this.name = 'CompareWwebVersionsError'; }
            }('Invalid comparison operator is provided');

        }
        if (typeof lOperand !== 'string' || typeof rOperand !== 'string') {
            throw new class _ extends Error {
                constructor(m) { super(m); this.name = 'CompareWwebVersionsError'; }
            }('A non-string WWeb version type is provided');
        }

        lOperand = lOperand.replace(/-beta$/, '');
        rOperand = rOperand.replace(/-beta$/, '');

        while (lOperand.length !== rOperand.length) {
            lOperand.length > rOperand.length
                ? rOperand = rOperand.concat('0')
                : lOperand = lOperand.concat('0');
        }

        lOperand = Number(lOperand.replace(/\./g, ''));
        rOperand = Number(rOperand.replace(/\./g, ''));

        return (
            operator === '>' ? lOperand > rOperand :
                operator === '>=' ? lOperand >= rOperand :
                    operator === '<' ? lOperand < rOperand :
                        operator === '<=' ? lOperand <= rOperand :
                            operator === '=' ? lOperand === rOperand :
                                false
        );
    };

    /* ---------- helpers (minimal & explicit) ---------- */

    // Safely require a WA module and prefer .default when present.
    // Returns undefined when require fails or module is missing.
    function req(name) {
        try {
            const m = window.require && window.require(name);
            return m && (m.default || m);
        } catch (e) {
            return undefined;
        }
    }

    // Assign only when the value exists and the target key is not already set.
    function safeAssign(key, moduleName, subKey) {
        const mod = req(moduleName);
        if (!mod) return false;
        const value = subKey ? mod[subKey] : mod;
        if (!value) return false;
        if (!window.Store[key]) {
            window.Store[key] = value;
            return true;
        }
        return false;
    }

    /* ---------- initialize Store (explicit mapping) ---------- */

    window.Store = Object.assign({}, req('WAWebCollections'));

    safeAssign('AppState', 'WAWebSocketModel', 'Socket');
    safeAssign('BlockContact', 'WAWebBlockContactAction');
    safeAssign('Conn', 'WAWebConnModel', 'Conn');
    safeAssign('Cmd', 'WAWebCmd', 'Cmd');
    safeAssign('DownloadManager', 'WAWebDownloadManager', 'downloadManager');
    safeAssign('GroupQueryAndUpdate', 'WAWebGroupQueryJob', 'queryAndUpdateGroupMetadataById');
    safeAssign('MediaPrep', 'WAWebPrepRawMedia');
    safeAssign('MediaObject', 'WAWebMediaStorage');
    safeAssign('MediaTypes', 'WAWebMmsMediaTypes');

    // media upload composed from two modules if available
    window.Store.MediaUpload = {
        ...(req('WAWebMediaMmsV4Upload') || {}),
        ...(req('WAWebStartMediaUploadQpl') || {})
    };

    safeAssign('MediaUpdate', 'WAWebMediaUpdateMsg');
    safeAssign('MsgKey', 'WAWebMsgKey');
    safeAssign('OpaqueData', 'WAWebMediaOpaqueData');
    safeAssign('QueryProduct', 'WAWebBizProductCatalogBridge');
    safeAssign('QueryOrder', 'WAWebBizOrderBridge');
    safeAssign('SendClear', 'WAWebChatClearBridge');
    safeAssign('SendDelete', 'WAWebDeleteChatAction');
    safeAssign('SendMessage', 'WAWebSendMsgChatAction');
    safeAssign('EditMessage', 'WAWebSendMessageEditAction');
    safeAssign('MediaDataUtils', 'WAWebMediaDataUtils');
    safeAssign('BlobCache', 'WAWebMediaInMemoryBlobCache');
    safeAssign('SendSeen', 'WAWebUpdateUnreadChatAction');
    safeAssign('User', 'WAWebUserPrefsMeUser');

    // composite getters
    window.Store.ContactMethods = {
        ...(req('WAWebContactGetters') || {}),
        ...(req('WAWebFrontendContactGetters') || {})
    };

    safeAssign('UserConstructor', 'WAWebWid');
    safeAssign('Validators', 'WALinkify');
    safeAssign('WidFactory', 'WAWebWidFactory');
    safeAssign('ProfilePic', 'WAWebContactProfilePicThumbBridge');
    safeAssign('PresenceUtils', 'WAWebPresenceChatAction');
    safeAssign('ChatState', 'WAWebChatStateBridge');
    safeAssign('findCommonGroups', 'WAWebFindCommonGroupsContactAction', 'findCommonGroups');
    safeAssign('ConversationMsgs', 'WAWebChatLoadMessages');
    safeAssign('sendReactionToMsg', 'WAWebSendReactionMsgAction', 'sendReactionToMsg');
    safeAssign('createOrUpdateReactionsModule', 'WAWebDBCreateOrUpdateReactions');
    safeAssign('EphemeralFields', 'WAWebGetEphemeralFieldsMsgActionsUtils');
    safeAssign('MsgActionChecks', 'WAWebMsgActionCapability');
    safeAssign('QuotedMsg', 'WAWebQuotedMsgModelUtils');
    safeAssign('LinkPreview', 'WAWebLinkPreviewChatAction');
    safeAssign('Socket', 'WADeprecatedSendIq');
    safeAssign('SocketWap', 'WAWap');
    safeAssign('SearchContext', 'WAWebChatMessageSearch');
    safeAssign('DrawerManager', 'WAWebDrawerManager', 'DrawerManager');
    safeAssign('LidUtils', 'WAWebApiContact');
    safeAssign('WidToJid', 'WAWebWidToJid');
    safeAssign('JidToWid', 'WAWebJidToWid');
    safeAssign('getMsgInfo', 'WAWebApiMessageInfoStore', 'queryMsgInfo');
    safeAssign('QueryExist', 'WAWebQueryExistsJob', 'queryWidExists');
    safeAssign('ReplyUtils', 'WAWebMsgReply');
    safeAssign('BotSecret', 'WAWebBotMessageSecret');
    safeAssign('BotProfiles', 'WAWebBotProfileCollection');
    safeAssign('ContactCollection', 'WAWebContactCollection', 'ContactCollection');
    safeAssign('DeviceList', 'WAWebApiDeviceList');
    safeAssign('HistorySync', 'WAWebSendNonMessageDataRequest');
    safeAssign('AddonReactionTable', 'WAWebAddonReactionTableMode', 'reactionTableMode');
    safeAssign('AddonPollVoteTable', 'WAWebAddonPollVoteTableMode', 'pollVoteTableMode');
    safeAssign('ChatGetters', 'WAWebChatGetters');
    safeAssign('UploadUtils', 'WAWebUploadManager');
    safeAssign('WAWebStreamModel', 'WAWebStreamModel');
    safeAssign('FindOrCreateChat', 'WAWebFindChatAction');
    safeAssign('CustomerNoteUtils', 'WAWebNoteAction');
    safeAssign('BusinessGatingUtils', 'WAWebBizGatingUtils');
    safeAssign('PollsVotesSchema', 'WAWebPollsVotesSchema');
    safeAssign('PollsSendVote', 'WAWebPollsSendVoteMsgAction');

    // Settings & NumberInfo composites
    window.Store.Settings = {
        ...(req('WAWebUserPrefsGeneral') || {}),
        ...(req('WAWebUserPrefsNotifications') || {}),
        setPushname: req('WAWebSetPushnameConnAction')?.setPushname
    };

    window.Store.NumberInfo = {
        ...(req('WAPhoneUtils') || {}),
        ...(req('WAPhoneFindCC') || {}),
        ...(req('WAWebPhoneUtils') || {})
    };

    // misc composites
    window.Store.ForwardUtils = { ...(req('WAWebChatForwardMessage') || {}) };
    window.Store.PinnedMsgUtils = {
        ...(req('WAWebPinInChatSchema') || {}),
        ...(req('WAWebSendPinMessageAction') || {})
    };
    window.Store.ScheduledEventMsgUtils = {
        ...(req('WAWebGenerateEventCallLink') || {}),
        ...(req('WAWebSendEventEditMsgAction') || {}),
        ...(req('WAWebSendEventResponseMsgAction') || {})
    };

    window.Store.VCard = {
        ...(req('WAWebFrontendVcardUtils') || {}),
        ...(req('WAWebVcardParsingUtils') || {}),
        ...(req('WAWebVcardGetNameFromParsed') || {})
    };

    window.Store.StickerTools = {
        ...(req('WAWebImageUtils') || {}),
        ...(req('WAWebAddWebpMetadata') || {})
    };

    window.Store.GroupUtils = {
        ...(req('WAWebGroupCreateJob') || {}),
        ...(req('WAWebGroupModifyInfoJob') || {}),
        ...(req('WAWebExitGroupAction') || {}),
        ...(req('WAWebContactProfilePicThumbBridge') || {}),
        ...(req('WAWebSetPropertyGroupAction') || {})
    };
    window.Store.GroupParticipants = {
        ...(req('WAWebModifyParticipantsGroupAction') || {}),
        ...(req('WASmaxGroupsAddParticipantsRPC') || {})
    };
    window.Store.GroupInvite = {
        ...(req('WAWebGroupInviteJob') || {}),
        ...(req('WAWebGroupQueryJob') || {}),
        ...(req('WAWebMexFetchGroupInviteCodeJob') || {})
    };
    window.Store.GroupInviteV4 = {
        ...(req('WAWebGroupInviteV4Job') || {}),
        ...(req('WAWebChatSendMessages') || {})
    };
    window.Store.MembershipRequestUtils = {
        ...(req('WAWebApiMembershipApprovalRequestStore') || {}),
        ...(req('WASmaxGroupsMembershipRequestsActionRPC') || {})
    };

    window.Store.ChannelUtils = {
        ...(req('WAWebLoadNewsletterPreviewChatAction') || {}),
        ...(req('WAWebNewsletterMetadataQueryJob') || {}),
        ...(req('WAWebNewsletterCreateQueryJob') || {}),
        ...(req('WAWebEditNewsletterMetadataAction') || {}),
        ...(req('WAWebNewsletterDeleteAction') || {}),
        ...(req('WAWebNewsletterSubscribeAction') || {}),
        ...(req('WAWebNewsletterUnsubscribeAction') || {}),
        ...(req('WAWebNewsletterDirectorySearchAction') || {}),
        ...(req('WAWebNewsletterGatingUtils') || {}),
        ...(req('WAWebNewsletterModelUtils') || {}),
        ...(req('WAWebMexAcceptNewsletterAdminInviteJob') || {}),
        ...(req('WAWebMexRevokeNewsletterAdminInviteJob') || {}),
        ...(req('WAWebChangeNewsletterOwnerAction') || {}),
        ...(req('WAWebDemoteNewsletterAdminAction') || {}),
        ...(req('WAWebNewsletterDemoteAdminJob') || {}),
        countryCodesIso: req('WAWebCountriesNativeCountryNames'),
        currentRegion: req('WAWebL10N')?.getRegion()
    };

    window.Store.SendChannelMessage = {
        ...(req('WAWebNewsletterUpdateMsgsRecordsJob') || {}),
        ...(req('WAWebMsgDataFromModel') || {}),
        ...(req('WAWebNewsletterSendMessageJob') || {}),
        ...(req('WAWebNewsletterSendMsgAction') || {}),
        ...(req('WAMediaCalculateFilehash') || {})
    };

    window.Store.ChannelSubscribers = {
        ...(req('WAWebMexFetchNewsletterSubscribersJob') || {}),
        ...(req('WAWebNewsletterSubscriberListAction') || {})
    };

    window.Store.AddressbookContactUtils = {
        ...(req('WAWebSaveContactAction') || {}),
        ...(req('WAWebDeleteContactAction') || {})
    };

    window.Store.StatusUtils = {
        ...(req('WAWebContactStatusBridge') || {}),
        ...(req('WAWebSendStatusMsgAction') || {}),
        ...(req('WAWebRevokeStatusAction') || {}),
        ...(req('WAWebStatusGatingUtils') || {})
    };

    /* ---------- compatibility polyfill for Chat.findImpl ---------- */
    if (window.Store.Chat && (!window.Store.Chat._find || !window.Store.Chat.findImpl)) {
        window.Store.Chat._find = e => {
            const target = window.Store.Chat.get && window.Store.Chat.get(e);
            return target ? Promise.resolve(target) : Promise.resolve({ id: e });
        };
        window.Store.Chat.findImpl = window.Store.Chat._find;
    }

    /* ---------- small injector helper (kept minimal) ---------- */
    window.injectToFunction = (target, callback) => {
        try {
            let module = req(target.module);
            if (!module) return;

            const path = target.function.split('.');
            const funcName = path.pop();

            for (const key of path) {
                if (!module[key]) return;
                module = module[key];
            }

            const originalFunction = module[funcName];
            if (typeof originalFunction !== 'function') return;

            module[funcName] = (...args) => {
                try {
                    return callback(originalFunction, ...args);
                } catch {
                    return originalFunction(...args);
                }
            };
        } catch {
            return;
        }
    };

    window.injectToFunction({ module: 'WAWebBackendJobsCommon', function: 'mediaTypeFromProtobuf' }, (func, ...args) => {
        const [proto] = args;
        return proto && proto.locationMessage ? null : func(...args);
    });

    window.injectToFunction({ module: 'WAWebE2EProtoUtils', function: 'typeAttributeFromProtobuf' }, (func, ...args) => {
        const [proto] = args;
        return proto && (proto.locationMessage || proto.groupInviteMessage) ? 'text' : func(...args);
    });
};
