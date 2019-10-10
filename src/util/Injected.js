'use strict';

/**
 * Exposes the internal Store to the WhatsApp Web client
 */
exports.ExposeStore = (moduleRaidStr) => {
    eval("var moduleRaid = " + moduleRaidStr);
    window.mR = moduleRaid();
    window.Store = window.mR.findModule("Chat")[1].default;

    window.Store.genId = window.mR.findModule((module) => module.default && typeof module.default === 'function' && module.default.toString().match(/crypto/))[0].default;
    window.Store.SendMessage = window.mR.findModule("sendTextMsgToChat")[0].sendTextMsgToChat;
}

exports.LoadCustomSerializers = () => {
    window.WWebJS = {};

    window.WWebJS.getChatModel = chat => {
        let res = chat.serialize();
        res.isGroup = chat.isGroup;
        res.formattedTitle = chat.formattedTitle;

        if (chat.groupMetadata) {
            res.groupMetadata = chat.groupMetadata.serialize();
        }

        return res;
    }

    window.WWebJS.getChat = chatId => {
        const chat = Store.Chat.get(chatId);
        return WWebJS.getChatModel(chat);
    }

    window.WWebJS.getChats = () => {
        const chats = Store.Chat.models;
        return chats.map(chat => WWebJS.getChatModel(chat));
    }
}

exports.MarkAllRead = () => {
    let Chats = Store.Chat.models;

    for (chatIndex in Chats) {
        if (isNaN(chatIndex)) {
            continue;
        }

        let chat = Chats[chatIndex];

        if (chat.unreadCount > 0) {
            chat.markSeen();
            Store.Wap.sendConversationSeen(chat.id, chat.getLastMsgKeyForAction(), chat.unreadCount - chat.pendingSeenCount);
        }
    }
}