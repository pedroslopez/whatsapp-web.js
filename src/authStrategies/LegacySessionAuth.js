'use strict';

const BaseAuthStrategy = require('./BaseAuthStrategy');

/**
 * Legacy session auth strategy
 * Not compatible with multi-device accounts.
 * @param {object} options - options
 * @param {string} options.restartOnAuthFail - Restart client with a new session (i.e. use null 'session' var) if authentication fails
 * @param {object} options.session - Whatsapp session to restore. If not set, will start a new session
 * @param {string} options.session.WABrowserId
 * @param {string} options.session.WASecretBundle
 * @param {string} options.session.WAToken1
 * @param {string} options.session.WAToken2
 */
class LegacySessionAuth extends BaseAuthStrategy {
    constructor({ session, restartOnAuthFail }={}) {
        super();
        this.session = session;
        this.restartOnAuthFail = restartOnAuthFail;
    }

    async afterBrowserInitialized() {
        if(this.session) {
            await this.client.pupPage.evaluateOnNewDocument(session => {
                if (document.referrer === 'https://whatsapp.com/') {
                    localStorage.clear();
                    localStorage.setItem('WABrowserId', session.WABrowserId);
                    localStorage.setItem('WASecretBundle', session.WASecretBundle);
                    localStorage.setItem('WAToken1', session.WAToken1);
                    localStorage.setItem('WAToken2', session.WAToken2);
                }
  
                localStorage.setItem('remember-me', 'true');
            }, this.session);
        }
    }

    async onAuthenticationNeeded() {
        if(this.session) {
            this.session = null;
            return {
                failed: true,
                restart: this.restartOnAuthFail,
                failureEventPayload: 'Unable to log in. Are the session details valid?'
            };
        }

        return { failed: false };
    }

    async getAuthEventPayload() {
        const isMD = await this.client.pupPage.evaluate(() => {
            return window.Store.MDBackend;
        });

        if(isMD) throw new Error('Authenticating via JSON session is not supported for MultiDevice-enabled WhatsApp accounts.');

        const localStorage = JSON.parse(await this.client.pupPage.evaluate(() => {
            return JSON.stringify(window.localStorage);
        }));

        return {
            WABrowserId: localStorage.WABrowserId,
            WASecretBundle: localStorage.WASecretBundle,
            WAToken1: localStorage.WAToken1,
            WAToken2: localStorage.WAToken2
        };
    }
}

module.exports = LegacySessionAuth;
