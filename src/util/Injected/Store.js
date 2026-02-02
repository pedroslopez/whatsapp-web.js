'use strict';

exports.ExposeStore = () => {

    /* =======================
       SAFE REQUIRE (COMET FIX)
       ======================= */
    const __wreq = (name) => {
        try {
            const m = window.require(name);
            if (!m) return undefined;
            return m.default ?? m;
        } catch (err) {
            return undefined;
        }
    };

    /* =======================
       WWeb Version Compare
       ======================= */
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

    /* =======================
       SAFE STORE INITIALIZATION
       ======================= */

    // ModuleRaid safe loader
    const getStoreFromModuleRaid = () => {
        if (!window.mR || !window.mR.findModule) return {};
        const modules = window.mR.findModule(m => m.Call && m.Chat);
        if (modules && modules.length > 0) return modules[0];
        // fallback to default property
        const fallback = window.mR.findModule(m => m.default && m.default.Chat);
        return fallback && fallback.length > 0 ? fallback[0].default ?? fallback[0] : {};
    };

    // Initialize Store
    window.Store = Object.assign({}, __wreq('WAWebCollections'), getStoreFromModuleRaid());

    // Helper to safely assign modules
    const safeAssign = (key, moduleName, subKey) => {
        try {
            const mod = __wreq(moduleName);
            if (!mod) return;
            window.Store[key] = subKey ? mod[subKey] : mod;
        } catch (err) { }
    };

    /* =======================
       BASIC MODULES
       ======================= */
    safeAssign('AppState', 'WAWebSocketModel', 'Socket');
    safeAssign('BlockContact', 'WAWebBlockContactAction');
    safeAssign('Conn', 'WAWebConnModel', 'Conn');
    safeAssign('Cmd', 'WAWebCmd', 'Cmd');
    safeAssign('DownloadManager', 'WAWebDownloadManager', 'downloadManager');
    safeAssign('GroupQueryAndUpdate', 'WAWebGroupQueryJob', 'queryAndUpdateGroupMetadataById');
    safeAssign('MediaPrep', 'WAWebPrepRawMedia');
    safeAssign('MediaObject', 'WAWebMediaStorage');
    safeAssign('MediaTypes', 'WAWebMmsMediaTypes');

    /* =======================
       MEDIA UPLOAD
       ======================= */
    window.Store.MediaUpload = {
        ...(__wreq('WAWebMediaMmsV4Upload') ?? {}),
        ...(__wreq('WAWebStartMediaUploadQpl') ?? {})
    };

    /* =======================
       OTHER MAIN MODULES
       ======================= */
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
    window.Store.ContactMethods = {
        ...(__wreq('WAWebContactGetters') ?? {}),
        ...(__wreq('WAWebFrontendContactGetters') ?? {})
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

    /* =======================
       SETTINGS
       ======================= */
    window.Store.Settings = {
        ...(__wreq('WAWebUserPrefsGeneral') ?? {}),
        ...(__wreq('WAWebUserPrefsNotifications') ?? {}),
        setPushname: __wreq('WAWebSetPushnameConnAction')?.setPushname
    };

    window.Store.NumberInfo = {
        ...(__wreq('WAPhoneUtils') ?? {}),
        ...(__wreq('WAPhoneFindCC') ?? {})
    };

    /* =======================
       FORWARD, PINNED, SCHEDULED
       ======================= */
    window.Store.ForwardUtils = { ...(__wreq('WAWebChatForwardMessage') ?? {}) };
    window.Store.PinnedMsgUtils = { ...(__wreq('WAWebPinInChatSchema') ?? {}), ...(__wreq('WAWebSendPinMessageAction') ?? {}) };
    window.Store.ScheduledEventMsgUtils = {
        ...(__wreq('WAWebGenerateEventCallLink') ?? {}),
        ...(__wreq('WAWebSendEventEditMsgAction') ?? {}),
        ...(__wreq('WAWebSendEventResponseMsgAction') ?? {})
    };

    /* =======================
       VCARD & STICKERS
       ======================= */
    window.Store.VCard = {
        ...(__wreq('WAWebFrontendVcardUtils') ?? {}),
        ...(__wreq('WAWebVcardParsingUtils') ?? {}),
        ...(__wreq('WAWebVcardGetNameFromParsed') ?? {})
    };
    window.Store.StickerTools = {
        ...(__wreq('WAWebImageUtils') ?? {}),
        ...(__wreq('WAWebAddWebpMetadata') ?? {})
    };

    /* =======================
       GROUP MODULES
       ======================= */
    window.Store.GroupUtils = {
        ...(__wreq('WAWebGroupCreateJob') ?? {}),
        ...(__wreq('WAWebGroupModifyInfoJob') ?? {}),
        ...(__wreq('WAWebExitGroupAction') ?? {}),
        ...(__wreq('WAWebContactProfilePicThumbBridge') ?? {}),
        ...(__wreq('WAWebSetPropertyGroupAction') ?? {})
    };
    window.Store.GroupParticipants = {
        ...(__wreq('WAWebModifyParticipantsGroupAction') ?? {}),
        ...(__wreq('WASmaxGroupsAddParticipantsRPC') ?? {})
    };
    window.Store.GroupInvite = {
        ...(__wreq('WAWebGroupInviteJob') ?? {}),
        ...(__wreq('WAWebGroupQueryJob') ?? {}),
        ...(__wreq('WAWebMexFetchGroupInviteCodeJob') ?? {})
    };
    window.Store.GroupInviteV4 = {
        ...(__wreq('WAWebGroupInviteV4Job') ?? {}),
        ...(__wreq('WAWebChatSendMessages') ?? {})
    };
    window.Store.MembershipRequestUtils = {
        ...(__wreq('WAWebApiMembershipApprovalRequestStore') ?? {}),
        ...(__wreq('WASmaxGroupsMembershipRequestsActionRPC') ?? {})
    };

    /* =======================
       CHANNELS & NEWSLETTER
       ======================= */
    window.Store.ChannelUtils = {
        ...(__wreq('WAWebLoadNewsletterPreviewChatAction') ?? {}),
        ...(__wreq('WAWebNewsletterMetadataQueryJob') ?? {}),
        ...(__wreq('WAWebNewsletterCreateQueryJob') ?? {}),
        ...(__wreq('WAWebEditNewsletterMetadataAction') ?? {}),
        ...(__wreq('WAWebNewsletterDeleteAction') ?? {}),
        ...(__wreq('WAWebNewsletterSubscribeAction') ?? {}),
        ...(__wreq('WAWebNewsletterUnsubscribeAction') ?? {}),
        ...(__wreq('WAWebNewsletterDirectorySearchAction') ?? {}),
        ...(__wreq('WAWebNewsletterGatingUtils') ?? {}),
        ...(__wreq('WAWebNewsletterModelUtils') ?? {}),
        ...(__wreq('WAWebMexAcceptNewsletterAdminInviteJob') ?? {}),
        ...(__wreq('WAWebMexRevokeNewsletterAdminInviteJob') ?? {}),
        ...(__wreq('WAWebChangeNewsletterOwnerAction') ?? {}),
        ...(__wreq('WAWebDemoteNewsletterAdminAction') ?? {}),
        ...(__wreq('WAWebNewsletterDemoteAdminJob') ?? {}),
        countryCodesIso: __wreq('WAWebCountriesNativeCountryNames'),
        currentRegion: __wreq('WAWebL10N')?.getRegion()
    };
    window.Store.SendChannelMessage = {
        ...(__wreq('WAWebNewsletterUpdateMsgsRecordsJob') ?? {}),
        ...(__wreq('WAWebMsgDataFromModel') ?? {}),
        ...(__wreq('WAWebNewsletterSendMessageJob') ?? {}),
        ...(__wreq('WAWebNewsletterSendMsgAction') ?? {}),
        ...(__wreq('WAMediaCalculateFilehash') ?? {})
    };
    window.Store.ChannelSubscribers = {
        ...(__wreq('WAWebMexFetchNewsletterSubscribersJob') ?? {}),
        ...(__wreq('WAWebNewsletterSubscriberListAction') ?? {})
    };

    window.Store.AddressbookContactUtils = {
        ...(__wreq('WAWebSaveContactAction') ?? {}),
        ...(__wreq('WAWebDeleteContactAction') ?? {})
    };

    window.Store.StatusUtils = {
        ...(__wreq('WAWebContactStatusBridge') ?? {}),
        ...(__wreq('WAWebSendStatusMsgAction') ?? {}),
        ...(__wreq('WAWebRevokeStatusAction') ?? {}),
        ...(__wreq('WAWebStatusGatingUtils') ?? {})
    };

    /* =======================
       CHAT POLYFILL
       ======================= */
    if (window.Store.Chat && (!window.Store.Chat._find || !window.Store.Chat.findImpl)) {
        window.Store.Chat._find = e => {
            const target = window.Store.Chat.get(e);
            return target ? Promise.resolve(target) : Promise.resolve({ id: e });
        };
        window.Store.Chat.findImpl = window.Store.Chat._find;
    }

};

