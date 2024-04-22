'use strict';

const path = require('path');
const fs = require('fs');
const BaseAuthStrategy = require('./BaseAuthStrategy');

/**
 * Local directory-based authentication
 * @param {object} options - options
 * @param {string} options.clientId - Client id to distinguish instances if you are using multiple, otherwise keep null if you are using only one instance
 * @param {string} options.dataPath - Change the default path for saving session files, default is: "./.wwebjs_auth/" 
*/
class LocalAuth extends BaseAuthStrategy {
    constructor({ clientId, dataPath }={}) {
        super();

        const idRegex = /^[-_\w]+$/i;
        if(clientId && !idRegex.test(clientId)) {
            throw new Error('Invalid clientId. Only alphanumeric characters, underscores and hyphens are allowed.');
        }

        this.dataPath = path.resolve(dataPath || './.wwebjs_auth/');
        this.clientId = clientId;
    }

    async beforeBrowserInitialized() {
        const puppeteerOpts = this.client.options.puppeteer;
        const sessionDirName = this.clientId ? `session-${this.clientId}` : 'session';
        const dirPath = path.join(this.dataPath, sessionDirName);

        if(puppeteerOpts.userDataDir && puppeteerOpts.userDataDir !== dirPath) {
            throw new Error('LocalAuth is not compatible with a user-supplied userDataDir.');
        }

        fs.mkdirSync(dirPath, { recursive: true });
        
        this.client.options.puppeteer = {
            ...puppeteerOpts,
            userDataDir: dirPath
        };

        this.userDataDir = dirPath;
    }

    async logout() {
        if (this.userDataDir) {
            await fs.promises.rm(this.userDataDir, { recursive: true, force: true })
                .catch(() => {
                    return this.logout();
                });
            return;
        }
    }

}

module.exports = LocalAuth;
