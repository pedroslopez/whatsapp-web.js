'use strict';

/**
 * Exposes the internal Store to the WhatsApp Web client
 */
exports.ExposeStore = (moduleRaidStr) => {
    eval("var moduleRaid = " + moduleRaidStr);
    window.mR = moduleRaid();
    window.Store = window.mR.findModule("Chat")[1].default;
    window.Store.AppState = window.mR.findModule("STREAM")[0].default;
    window.Store.Conn = window.mR.findModule("Conn")[0].default;
    window.Store.CryptoLib = window.mR.findModule("decryptE2EMedia")[0];
    window.Store.genId = window.mR.findModule((module) => module.default && typeof module.default === 'function' && module.default.toString().match(/crypto/))[0].default;
    window.Store.SendMessage = window.mR.findModule("addAndSendMsgToChat")[0];
    window.Store.MsgKey = window.mR.findModule((module) => module.default && module.default.fromString)[0].default;
    window.Store.Invite = window.mR.findModule("sendJoinGroupViaInvite")[0];
}

exports.LoadUtils = () => {
    window.WWebJS = {};

    window.WWebJS.sendMessage = async (chat, content, options) => {       
        const newMsgId = new Store.MsgKey({
            from: Store.Conn.me,
            to: chat.id,
            id: Store.genId(),
        });

        const message = {
            id: newMsgId,
            ack: 0,
            body: content,
            from: Store.Conn.me,
            to: chat.id,
            local: true,
            self: 'out',
            t: parseInt(new Date().getTime() / 1000),
            isNewMsg: true,
            type: 'chat',
            ...options
        }

        await Store.SendMessage.addAndSendMsgToChat(chat, message);
        return Store.Msg.get(newMsgId._serialized);
    }

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

    window.WWebJS.downloadBuffer = (url) => {
        return new Promise(function(resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                if (xhr.status == 200) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            xhr.send(null);
        });
    }

    window.WWebJS.readBlobAsync = (blob) => {
        return new Promise((resolve, reject) => {
          let reader = new FileReader();
      
          reader.onload = () => {
            resolve(reader.result);
          };
      
          reader.onerror = reject;
      
          reader.readAsDataURL(blob);
        })
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