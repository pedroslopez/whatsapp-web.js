'use strict';

const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const archiver = require('archiver');
const fsPromise = require('fs').promises;
const schedule = require('node-schedule');
const BaseAuthStrategy = require('./BaseAuthStrategy');

/**
 * Remote-based authentication
 * @param {object} options - options
 * @param {string} options.clientId - Client id to distinguish instances if you are using multiple, otherwise keep null if you are using only one instance
 * @param {string} options.dataPath - Change the default path for saving session files, default is: "./.wwebjs_auth/" 
 * @param {number} options.backupSyncTime - Sets the time interval for periodic session backups. Accepts values bewteen range: (5-59) Minutes
 */
class RemoteAuth extends BaseAuthStrategy {
    constructor({ clientId, dataPath, store, backupSyncTime } = {}) {
        super();

        const idRegex = /^[-_\w]+$/i;
        if (clientId && !idRegex.test(clientId)) {
            throw new Error('Invalid clientId. Only alphanumeric characters, underscores and hyphens are allowed.');
        }
        if (backupSyncTime < 5 || backupSyncTime > 59) {
            throw new Error('Invalid backupSyncTime. Accepts values between range (5-59) minutes.');
        }

        this.clientId = clientId;
        this.backupSyncTime = backupSyncTime;
        this.dataPath = path.resolve(dataPath || './.wwebjs_auth/');
        this.requiredDirs = ["Default", "IndexedDB", "Local Storage"]; /* => Required Files & Dirs in WWebJS to restore session */
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

        await this.extractSession();

        this.client.options.puppeteer = {
            ...puppeteerOpts,
            userDataDir: dirPath
        };
    }

    async afterBrowserInitialized() {
        /**
         * TODO:
         * 1. @const {boolean} sessionExists => Call abstract DB interface to get session instance if exists
         */
        const sessionExists = false; /* 1. Default to false on initial draft */
        if (!sessionExists) {
            await this.storeSession();
        }
        this.sessionBackup();
    }

    async logout() {
        if (this.userDataDir) {
            return (fs.rmSync ? fs.rmSync : fs.rmdirSync).call(this, this.userDataDir, {
                recursive: true
            });
        }
        await this.deleteSession();
    }

    static async storeSession() {
        try {
            /**
             * TODO:
             * 1. @const {boolean} sessionExists => Call abstract DB interface to get session instance if exists
             * 2. Call abstract DB interface to delete previous session
             * 3. Call abstract DB interface to save session
             */

            const sessionExists = false; /* 1. Default to false on initial draft */
            if (sessionExists) {
                /* 2. Delete Previous Session from DB */
            }

            /* Compress & Store Session */
            if (fs.existsSync(this.userDataDir)) {
                await this.zipSession(this.userDataDir, `${this.sessionName}.zip`);
                console.log('> Session Zip Created');

                /* 3. await Save session in DB */
                console.log('> Session Saved in Database');
                await fsPromise.unlink(`${this.sessionName}.zip`);
            }

        } catch (error) {
            console.log('Error MD => CreateMDSession', error);
        }
    }

    static async extractSession() {
        try {
            /**
             * TODO:
             * 1. @const {boolean} sessionExists => Call abstract DB interface to get session instance if exists
             * 2. Call abstract DB interface to extract session using userDataDir as @param
             */
            const sessionExists = false; /* 1. Default to false on initial draft */

            /* Extracting Session From DB to Local Directory */
            if (sessionExists) {
                console.log('> Extracting Session...');
                /* 2. await DB extraction to desired path */

                /* Delete Previous local session folder */
                if (fs.existsSync(this.userDataDir)) {
                    await fsPromise.rm(this.userDataDir, {
                        recursive: true,
                        force: true
                    });
                }

                await this.unzipSession('ExtractedSession.zip');
                await fsPromise.unlink('ExtractedSession.zip');

                console.log('> Extraction Completed');
            }
        } catch (error) {
            console.log('RemoteAuth: ExtractSession =>', error);
        }
    }

    static async deleteSession() {
        try {
            /**
             * TODO:
             * 1. @const {boolean} sessionExists => Call abstract DB interface to get session instance if exists
             * 2. Call abstract DB interface to delete session
             */
             const sessionExists = false; /* 1. Default to false on initial draft */
    
            /* Deleting Session */
            if (sessionExists) {
                console.log('> Deleting Session...')
                /* 2. await delete session from DB */
    
                console.log('Deleting Complete');
            }
        } catch (error) {
            console.log('Error MD => DeleteSession', error);
        }
    }

    /**
     * @param {String} sourceDir
     * @param {String} dirPath 
     * @returns {Promise}
     */
    static async zipSession(sourceDir, dirPath) {
        try {
            const archive = archiver('zip');
            const stream = fs.createWriteStream(dirPath);

            await this.deleteMetadata();
            return new Promise((resolve, reject) => {
                archive
                    .directory(sourceDir, false)
                    .on('error', err => reject(err))
                    .pipe(stream);

                stream.on('close', () => resolve());
                archive.finalize();
            });
        } catch (error) {
            console.log('RemoteAuth: zipSession => ', error);
        }
    }

    /**
     * @param {String} sourceDir 
     * @returns {Promise}
     */
    static async unzipSession(sourceDir) {
        try {
            var stream = fs.createReadStream(sourceDir);
            return new Promise((resolve, reject) => {
                stream.pipe(unzipper.Extract({
                        path: this.userDataDir
                    }))
                    .on('error', err => reject(err))
                    .on('finish', () => resolve());
            });
        } catch (error) {
            console.log('RemoteAuth: unzipSession => ', error);
        }
    }

    static async deleteMetadata() {
        try {
            /* First Level */
            let sessionFiles = await fsPromise.readdir(this.userDataDir);
            for (let element of sessionFiles) {
                if (!this.requiredDirs.includes(element)) {
                    let dirElement = path.join(this.userDataDir, element);

                    console.log('> Deleting...', element);
                    await fsPromise.unlink(dirElement);
                }
            }

            /* Second Level */
            let sessionFilesDefault = await fsPromise.readdir(`${this.userDataDir}/Default`);
            for (let element of sessionFilesDefault) {
                if (!this.requiredDirs.includes(element)) {
                    let dirElement = path.join(`${this.userDataDir}/Default`, element);

                    console.log('> Deleting...', element);
                    let stats = await fsPromise.lstat(dirElement);

                    if (stats.isDirectory()) {
                        await fsPromise.rm(dirElement, {
                            recursive: true,
                            force: true
                        });
                    } else {
                        await fsPromise.unlink(dirElement);
                    }
                }
            }
        } catch (error) {
            console.log('RemoteAuth: deleteMetadata => ', error);
        }
    }

    static async sessionBackup() {
        schedule.scheduleJob(`*/${this.backupSyncTime} * * * *`, async function () {
            console.log('> Executing Session Sync')
            /**
             * TODO:
             * 1. Validate if WAClient has existing valid session to store
             * 2. Create new backup session on DB
             */
            await this.storeSession();
        });
    }

}

module.exports = RemoteAuth;