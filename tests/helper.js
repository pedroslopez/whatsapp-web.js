const path = require('path');
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

function createClient({withSession, options: additionalOpts}={}) {
    const options = {};
    if(withSession) {
        options.session = getSessionFromEnv();
    }

    return new Client(Util.mergeDefault(options, additionalOpts || {}));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    sleep, 
    createClient,
    remoteId
};