'use strict';

//TODO: To be removed by version 2.3000.x hard release

// Exposes the internal Store to the WhatsApp Web client
exports.ExposeLegacyStore = () => {
    const requireModule = (selector, exportName = null) => {
        const modules = window.mR.findModule(selector);
        
        if (!modules || modules.length === 0) {
            const selectorStr = typeof selector === 'function' ? selector.toString() : selector;
            throw new Error(`[WWebJS] Validation Failed: Could not find module matching selector "${selectorStr}"`);
        }

        const module = modules[0];

        if (exportName) {
            if (!module[exportName]) {
                throw new Error(`[WWebJS] Validation Failed: Module found but missing export "${exportName}"`);
            }
            return module[exportName];
        }

        return module;
    };

    window.Store = Object.assign({}, requireModule(m => m.default && m.default.Chat).default);
    window.Store.AppState = requireModule('Socket').Socket;
    window.Store.Conn = requireModule('Conn').Conn;
    window.Store.BlockContact = requireModule('blockContact');
    window.Store.Call = requireModule((module) => module.default && module.default.Call).default.Call;
    window.Store.Cmd = requireModule('Cmd').Cmd;
    window.Store.CryptoLib = requireModule('decryptE2EMedia');
    window.Store.DownloadManager = requireModule('downloadManager').downloadManager;
    window.Store.GroupMetadata = requireModule('GroupMetadata').default.GroupMetadata;
    window.Store.GroupQueryAndUpdate = requireModule('queryAndUpdateGroupMetadataById').queryAndUpdateGroupMetadataById;
    window.Store.Label = requireModule('LabelCollection').LabelCollection;
    window.Store.MediaPrep = requireModule('prepRawMedia');
    window.Store.MediaObject = requireModule('getOrCreateMediaObject');
    window.Store.NumberInfo = requireModule('formattedPhoneNumber');
    window.Store.MediaTypes = requireModule('msgToMediaType');
    window.Store.MediaUpload = requireModule('uploadMedia');
    window.Store.MsgKey = requireModule((module) => module.default && module.default.fromString).default;
    window.Store.OpaqueData = requireModule(module => module.default && module.default.createFromData).default;
    window.Store.QueryProduct = requireModule('queryProduct');
    window.Store.QueryOrder = requireModule('queryOrder');
    window.Store.SendClear = requireModule('sendClear');
    window.Store.SendDelete = requireModule('sendDelete');
    window.Store.SendMessage = requireModule('addAndSendMsgToChat');
    window.Store.EditMessage = requireModule('addAndSendMessageEdit');
    window.Store.SendSeen = requireModule('sendSeen');
    window.Store.User = requireModule('getMaybeMeUser');
    window.Store.ContactMethods = requireModule('getUserid');
    window.Store.UploadUtils = requireModule((module) => (module.default && module.default.encryptAndUpload) ? module.default : null).default;
    window.Store.UserConstructor = requireModule((module) => (module.default && module.default.prototype && module.default.prototype.isServer && module.default.prototype.isUser) ? module.default : null).default;
    window.Store.Validators = requireModule('findLinks');
    window.Store.VCard = requireModule('vcardFromContactModel');
    window.Store.WidFactory = requireModule('createWid');
    window.Store.ProfilePic = requireModule('profilePicResync');
    window.Store.PresenceUtils = requireModule('sendPresenceAvailable');
    window.Store.ChatState = requireModule('sendChatStateComposing');
    window.Store.findCommonGroups = requireModule('findCommonGroups').findCommonGroups;
    window.Store.StatusUtils = requireModule('setMyStatus');
    window.Store.ConversationMsgs = requireModule('loadEarlierMsgs');
    window.Store.sendReactionToMsg = requireModule('sendReactionToMsg').sendReactionToMsg;
    window.Store.createOrUpdateReactionsModule = requireModule('createOrUpdateReactions');
    window.Store.EphemeralFields = requireModule('getEphemeralFields');
    window.Store.MsgActionChecks = requireModule('canSenderRevokeMsg');
    window.Store.QuotedMsg = requireModule('getQuotedMsgObj');
    window.Store.LinkPreview = requireModule('getLinkPreview');
    window.Store.Socket = requireModule('deprecatedSendIq');
    window.Store.SocketWap = requireModule('wap');
    window.Store.SearchContext = requireModule('getSearchContext').getSearchContext;
    window.Store.DrawerManager = requireModule('DrawerManager').DrawerManager;
    window.Store.LidUtils = requireModule('getCurrentLid');
    window.Store.WidToJid = requireModule('widToUserJid');
    window.Store.JidToWid = requireModule('userJidToUserWid');
    window.Store.getMsgInfo = (window.mR.findModule('sendQueryMsgInfo')[0] || {}).sendQueryMsgInfo || window.mR.findModule('queryMsgInfo')[0].queryMsgInfo;
    window.Store.pinUnpinMsg = requireModule('sendPinInChatMsg').sendPinInChatMsg;
    
    /* eslint-disable no-undef, no-cond-assign */
    window.Store.QueryExist = ((m = window.mR.findModule('queryExists')[0]) ? m.queryExists : window.mR.findModule('queryExist')[0].queryWidExists);
    window.Store.ReplyUtils = (m = window.mR.findModule('canReplyMsg')).length > 0 && m[0];
    /* eslint-enable no-undef, no-cond-assign */

    window.Store.Settings = {
        ...requireModule('ChatlistPanelState'),
        setPushname: window.mR.findModule((m) => m.setPushname && !m.ChatlistPanelState)[0].setPushname
    };
    window.Store.StickerTools = {
        ...requireModule('toWebpSticker'),
        ...requireModule('addWebpMetadata')
    };
    window.Store.GroupUtils = {
        ...requireModule('createGroup'),
        ...requireModule('setGroupDescription'),
        ...requireModule('sendExitGroup'),
        ...requireModule('sendSetPicture')
    };
    window.Store.GroupParticipants = {
        ...requireModule('promoteParticipants'),
        ...requireModule('sendAddParticipantsRPC')
    };
    window.Store.GroupInvite = {
        ...requireModule('resetGroupInviteCode'),
        ...requireModule('queryGroupInvite')
    };
    window.Store.GroupInviteV4 = {
        ...requireModule('queryGroupInviteV4'),
        ...requireModule('sendGroupInviteMessage')
    };
    window.Store.MembershipRequestUtils = {
        ...requireModule('getMembershipApprovalRequests'),
        ...requireModule('sendMembershipRequestsActionRPC')
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