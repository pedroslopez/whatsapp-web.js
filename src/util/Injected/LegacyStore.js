'use strict';

//TODO: To be removed by version 2.3000.x hard release

// Exposes the internal Store to the WhatsApp Web client
exports.ExposeLegacyStore = () => {
    window.Store = Object.assign({}, window.mR.findModule(m => m.default && m.default.Chat)[0].default);
    window.Store.AppState = window.mR.findModule('Socket')[0].Socket;
    window.Store.Conn = window.mR.findModule('Conn')[0].Conn;
    window.Store.BlockContact = window.mR.findModule('blockContact')[0];
    window.Store.Call = window.mR.findModule((module) => module.default && module.default.Call)[0].default.Call;
    window.Store.Cmd = window.mR.findModule('Cmd')[0].Cmd;
    window.Store.CryptoLib = window.mR.findModule('decryptE2EMedia')[0];
    window.Store.DownloadManager = window.mR.findModule('downloadManager')[0].downloadManager;
    window.Store.GroupMetadata = window.mR.findModule('GroupMetadata')[0].default.GroupMetadata;
    window.Store.GroupQueryAndUpdate = window.mR.findModule('queryAndUpdateGroupMetadataById')[0].queryAndUpdateGroupMetadataById;
    window.Store.Label = window.mR.findModule('LabelCollection')[0].LabelCollection;
    window.Store.MediaPrep = window.mR.findModule('prepRawMedia')[0];
    window.Store.MediaObject = window.mR.findModule('getOrCreateMediaObject')[0];
    window.Store.NumberInfo = window.mR.findModule('formattedPhoneNumber')[0];
    window.Store.MediaTypes = window.mR.findModule('msgToMediaType')[0];
    window.Store.MediaUpload = window.mR.findModule('uploadMedia')[0];
    window.Store.MsgKey = window.mR.findModule((module) => module.default && module.default.fromString)[0].default;
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
    window.Store.LinkPreview = window.mR.findModule('getLinkPreview')[0];
    window.Store.Socket = window.mR.findModule('deprecatedSendIq')[0];
    window.Store.SocketWap = window.mR.findModule('wap')[0];
    window.Store.SearchContext = window.mR.findModule('getSearchContext')[0].getSearchContext;
    window.Store.DrawerManager = window.mR.findModule('DrawerManager')[0].DrawerManager;
    window.Store.LidUtils = window.mR.findModule('getCurrentLid')[0];
    window.Store.WidToJid = window.mR.findModule('widToUserJid')[0];
    window.Store.JidToWid = window.mR.findModule('userJidToUserWid')[0];
    window.Store.getMsgInfo = (window.mR.findModule('sendQueryMsgInfo')[0] || {}).sendQueryMsgInfo || window.mR.findModule('queryMsgInfo')[0].queryMsgInfo;
    window.Store.pinUnpinMsg = window.mR.findModule('sendPinInChatMsg')[0].sendPinInChatMsg;
    
    /* eslint-disable no-undef, no-cond-assign */
    window.Store.QueryExist = ((m = window.mR.findModule('queryExists')[0]) ? m.queryExists : window.mR.findModule('queryExist')[0].queryWidExists);
    window.Store.ReplyUtils = (m = window.mR.findModule('canReplyMsg')).length > 0 && m[0];
    /* eslint-enable no-undef, no-cond-assign */

    window.Store.Settings = {
        ...window.mR.findModule('ChatlistPanelState')[0],
        setPushname: window.mR.findModule((m) => m.setPushname && !m.ChatlistPanelState)[0].setPushname
    };
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
     * @property {string|number} module The name or a key of the target module to search
     * @property {number} index The index value of the target module
     * @property {string} function The function name to get from a module
     */

    /**
     * Function to modify functions
     * @param {TargetOptions} target Options specifying the target function to search for modifying
     * @param {Function} callback Modified function
     */
    window.injectToFunction = (target, callback) => {
        const module = typeof target.module === 'string'
            ? window.mR.findModule(target.module)
            : window.mR.modules[target.module];
        const originalFunction = module[target.index][target.function];
        const modifiedFunction = (...args) => callback(originalFunction, ...args);
        module[target.index][target.function] = modifiedFunction;
    };

    window.injectToFunction({ module: 'mediaTypeFromProtobuf', index: 0, function: 'mediaTypeFromProtobuf' }, (func, ...args) => { const [proto] = args; return proto.locationMessage ? null : func(...args); });

    window.injectToFunction({ module: 'typeAttributeFromProtobuf', index: 0, function: 'typeAttributeFromProtobuf' }, (func, ...args) => { const [proto] = args; return proto.locationMessage || proto.groupInviteMessage ? 'text' : func(...args); });
};