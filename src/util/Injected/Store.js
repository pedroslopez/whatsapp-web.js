'use strict';

exports.ExposeStore = () => {
    /**
     * Helper function that compares between two WWeb versions. Its purpose is to help the developer to choose the correct code implementation depending on the comparison value and the WWeb version.
     * @param {string} lOperand The left operand for the WWeb version string to compare with
     * @param {string} operator The comparison operator
     * @param {string} rOperand The right operand for the WWeb version string to compare with
     * @returns {boolean} Boolean value that indicates the result of the comparison
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

    window.Store = Object.assign({}, window.require('WAWebCollections'));
    window.Store.AppState = window.require('WAWebSocketModel').Socket;
    window.Store.BlockContact = window.require('WAWebBlockContactAction');
    window.Store.Conn = window.require('WAWebConnModel').Conn;
    window.Store.Cmd = window.require('WAWebCmd').Cmd;
    window.Store.DownloadManager = window.require('WAWebDownloadManager').downloadManager;
    window.Store.GroupQueryAndUpdate = window.require('WAWebGroupQueryJob').queryAndUpdateGroupMetadataById;
    window.Store.MediaPrep = window.require('WAWebPrepRawMedia');
    window.Store.MediaObject = window.require('WAWebMediaStorage');
    window.Store.MediaTypes = window.require('WAWebMmsMediaTypes');
    window.Store.MediaUpload = window.require('WAWebMediaMmsV4Upload');
    window.Store.MediaUpdate = window.require('WAWebMediaUpdateMsg');
    window.Store.MsgKey = window.require('WAWebMsgKey');
    window.Store.OpaqueData = window.require('WAWebMediaOpaqueData');
    window.Store.QueryProduct = window.require('WAWebBizProductCatalogBridge');
    window.Store.QueryOrder = window.require('WAWebBizOrderBridge');
    window.Store.SendClear = window.require('WAWebChatClearBridge');
    window.Store.SendDelete = window.require('WAWebDeleteChatAction');
    window.Store.SendMessage = window.require('WAWebSendMsgChatAction');
    window.Store.EditMessage = window.require('WAWebSendMessageEditAction');
    window.Store.MediaDataUtils = window.require('WAWebMediaDataUtils');
    window.Store.BlobCache = window.require('WAWebMediaInMemoryBlobCache');
    window.Store.SendSeen = window.require('WAWebUpdateUnreadChatAction');
    window.Store.User = window.require('WAWebUserPrefsMeUser');
    window.Store.ContactMethods = {
        ...window.require('WAWebContactGetters'),
        ...window.require('WAWebFrontendContactGetters')
    };
    window.Store.UserConstructor = window.require('WAWebWid');
    window.Store.Validators = window.require('WALinkify');
    window.Store.WidFactory = window.require('WAWebWidFactory');
    window.Store.ProfilePic = window.require('WAWebContactProfilePicThumbBridge');
    window.Store.PresenceUtils = window.require('WAWebPresenceChatAction');
    window.Store.ChatState = window.require('WAWebChatStateBridge');
    window.Store.findCommonGroups = window.require('WAWebFindCommonGroupsContactAction').findCommonGroups;
    window.Store.ConversationMsgs = window.require('WAWebChatLoadMessages');
    window.Store.sendReactionToMsg = window.require('WAWebSendReactionMsgAction').sendReactionToMsg;
    window.Store.createOrUpdateReactionsModule = window.require('WAWebDBCreateOrUpdateReactions');
    window.Store.EphemeralFields = window.require('WAWebGetEphemeralFieldsMsgActionsUtils');
    window.Store.MsgActionChecks = window.require('WAWebMsgActionCapability');
    window.Store.QuotedMsg = window.require('WAWebQuotedMsgModelUtils');
    window.Store.LinkPreview = window.require('WAWebLinkPreviewChatAction');
    window.Store.Socket = window.require('WADeprecatedSendIq');
    window.Store.SocketWap = window.require('WAWap');
    window.Store.SearchContext = window.require('WAWebChatMessageSearch');
    window.Store.DrawerManager = window.require('WAWebDrawerManager').DrawerManager;
    window.Store.LidUtils = window.require('WAWebApiContact');
    window.Store.WidToJid = window.require('WAWebWidToJid');
    window.Store.JidToWid = window.require('WAWebJidToWid');
    window.Store.getMsgInfo = window.require('WAWebApiMessageInfoStore').queryMsgInfo;
    window.Store.QueryExist = window.require('WAWebQueryExistsJob').queryWidExists;
    window.Store.ReplyUtils = window.require('WAWebMsgReply');
    window.Store.BotSecret = window.require('WAWebBotMessageSecret');
    window.Store.BotProfiles = window.require('WAWebBotProfileCollection');
    window.Store.ContactCollection = window.require('WAWebContactCollection').ContactCollection;
    window.Store.DeviceList = window.require('WAWebApiDeviceList');
    window.Store.HistorySync = window.require('WAWebSendNonMessageDataRequest');
    window.Store.AddonReactionTable = window.require('WAWebAddonReactionTableMode').reactionTableMode;
    window.Store.AddonPollVoteTable = window.require('WAWebAddonPollVoteTableMode').pollVoteTableMode;
    window.Store.ChatGetters = window.require('WAWebChatGetters');
    window.Store.UploadUtils = window.require('WAWebUploadManager');
    window.Store.WAWebStreamModel = window.require('WAWebStreamModel');
    window.Store.FindOrCreateChat = window.require('WAWebFindChatAction');
    window.Store.CustomerNoteUtils = window.require('WAWebNoteAction');
    window.Store.BusinessGatingUtils = window.require('WAWebBizGatingUtils');
    window.Store.PollsVotesSchema = window.require('WAWebPollsVotesSchema');
    window.Store.PollsSendVote = window.require('WAWebPollsSendVoteMsgAction');

    window.Store.Settings = {
        ...window.require('WAWebUserPrefsGeneral'),
        ...window.require('WAWebUserPrefsNotifications'),
        setPushname: window.require('WAWebSetPushnameConnAction').setPushname
    };
    window.Store.NumberInfo = {
        ...window.require('WAPhoneUtils'),
        ...window.require('WAPhoneFindCC')
    };
    window.Store.ForwardUtils = {
        ...window.require('WAWebChatForwardMessage')
    };
    window.Store.PinnedMsgUtils = {
        ...window.require('WAWebPinInChatSchema'),
        ...window.require('WAWebSendPinMessageAction')
    };
    window.Store.ScheduledEventMsgUtils = {
        ...window.require('WAWebGenerateEventCallLink'),
        ...window.require('WAWebSendEventEditMsgAction'),
        ...window.require('WAWebSendEventResponseMsgAction')
    };
    window.Store.VCard = {
        ...window.require('WAWebFrontendVcardUtils'),
        ...window.require('WAWebVcardParsingUtils'),
        ...window.require('WAWebVcardGetNameFromParsed')
    };
    window.Store.StickerTools = {
        ...window.require('WAWebImageUtils'),
        ...window.require('WAWebAddWebpMetadata')
    };
    window.Store.GroupUtils = {
        ...window.require('WAWebGroupCreateJob'),
        ...window.require('WAWebGroupModifyInfoJob'),
        ...window.require('WAWebExitGroupAction'),
        ...window.require('WAWebContactProfilePicThumbBridge'),
        ...window.require('WAWebSetPropertyGroupAction')
    };
    window.Store.GroupParticipants = {
        ...window.require('WAWebModifyParticipantsGroupAction'),
        ...window.require('WASmaxGroupsAddParticipantsRPC')
    };
    window.Store.GroupInvite = {
        ...window.require('WAWebGroupInviteJob'),
        ...window.require('WAWebGroupQueryJob'),
        ...window.require('WAWebMexFetchGroupInviteCodeJob')
    };
    window.Store.GroupInviteV4 = {
        ...window.require('WAWebGroupInviteV4Job'),
        ...window.require('WAWebChatSendMessages')
    };
    window.Store.MembershipRequestUtils = {
        ...window.require('WAWebApiMembershipApprovalRequestStore'),
        ...window.require('WASmaxGroupsMembershipRequestsActionRPC')
    };
    window.Store.ChannelUtils = {
        ...window.require('WAWebLoadNewsletterPreviewChatAction'),
        ...window.require('WAWebNewsletterMetadataQueryJob'),
        ...window.require('WAWebNewsletterCreateQueryJob'),
        ...window.require('WAWebEditNewsletterMetadataAction'),
        ...window.require('WAWebNewsletterDeleteAction'),
        ...window.require('WAWebNewsletterSubscribeAction'),
        ...window.require('WAWebNewsletterUnsubscribeAction'),
        ...window.require('WAWebNewsletterDirectorySearchAction'),
        ...window.require('WAWebNewsletterToggleMuteStateJob'),
        ...window.require('WAWebNewsletterGatingUtils'),
        ...window.require('WAWebNewsletterModelUtils'),
        ...window.require('WAWebMexAcceptNewsletterAdminInviteJob'),
        ...window.require('WAWebMexRevokeNewsletterAdminInviteJob'),
        ...window.require('WAWebChangeNewsletterOwnerAction'),
        ...window.require('WAWebDemoteNewsletterAdminAction'),
        ...window.require('WAWebNewsletterDemoteAdminJob'),
        countryCodesIso: window.require('WAWebCountriesNativeCountryNames'),
        currentRegion: window.require('WAWebL10N').getRegion(),
    };
    window.Store.SendChannelMessage = {
        ...window.require('WAWebNewsletterUpdateMsgsRecordsJob'),
        ...window.require('WAWebMsgDataFromModel'),
        ...window.require('WAWebNewsletterSendMessageJob'),
        ...window.require('WAWebNewsletterSendMsgAction'),
        ...window.require('WAMediaCalculateFilehash')
    };
    window.Store.ChannelSubscribers = {
        ...window.require('WAWebMexFetchNewsletterSubscribersJob'),
        ...window.require('WAWebNewsletterSubscriberListAction')
    };
    window.Store.AddressbookContactUtils = {
        ...window.require('WAWebSaveContactAction'),
        ...window.require('WAWebDeleteContactAction')
    };
    window.Store.StatusUtils = {
        ...window.require('WAWebContactStatusBridge'),
        ...window.require('WAWebSendStatusMsgAction'),
        ...window.require('WAWebRevokeStatusAction'),
        ...window.require('WAWebStatusGatingUtils')
    };

    if (!window.Store.Chat._find || !window.Store.Chat.findImpl) {
        window.Store.Chat._find = e => {
            const target = window.Store.Chat.get(e);
            return target ? Promise.resolve(target) : Promise.resolve({
                id: e
            });
        };
        window.Store.Chat.findImpl = window.Store.Chat._find;
    }

    /**
     * Target options object description
     * @typedef {Object} TargetOptions
     * @property {string|number} module The target module
     * @property {string} function The function name to get from a module
     */
    /**
     * Function to modify functions
     * @param {TargetOptions} target Options specifying the target function to search for modifying
     * @param {Function} callback Modified function
     */
    window.injectToFunction = (target, callback) => {
        try {
            let module = window.require(target.module);
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

    window.injectToFunction({ module: 'WAWebBackendJobsCommon', function: 'mediaTypeFromProtobuf' }, (func, ...args) => { const [proto] = args; return proto.locationMessage ? null : func(...args); });

    window.injectToFunction({ module: 'WAWebE2EProtoUtils', function: 'typeAttributeFromProtobuf' }, (func, ...args) => { const [proto] = args; return proto.locationMessage || proto.groupInviteMessage ? 'text' : func(...args); });
};
