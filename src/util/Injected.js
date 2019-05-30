'use strict';

/**
 * Exposes the internal Store to the WhatsApp Web client
 */
exports.ExposeStore = () => {
    // CREDITS: moduleRaid by PixelDesu
    // https://github.com/pixeldesu/moduleRaid/blob/master/moduleraid.js 

    const moduleRaid = function (debug) {
        moduleRaid.mID  = Math.random().toString(36).substring(7);
        moduleRaid.mObj = {};
        moduleRaid.cArr = [];
        moduleRaid.mGet = null;
        
        if (debug) {
            moduleRaid.debug = true;
        } else if (window.mRdebug) {
            moduleRaid.debug = true;
        } else {
            moduleRaid.debug = false;
        }
        
        moduleRaid.log = function (message) {
            if (moduleRaid.debug) {
            console.warn(`[moduleRaid] ${message}`);
            }
        }
        
        moduleRaid.args = [
            [[0], [function(e, t, i) {
            mCac = i.c;
            Object.keys(mCac).forEach (function(mod) {
                moduleRaid.mObj[mod] = mCac[mod].exports;
            })
            moduleRaid.cArr = i.m;
            moduleRaid.mGet = i;
            }]],
            [[1e3], {[moduleRaid.mID]: function(e, t, i) {
            mCac = i.c;
            Object.keys(mCac).forEach (function(mod) {
                moduleRaid.mObj[mod] = mCac[mod].exports;
            })
            moduleRaid.cArr = i.m;
            moduleRaid.mGet = i;
            }}, [[moduleRaid.mID]]]
        ]
        
        fillModuleArray = function() {
            if (typeof webpackJsonp === 'function') {
            moduleRaid.args.forEach(function (argument, index) {
                try {
                webpackJsonp(...argument);
                }
                catch (err) {
                moduleRaid.log(`moduleRaid.args[${index}] failed: ${err}`);
                }
            })
            }
            else {
            try {
                webpackJsonp.push(moduleRaid.args[1]);
            }
            catch (err) {
                moduleRaid.log(`Pushing moduleRaid.args[1] into webpackJsonp failed: ${err}`);
            }
            }
        
            if (moduleRaid.mObj.length == 0) {
            mEnd = false;
            mIter = 0;
        
            if (!webpackJsonp([],[],[mIter])) {
                throw Error('Unknown Webpack structure');
            }
        
            while (!mEnd) {
                try {
                moduleRaid.mObj[mIter] = webpackJsonp([],[],[mIter]);
                mIter++;
                }
                catch (err) {
                mEnd = true;
                }
            }
            }
        }
        
        fillModuleArray()
        
        get = function get (id) {
            return moduleRaid.mObj[id]
        }
        
        findModule = function findModule (query) {
            results = [];
            modules = Object.keys(moduleRaid.mObj);
        
            modules.forEach(function(mKey) {
            mod = moduleRaid.mObj[mKey];
        
            if (typeof mod !== 'undefined') {
                if (typeof mod.default === 'object') {
                for (key in mod.default) {
                    if (key == query) results.push(mod);
                }
                }
        
                for (key in mod) {
                if (key == query) results.push(mod);
                }
            }
            })
        
            return results;
        }
        
        findFunction = function(query) {
            if (moduleRaid.cArr.length == 0) {
            throw Error('No module constructors to search through!');
            }
        
            results = [];
        
            if (typeof query === 'string') {
            moduleRaid.cArr.forEach(function (ctor, index) {
                if (ctor.toString().includes(query)) {
                results.push(moduleRaid.mObj[index]);
                }
            })
            } else if (typeof query === 'function') {
            modules = Object.keys(moduleRaid.mObj);
        
            modules.forEach(function(mKey, index) {
                mod = moduleRaid.mObj[mKey];
        
                if (query(mod)) {
                results.push(moduleRaid.mObj[index]);
                }
            })
            } else {
            throw new TypeError('findFunction can only find via string and function, ' + (typeof query) + ' was passed');
            }
        
            return results;
        }
        
        return {
            modules: moduleRaid.mObj,
            constructors: moduleRaid.cArr,
            findModule: findModule,
            findFunction: findFunction,
            get: moduleRaid.mGet ? moduleRaid.mGet : get
        }
    }
        
    if (typeof module === 'object' && module.exports) {
        module.exports = moduleRaid;
    } else {
        window.mR = moduleRaid();
    }

    window.Store = window.mR.findModule("Conn")[0].default;
    window.Store.SendMessage = window.mR.findModule("sendTextMsgToChat")[0].sendTextMsgToChat;
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