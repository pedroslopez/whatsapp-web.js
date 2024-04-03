'use strict';

exports.ExposeStore = () => {
    if (!require) {
        //eslint-disable-next-line no-global-assign
        require = window.require;
    }

    window.Store = Object.assign({}, require('WAWebCollections'));
    window.Store.AppState = require('WAWebSocketModel').Socket;
    window.Store.BlockContact = require('WAWebBlockContactAction');
    window.Store.Conn = require('WAWebConnModel').Conn;
    window.Store.Cmd = require('WAWebCmd').Cmd;
    window.Store.DownloadManager = require('WAWebDownloadManager').downloadManager;
    window.Store.GroupQueryAndUpdate = require('WAWebGroupQueryJob').queryAndUpdateGroupMetadataById;
    window.Store.MediaPrep = require('WAWebPrepRawMedia');
    window.Store.MediaObject = require('WAWebMediaStorage').getOrCreateMediaObject;
    window.Store.MediaTypes = require('WAWebMmsMediaTypes');
    window.Store.MediaUpload = require('WAWebMediaMmsV4Upload');
    window.Store.MsgKey = require('WAWebMsgKey');
    window.Store.NumberInfo = require('WAPhoneUtils');
    window.Store.OpaqueData = require('WAWebMediaOpaqueData');
    window.Store.QueryProduct = require('WAWebBizProductCatalogBridge');
    window.Store.QueryOrder = require('WAWebBizQueryOrderJob');
    window.Store.SendClear = require('WAWebChatClearBridge');
    window.Store.SendDelete = require('WAWebDeleteChatAction');
    window.Store.SendMessage = require('WAWebSendMsgChatAction');
    window.Store.EditMessage = require('WAWebSendMessageEditAction');
    window.Store.SendSeen = require('WAWebUpdateUnreadChatAction');
    window.Store.User = require('WAWebUserPrefsMeUser');
    window.Store.ContactMethods = require('WAWebContactGetters');
    window.Store.UploadUtils = require('WAWebUploadManager');
    window.Store.UserConstructor = require('WAWebWid');
    window.Store.Validators = require('WALinkify');
    window.Store.VCard = require('WAWebFrontendVcardUtils');
    window.Store.WidFactory = require('WAWebWidFactory');
    window.Store.ProfilePic = require('WAWebContactProfilePicThumbBridge');
    window.Store.PresenceUtils = require('WAWebPresenceChatAction');
    window.Store.ChatState = require('WAWebChatStateBridge');
    window.Store.findCommonGroups = require('WAWebFindCommonGroupsContactAction').findCommonGroups;
    window.Store.StatusUtils = require('WAWebContactStatusBridge');
    window.Store.ConversationMsgs = require('WAWebChatLoadMessages');
    window.Store.sendReactionToMsg = require('WAWebSendReactionMsgAction').sendReactionToMsg;
    window.Store.createOrUpdateReactionsModule = require('WAWebDBCreateOrUpdateReactions');
    window.Store.EphemeralFields = require('WAWebGetEphemeralFieldsMsgActionsUtils');
    window.Store.MsgActionChecks = require('WAWebMsgActionCapability');
    window.Store.QuotedMsg = require('WAWebQuotedMsgModelUtils');
    window.Store.LinkPreview = require('WAWebMsgGetters');
    window.Store.Socket = require('WADeprecatedSendIq');
    window.Store.SocketWap = require('WAWap');
    window.Store.SearchContext = require('WAWebChatMessageSearch').getSearchContext;
    window.Store.DrawerManager = require('WAWebDrawerManager').DrawerManager;
    window.Store.LidUtils = require('WAWebApiContact');
    window.Store.WidToJid = require('WAWebWidToJid');
    window.Store.JidToWid = require('WAWebJidToWid');
    window.Store.getMsgInfo = require('WAWebApiMessageInfoStore').queryMsgInfo;
    window.Store.pinUnpinMsg = require('WAWebSendPinMessageAction').sendPinInChatMsg;
    window.Store.QueryExist = require('WAWebQueryExistsJob').queryWidExists;
    window.Store.ReplyUtils = require('WAWebMsgReply');
    window.Store.Settings = require('WAWebUserPrefsGeneral');

    window.Store.StickerTools = {
        ...require('WAWebImageUtils'),
        ...require('WAWebAddWebpMetadata')
    };
    window.Store.GroupUtils = {
        ...require('WAWebGroupCreateJob'),
        ...require('WAWebGroupModifyInfoJob'),
        ...require('WAWebExitGroupAction'),
        ...require('WAWebContactProfilePicThumbBridge')
    };
    window.Store.GroupParticipants = {
        ...require('promoteParticipants'),
        ...require('sendAddParticipantsRPC')
    };
    window.Store.GroupInvite = {
        ...require('resetGroupInviteCode'),
        ...require('queryGroupInvite')
    };
    window.Store.GroupInviteV4 = {
        ...require('queryGroupInviteV4'),
        ...require('sendGroupInviteMessage')
    };
    window.Store.MembershipRequestUtils = {
        ...require('getMembershipApprovalRequests'),
        ...require('sendMembershipRequestsActionRPC')
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
        const module = require(target.module);
        const originalFunction = module[target.function];
        const modifiedFunction = (...args) => callback(originalFunction, ...args);
        module[target.function] = modifiedFunction;
    };

    window.injectToFunction({ module: 'WAWebBackendJobsCommon', function: 'mediaTypeFromProtobuf' }, (func, ...args) => { const [proto] = args; return proto.locationMessage ? null : func(...args); });

    window.injectToFunction({ module: 'WAWebE2EProtoUtils', function: 'typeAttributeFromProtobuf' }, (func, ...args) => { const [proto] = args; return proto.locationMessage || proto.groupInviteMessage ? 'text' : func(...args); });
};