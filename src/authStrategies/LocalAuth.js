'use strict';

const path = require('path');
const fs = require('fs');
const AuthStrategy = require('./AuthStrategy');

/**
 * Local directory-based authentication
 * @param {object} options - options
 * @param {string} options.clientId - Client id to distinguish instances if you are using multiple, otherwise keep null if you are using only one instance
 * @param {string} options.dataPath - Change the default path for saving session files, default is: "./WWebJS/" 
*/
class LocalAuth extends AuthStrategy {
    constructor({ clientId, dataPath }={}) {
        super();
        this.id = clientId;
        this.dataPath = dataPath || './WWebJS/';
    }

    setup(client) {
        super.setup(client);

        // eslint-disable-next-line no-useless-escape
        const foldernameRegex = /^(?!.{256,})(?!(aux|clock\$|con|nul|prn|com[1-9]|lpt[1-9])(?:$|\.))[^ ][ \.\w-$()+=[\];#@~,&amp;']+[^\. ]$/i;
        if (this.id && !foldernameRegex.test(this.id)) throw Error('Invalid client ID. Make sure you abide by the folder naming rules of your operating system.');

        this.dataDir = client.options.puppeteer.userDataDir;
        const dirPath = path.join(process.cwd(), this.dataPath, this.id ? 'session-' + this.id : 'session');
        if (!this.dataDir) this.dataDir = dirPath;
        fs.mkdirSync(this.dataDir, { recursive: true });

        client.options.puppeteer = {
            ...client.options.puppeteer,
            userDataDir: this.dataDir
        };
    }

    async logout() {
        if (this.dataDir) {
            return (fs.rmSync ? fs.rmSync : fs.rmdirSync).call(this.dataDir, { recursive: true });
        }
    }

}

module.exports = LocalAuth;