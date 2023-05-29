const fetch = require('node-fetch');
const { WebCache, VersionResolveError } = require('./WebCache');

/**
 * RemoteWebCache - Fetches a WhatsApp Web version index from a remote server
 * @param {object} options - options
 * @param {string} options.remotePath - Endpoint that should be used to fetch the version index. Use {version} as a placeholder for the version number.
 * @param {boolean} options.strict - If true, will throw an error if the requested version can't be fetched. If false, will resolve to the latest version. Defaults to false.
 */
class RemoteWebCache extends WebCache {
    constructor(options = {}) {
        super();

        if (!options.remotePath) throw new Error('webVersionCache.remotePath is required when using the remote cache');
        this.remotePath = options.remotePath;
        this.strict = options.strict || false;
    }

    async resolve(version) {
        const remotePath = this.remotePath.replace('{version}', version);

        try {
            const cachedRes = await fetch(remotePath);
            if (cachedRes.ok) {
                return cachedRes.text();
            }
        } catch (err) {
            console.error(`Error fetching version ${version} from remote`, err);
        }

        if (this.strict) throw new VersionResolveError(`Couldn't load version ${version} from the archive`);
        return null;         
    }

    async persist() {
        // Nothing to do here
    }
}

module.exports = RemoteWebCache;