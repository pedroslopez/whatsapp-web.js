'use strict';

const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const archiver = require('archiver');
const BaseAuthStrategy = require('./BaseAuthStrategy');

/**
 * Remote-based authentication
 * @param {object} options - options
 * @param {object} options.store - Remote database store instance
 * @param {string} options.clientId - Client id to distinguish instances if you are using multiple, otherwise keep null if you are using only one instance
 * @param {string} options.dataPath - Change the default path for saving session files, default is: "./.wwebjs_auth/" 
 * @param {number} options.backupSyncMs - Sets the time interval for periodic session backups. Accepts values starting from 60000ms {1 minute}
 */
class RemoteAuth extends BaseAuthStrategy {
    constructor({ clientId, dataPath, store, backupSyncMs } = {}) {
        super();

        const idRegex = /^[-_\w]+$/i;
        if (clientId && !idRegex.test(clientId)) {
            throw new Error('Invalid clientId. Only alphanumeric characters, underscores and hyphens are allowed.');
        }
        if (!backupSyncMs || backupSyncMs < 60000) {
            throw new Error('Invalid backupSyncMs. Accepts values starting from 60000ms {1 minute}.');
        }
        if(!store) throw new Error('Remote database store is required.');

        this.store = store;
        this.clientId = clientId;
        this.backupSyncMs = backupSyncMs;
        this.dataPath = path.resolve(dataPath || './.wwebjs_auth/');
        this.requiredDirs = ['Default', 'IndexedDB', 'Local Storage']; /* => Required Files & Dirs in WWebJS to restore session */
    }

    async beforeBrowserInitialized() {
        const puppeteerOpts = this.client.options.puppeteer;
        const sessionDirName = this.clientId ? `session-${this.clientId}` : 'session';
        const dirPath = path.join(this.dataPath, sessionDirName);

        if (puppeteerOpts.userDataDir && puppeteerOpts.userDataDir !== dirPath) {
            throw new Error('RemoteAuth is not compatible with a user-supplied userDataDir.');
        }

        this.userDataDir = dirPath;
        this.sessionName = sessionDirName;

        await this.extractRemoteSession();

        this.client.options.puppeteer = {
            ...puppeteerOpts,
            userDataDir: dirPath
        };
    }

    async logout() {
        await this.deleteRemoteSession();

        let pathExists = await this.isValidPath(this.userDataDir);
        if (pathExists) {
            await fs.promises.rm(this.userDataDir, {
                recursive: true,
                force: true
            }).catch(() => {});
        }
        clearInterval(this.backupSync);
    }

    async afterAuthReady() {
        const sessionExists = await this.store.sessionExists({session: this.sessionName});
        if(!sessionExists) {
            await this.delay(30000); /* Initial delay sync required for session to be stable enough to recover */
            await this.storeRemoteSession();
        }
        var self = this;
        this.backupSync = setInterval(async function () {
            await self.storeRemoteSession();
        }, this.backupSyncMs);
    }

    async storeRemoteSession() {
        const sessionExists = await this.store.sessionExists({session: this.sessionName});
        if (sessionExists) {
            await this.store.delete({session: this.sessionName});
        }
        /* Compress & Store Session */
        const pathExists = await this.isValidPath(this.userDataDir);
        if (pathExists) {
            await this.compressSession();
            await this.store.save({session: this.sessionName});
            await fs.promises.unlink(`${this.sessionName}.zip`);
        }
    }

    async extractRemoteSession() {
        const sessionExists = await this.store.sessionExists({session: this.sessionName});
        const pathExists = await this.isValidPath(this.userDataDir);
        if (pathExists) {
            await fs.promises.rm(this.userDataDir, {
                recursive: true,
                force: true
            });
        }
        if (sessionExists) {
            await this.store.extract({session: this.sessionName});
            await this.unCompressSession();
            await fs.promises.unlink(`RemoteAuth-${this.sessionName}.zip`);
        }
    }

    async deleteRemoteSession() {
        const sessionExists = await this.store.sessionExists({session: this.sessionName});
        if (sessionExists) await this.store.delete({session: this.sessionName});
    }

    async compressSession() {
        const archive = archiver('zip');
        const stream = fs.createWriteStream(`${this.sessionName}.zip`);

        await this.deleteMetadata();
        return new Promise((resolve, reject) => {
            archive
                .directory(this.userDataDir, false)
                .on('error', err => reject(err))
                .pipe(stream);

            stream.on('close', () => resolve());
            archive.finalize();
        });
    }

    async unCompressSession() {
        var stream = fs.createReadStream(`RemoteAuth-${this.sessionName}.zip`);
        return new Promise((resolve, reject) => {
            stream.pipe(unzipper.Extract({
                path: this.userDataDir
            }))
                .on('error', err => reject(err))
                .on('finish', () => resolve());
        });
    }

    async deleteMetadata() {
        const sessionDirs = [this.userDataDir, path.join(this.userDataDir, 'Default')];
        for (const dir of sessionDirs) {
            const dirPath = dir.includes('Default') ? dir : this.userDataDir;
            const sessionFiles = await fs.promises.readdir(dir);
            for (const element of sessionFiles) {
                if (!this.requiredDirs.includes(element)) {
                    const dirElement = path.join(dirPath, element);
                    const stats = await fs.promises.lstat(dirElement);
    
                    if (stats.isDirectory()) {
                        await fs.promises.rm(dirElement, {
                            recursive: true,
                            force: true
                        });
                    } else {
                        await fs.promises.unlink(dirElement);
                    }
                }
            }
        }
    }

    async isValidPath(path) {
        try {
            await fs.promises.access(path);
            return true;
        } catch {
            return false;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = RemoteAuth;