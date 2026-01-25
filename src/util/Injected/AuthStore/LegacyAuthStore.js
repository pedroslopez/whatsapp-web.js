'use strict';

//TODO: To be removed by version 2.3000.x hard release

exports.ExposeLegacyAuthStore = (moduleRaidStr) => {
    eval('var moduleRaid = ' + moduleRaidStr);
    // eslint-disable-next-line no-undef
    window.mR = moduleRaid();
    
    // Validation helper
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

    window.AuthStore = {};
    window.AuthStore.AppState = requireModule('Socket').Socket;
    window.AuthStore.Cmd = requireModule('Cmd').Cmd;
    window.AuthStore.Conn = requireModule('Conn').Conn;
    window.AuthStore.OfflineMessageHandler = requireModule('OfflineMessageHandler').OfflineMessageHandler;
    window.AuthStore.PairingCodeLinkUtils = requireModule('initializeAltDeviceLinking');
    window.AuthStore.Base64Tools = requireModule('encodeB64');
    window.AuthStore.RegistrationUtils = {
        ...requireModule('getCompanionWebClientFromBrowser'),
        ...requireModule('verifyKeyIndexListAccountSignature'),
        ...requireModule('waNoiseInfo'),
        ...requireModule('waSignalStore'),
    };
};