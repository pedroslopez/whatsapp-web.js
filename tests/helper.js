const path = require('path');
const crypto = require('crypto');
const Client = require('../src/Client');
const Util = require('../src/util/Util');

require('dotenv').config();

const remoteId = process.env.WWEBJS_TEST_REMOTE_ID;
if(!remoteId) throw new Error('The WWEBJS_TEST_REMOTE_ID environment variable has not been set.');

function getSessionFromEnv() {
    const envSession = process.env.WWEBJS_TEST_SESSION;
    if(envSession) return JSON.parse(envSession);

    const envSessionPath = process.env.WWEBJS_TEST_SESSION_PATH;
    if(envSessionPath) {
        const absPath = path.resolve(process.cwd(), envSessionPath);
        return require(absPath);
    }
    
    throw new Error('No session found in environment.');
}

function createClient({authenticated, options: additionalOpts}={}) {
    const options = {};

    if(authenticated) {
        if(additionalOpts && additionalOpts.useDeprecatedSessionAuth) {
            options.session = getSessionFromEnv();
        } else {
            options.clientId = process.env.WWEBJS_TEST_CLIENT_ID;
        }
    } else {
        options.clientId = crypto.randomBytes(5).toString('hex');
    }

    const allOpts = Util.mergeDefault(options, additionalOpts || {});
    return new Client(allOpts);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    sleep, 
    createClient,
    remoteId
};