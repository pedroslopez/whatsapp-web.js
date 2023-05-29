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

        if (!options.remotePattern) throw new Error('webVersionCache.remotePath is required when using the remote cache');
        this.remotePath = options.remotePath;
        this.strict = options.strict || false;
    }

    async resolve(version) {
        const remotePath = this.remotePath.replace('{version}', version);
        const cachedRes = await fetch(remotePath);
        if (!cachedRes.ok) {
            if (this.strict) throw new VersionResolveError(`Couldn't load version ${version} from the archive`);
            return null;
        }

        return cachedRes.text();
    }

    async persist() {
        // Nothing to do here
    }
}

module.exports = RemoteWebCache;