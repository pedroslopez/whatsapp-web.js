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

    /**
     * Helper: Safely require a module and handle the ES6 default export pattern.
     * @param {string} moduleName
     * @returns {object|undefined}
     */
    const req = (moduleName) => {
        try {
            const m = window.require(moduleName);
            return m && m.default ? m.default : m;
        } catch {
            return undefined;
        }
    };

    /**
     * Helper: Assigns a module to window.Store if it exists and isn't already set.
     * @param {string} storeKey - The key to assign in window.Store
     * @param {string} moduleName - The internal module name
     * @param {string} [subKey] - Optional specific property to extract from the module
     */
    const safeAssign = (storeKey, moduleName, subKey) => {
        const mod = req(moduleName);
        if (!mod) return;

        const target = subKey ? mod[subKey] : mod;
        if (target && !window.Store[storeKey]) {
            window.Store[storeKey] = target;
        }
    };

    // Initialize Store
    window.Store = Object.assign({}, req('WAWebCollections'));

    // Direct Assignments
    safeAssign('AppState', 'WAWebSocketModel', 'Socket');
    safeAssign('BlockContact', 'WAWebBlockContactAction');
    safeAssign('Conn', 'WAWebConnModel', 'Conn');
    safeAssign('Cmd', 'WAWebCmd', 'Cmd');
    safeAssign('DownloadManager', 'WAWebDownloadManager', 'downloadManager');
    safeAssign('GroupQueryAndUpdate', 'WAWebGroupQueryJob', 'queryAndUpdateGroupMetadataById');
    safeAssign('MediaPrep', 'WAWebPrepRawMedia');
    safeAssign('MediaObject', 'WAWebMediaStorage');
    safeAssign('MediaTypes', 'WAWebMmsMediaTypes');
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

    // Composite Assignments (Merging multiple modules)
    window.Store.MediaUpload = {
        ...(req('WAWebMediaMmsV4Upload') || {}),
        ...(req('WAWebStartMediaUploadQpl') || {})
    };

    window.Store.ContactMethods = {
        ...(req('WAWebContactGetters') || {}),
        ...(req('WAWebFrontendContactGetters') || {})
    };

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

    // Polyfill for Chat.findImpl
    if (window.Store.Chat && (!window.Store.Chat._find || !window.Store.Chat.findImpl)) {
        window.Store.Chat._find = e => {
            const target = window.Store.Chat.get ? window.Store.Chat.get(e) : undefined;
            return target ? Promise.resolve(target) : Promise.resolve({ id: e });
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