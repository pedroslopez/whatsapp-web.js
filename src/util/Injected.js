'use strict';

/**
 * Exposes the internal Store to the WhatsApp Web client
 */
exports.ExposeStore = () => {
    setTimeout(function() {
        function getAllModules() {
            return new Promise((resolve) => {
                const id = _.uniqueId("fakeModule_");
                window["webpackJsonp"](
                    [],
                    {
                        [id]: function (module, exports, __webpack_require__) {
                            resolve(__webpack_require__.c);
                        }
                    },
                    [id]
                );
            });
        }

        var modules = getAllModules()._value;

        for (var key in modules) {
            if (modules[key].exports) {
                if (modules[key].exports.default) {
                    if (modules[key].exports.default.Wap) {
                        store_id = modules[key].id.replace(/"/g, '"');
                    }
                }
            }
        }

    }, 2000);

    function _requireById(id) {
        return webpackJsonp([], null, [id]);
    }

    let store_id = 0;

    function init() {
        window.Store = _requireById(store_id).default;
    }

    setTimeout(function() {
        init();
    }, 5000);
}

/**
 * Adds extra props to the serialization of a model
 */
exports.LoadExtraProps = (model, props) => {
    Store[model].models[0].__props = Store[model].models[0].__props.concat(props);
}

exports.LoadCustomSerializers = () => {
    window.WWebJS = {};

    window.WWebJS.getChatModel = chat => {
        let res = chat.serialize();
        res.isGroup = chat.isGroup;
        res.formattedTitle = chat.formattedTitle;

        if(chat.groupMetadata) {
            res.groupMetadata = chat.groupMetadata.serialize();
        }

        return res;
    }

    window.WWebJS.getChat = chatId => {
        const chat = Store.Chat.get(chatId);
        return WWebJS.getChatModel(chat);
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