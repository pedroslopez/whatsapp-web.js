const path = require('path');
const { Client, LegacySessionAuth, LocalAuth } = require('..');

require('dotenv').config();

const remoteId = process.env.WWEBJS_TEST_REMOTE_ID;
if(!remoteId) throw new Error('The WWEBJS_TEST_REMOTE_ID environment variable has not been set.');

function isUsingLegacySession() {
    return Boolean(process.env.WWEBJS_TEST_SESSION || process.env.WWEBJS_TEST_SESSION_PATH);
}

function isMD() {
    return Boolean(process.env.WWEBJS_TEST_MD);
}

if(isUsingLegacySession() && isMD()) throw 'Cannot use legacy sessions with WWEBJS_TEST_MD=true';

function getSessionFromEnv() {
    if (!isUsingLegacySession()) return null;

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
        const legacySession = getSessionFromEnv();
        if(legacySession) {
            options.authStrategy = new LegacySessionAuth({
                session: legacySession
            });
        } else {
            const clientId = process.env.WWEBJS_TEST_CLIENT_ID;
            if(!clientId) throw new Error('No session found in environment.');
            options.authStrategy = new LocalAuth({
                clientId
            });
        }
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
    isUsingLegacySession,
    isMD,
    remoteId,
};