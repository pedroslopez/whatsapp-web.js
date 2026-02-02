'use strict';

exports.ExposeStore = () => {

    /* =======================
       SAFE REQUIRE (COMET FIX)
       ======================= */
    const __wreq = (name) => {
        const m = window.require(name);
        if (!m) return m;
        return m.default ?? m;
    };

    /**
     * Helper function that compares between two WWeb versions.
     */
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

    window.Store = Object.assign({}, __wreq('WAWebCollections'));

    window.Store.AppState = __wreq('WAWebSocketModel').Socket;
    window.Store.BlockContact = __wreq('WAWebBlockContactAction');
    window.Store.Conn = __wreq('WAWebConnModel').Conn;
    window.Store.Cmd = __wreq('WAWebCmd').Cmd;
    window.Store.DownloadManager = __wreq('WAWebDownloadManager').downloadManager;
    window.Store.GroupQueryAndUpdate = __wreq('WAWebGroupQueryJob').queryAndUpdateGroupMetadataById;
    window.Store.MediaPrep = __wreq('WAWebPrepRawMedia');
    window.Store.MediaObject = __wreq('WAWebMediaStorage');
    window.Store.MediaTypes = __wreq('WAWebMmsMediaTypes');

    window.Store.MediaUpload = {
        ...__wreq('WAWebMediaMmsV4Upload'),
        ...__wreq('WAWebStartMediaUploadQpl')
    };

    window.Store.MediaUpdate = __wreq('WAWebMediaUpdateMsg');
    window.Store.MsgKey = __wreq('WAWebMsgKey');
    window.Store.OpaqueData = __wreq('WAWebMediaOpaqueData');
    window.Store.QueryProduct = __wreq('WAWebBizProductCatalogBridge');
    window.Store.QueryOrder = __wreq('WAWebBizOrderBridge');
    window.Store.SendClear = __wreq('WAWebChatClearBridge');
    window.Store.SendDelete = __wreq('WAWebDeleteChatAction');
    window.Store.SendMessage = __wreq('WAWebSendMsgChatAction');
    window.Store.EditMessage = __wreq('WAWebSendMessageEditAction');
    window.Store.MediaDataUtils = __wreq('WAWebMediaDataUtils');
    window.Store.BlobCache = __wreq('WAWebMediaInMemoryBlobCache');
    window.Store.SendSeen = __wreq('WAWebUpdateUnreadChatAction');
    window.Store.User = __wreq('WAWebUserPrefsMeUser');

    window.Store.ContactMethods = {
        ...__wreq('WAWebContactGetters'),
        ...__wreq('WAWebFrontendContactGetters')
    };

    window.Store.UserConstructor = __wreq('WAWebWid');
    window.Store.Validators = __wreq('WALinkify');
    window.Store.WidFactory = __wreq('WAWebWidFactory');
    window.Store.ProfilePic = __wreq('WAWebContactProfilePicThumbBridge');
    window.Store.PresenceUtils = __wreq('WAWebPresenceChatAction');
    window.Store.ChatState = __wreq('WAWebChatStateBridge');
    window.Store.findCommonGroups = __wreq('WAWebFindCommonGroupsContactAction').findCommonGroups;
    window.Store.ConversationMsgs = __wreq('WAWebChatLoadMessages');
    window.Store.sendReactionToMsg = __wreq('WAWebSendReactionMsgAction').sendReactionToMsg;
    window.Store.createOrUpdateReactionsModule = __wreq('WAWebDBCreateOrUpdateReactions');
    window.Store.EphemeralFields = __wreq('WAWebGetEphemeralFieldsMsgActionsUtils');
    window.Store.MsgActionChecks = __wreq('WAWebMsgActionCapability');
    window.Store.QuotedMsg = __wreq('WAWebQuotedMsgModelUtils');
    window.Store.LinkPreview = __wreq('WAWebLinkPreviewChatAction');
    window.Store.Socket = __wreq('WADeprecatedSendIq');
    window.Store.SocketWap = __wreq('WAWap');
    window.Store.SearchContext = __wreq('WAWebChatMessageSearch');
    window.Store.DrawerManager = __wreq('WAWebDrawerManager').DrawerManager;
    window.Store.LidUtils = __wreq('WAWebApiContact');
    window.Store.WidToJid = __wreq('WAWebWidToJid');
    window.Store.JidToWid = __wreq('WAWebJidToWid');
    window.Store.getMsgInfo = __wreq('WAWebApiMessageInfoStore').queryMsgInfo;
    window.Store.QueryExist = __wreq('WAWebQueryExistsJob').queryWidExists;
    window.Store.ReplyUtils = __wreq('WAWebMsgReply');
    window.Store.BotSecret = __wreq('WAWebBotMessageSecret');
    window.Store.BotProfiles = __wreq('WAWebBotProfileCollection');
    window.Store.ContactCollection = __wreq('WAWebContactCollection').ContactCollection;
    window.Store.DeviceList = __wreq('WAWebApiDeviceList');
    window.Store.HistorySync = __wreq('WAWebSendNonMessageDataRequest');
    window.Store.AddonReactionTable = __wreq('WAWebAddonReactionTableMode').reactionTableMode;
    window.Store.AddonPollVoteTable = __wreq('WAWebAddonPollVoteTableMode').pollVoteTableMode;
    window.Store.ChatGetters = __wreq('WAWebChatGetters');
    window.Store.UploadUtils = __wreq('WAWebUploadManager');
    window.Store.WAWebStreamModel = __wreq('WAWebStreamModel');
    window.Store.FindOrCreateChat = __wreq('WAWebFindChatAction');
    window.Store.CustomerNoteUtils = __wreq('WAWebNoteAction');
    window.Store.BusinessGatingUtils = __wreq('WAWebBizGatingUtils');
    window.Store.PollsVotesSchema = __wreq('WAWebPollsVotesSchema');
    window.Store.PollsSendVote = __wreq('WAWebPollsSendVoteMsgAction');

    window.Store.Settings = {
        ...__wreq('WAWebUserPrefsGeneral'),
        ...__wreq('WAWebUserPrefsNotifications'),
        setPushname: __wreq('WAWebSetPushnameConnAction').setPushname
    };

    window.Store.NumberInfo = {
        ...__wreq('WAPhoneUtils'),
        ...__wreq('WAPhoneFindCC')
    };

    window.Store.ForwardUtils = { ...__wreq('WAWebChatForwardMessage') };
    window.Store.PinnedMsgUtils = { ...__wreq('WAWebPinInChatSchema'), ...__wreq('WAWebSendPinMessageAction') };
    window.Store.ScheduledEventMsgUtils = {
        ...__wreq('WAWebGenerateEventCallLink'),
        ...__wreq('WAWebSendEventEditMsgAction'),
        ...__wreq('WAWebSendEventResponseMsgAction')
    };

    window.Store.VCard = {
        ...__wreq('WAWebFrontendVcardUtils'),
        ...__wreq('WAWebVcardParsingUtils'),
        ...__wreq('WAWebVcardGetNameFromParsed')
    };

    window.Store.StickerTools = {
        ...__wreq('WAWebImageUtils'),
        ...__wreq('WAWebAddWebpMetadata')
    };

    window.Store.GroupUtils = {
        ...__wreq('WAWebGroupCreateJob'),
        ...__wreq('WAWebGroupModifyInfoJob'),
        ...__wreq('WAWebExitGroupAction'),
        ...__wreq('WAWebContactProfilePicThumbBridge'),
        ...__wreq('WAWebSetPropertyGroupAction')
    };

    window.Store.GroupParticipants = {
        ...__wreq('WAWebModifyParticipantsGroupAction'),
        ...__wreq('WASmaxGroupsAddParticipantsRPC')
    };

    window.Store.GroupInvite = {
        ...__wreq('WAWebGroupInviteJob'),
        ...__wreq('WAWebGroupQueryJob'),
        ...__wreq('WAWebMexFetchGroupInviteCodeJob')
    };

    window.Store.GroupInviteV4 = {
        ...__wreq('WAWebGroupInviteV4Job'),
        ...__wreq('WAWebChatSendMessages')
    };

    window.Store.MembershipRequestUtils = {
        ...__wreq('WAWebApiMembershipApprovalRequestStore'),
        ...__wreq('WASmaxGroupsMembershipRequestsActionRPC')
    };

    window.Store.ChannelUtils = {
        ...__wreq('WAWebLoadNewsletterPreviewChatAction'),
        ...__wreq('WAWebNewsletterMetadataQueryJob'),
        ...__wreq('WAWebNewsletterCreateQueryJob'),
        ...__wreq('WAWebEditNewsletterMetadataAction'),
        ...__wreq('WAWebNewsletterDeleteAction'),
        ...__wreq('WAWebNewsletterSubscribeAction'),
        ...__wreq('WAWebNewsletterUnsubscribeAction'),
        ...__wreq('WAWebNewsletterDirectorySearchAction'),
        ...__wreq('WAWebNewsletterGatingUtils'),
        ...__wreq('WAWebNewsletterModelUtils'),
        ...__wreq('WAWebMexAcceptNewsletterAdminInviteJob'),
        ...__wreq('WAWebMexRevokeNewsletterAdminInviteJob'),
        ...__wreq('WAWebChangeNewsletterOwnerAction'),
        ...__wreq('WAWebDemoteNewsletterAdminAction'),
        ...__wreq('WAWebNewsletterDemoteAdminJob'),
        countryCodesIso: __wreq('WAWebCountriesNativeCountryNames'),
        currentRegion: __wreq('WAWebL10N').getRegion(),
    };

    window.Store.SendChannelMessage = {
        ...__wreq('WAWebNewsletterUpdateMsgsRecordsJob'),
        ...__wreq('WAWebMsgDataFromModel'),
        ...__wreq('WAWebNewsletterSendMessageJob'),
        ...__wreq('WAWebNewsletterSendMsgAction'),
        ...__wreq('WAMediaCalculateFilehash')
    };

    window.Store.ChannelSubscribers = {
        ...__wreq('WAWebMexFetchNewsletterSubscribersJob'),
        ...__wreq('WAWebNewsletterSubscriberListAction')
    };

    window.Store.AddressbookContactUtils = {
        ...__wreq('WAWebSaveContactAction'),
        ...__wreq('WAWebDeleteContactAction')
    };

    window.Store.StatusUtils = {
        ...__wreq('WAWebContactStatusBridge'),
        ...__wreq('WAWebSendStatusMsgAction'),
        ...__wreq('WAWebRevokeStatusAction'),
        ...__wreq('WAWebStatusGatingUtils')
    };

    if (!window.Store.Chat._find || !window.Store.Chat.findImpl) {
        window.Store.Chat._find = e => {
            const target = window.Store.Chat.get(e);
            return target ? Promise.resolve(target) : Promise.resolve({ id: e });
        };
        window.Store.Chat.findImpl = window.Store.Chat._find;
    }
};

