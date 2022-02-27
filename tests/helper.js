const path = require('path');
const crypto = require('crypto');
const Client = require('../src/Client');

require('dotenv').config();

const remoteId = process.env.WWEBJS_TEST_REMOTE_ID;
if(!remoteId) throw new Error('The WWEBJS_TEST_REMOTE_ID environment variable has not been set.');

function isUsingDeprecatedSession() {
    return Boolean(process.env.WWEBJS_TEST_SESSION || process.env.WWEBJS_TEST_SESSION_PATH);
}

function isMD() {
    return Boolean(process.env.WWEBJS_TEST_MD);
}

if(isUsingDeprecatedSession() && isMD()) throw 'Cannot use deprecated sessions with WWEBJS_TEST_MD=true';

function getSessionFromEnv() {
    if (!isUsingDeprecatedSession()) return null;

    const envSession = process.env.WWEBJS_TEST_SESSION;
    if(envSession) return JSON.parse(envSession);

    const envSessionPath = process.env.WWEBJS_TEST_SESSION_PATH;
    if(envSessionPath) {
        const absPath = path.resolve(process.cwd(), envSessionPath);
        return require(absPath);
    }
}

function createClient({authenticated, options: additionalOpts}={}) {
    const options = {};

    if(authenticated) {
        const deprecatedSession = getSessionFromEnv();
        if(deprecatedSession) {
            options.session = deprecatedSession;
            options.useDeprecatedSessionAuth = true;
        } else {
            const clientId = process.env.WWEBJS_TEST_CLIENT_ID;
            if(!clientId) throw new Error('No session found in environment.');
            options.clientId = clientId;
        }
    } else {
        options.clientId = crypto.randomBytes(5).toString('hex');
    }

    const allOpts = {...options, ...(additionalOpts || {})};
    return new Client(allOpts);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    sleep, 
    createClient,
    isUsingDeprecatedSession,
    isMD,
    remoteId,
};