const path = require('path');
const fs = require('fs');

const { WebCache, VersionResolveError } = require('./WebCache');

/**
 * LocalWebCache - Fetches a WhatsApp Web version from a local file store
 * @param {object} options - options
 * @param {string} options.path - Path to the directory where cached versions are saved, default is: "./.wwebjs_cache/"
 * @param {boolean} options.strict - If true, will throw an error if the requested version can't be fetched. If false, will resolve to the latest version.
 */
class LocalWebCache extends WebCache {
    constructor(options = {}) {
        super();

        this.path = options.path || './.wwebjs_cache/';
        this.strict = options.strict || false;
    }

    async resolve(version) {
        const filePath = path.join(this.path, `${version}.html`);

        try {
            return fs.readFileSync(filePath, 'utf-8');
        }
        catch (err) {
            if (this.strict) throw new VersionResolveError(`Couldn't load version ${version} from the cache`);
            return null;
        }
    }

    /**
     * Save the HTML content and its version information.
     * 
     * @param {string} indexHtml - The HTML content to be saved.
     */
    async persist(indexHtml) {
        // Use a regular expression to find the version in the manifest file name
        const match = indexHtml.match(/manifest-([\d\\.]+)\.json/);

        // If the version is found, extract it from the match result
        const version = match ? match[1] : null;

        // If no version is found, exit the function
        if (!version) return;

        // Create the file path for saving the HTML content
        const filePath = path.join(this.path, `${version}.html`);

        // Ensure the directory exists, create it if necessary
        fs.mkdirSync(this.path, { recursive: true });

        // Write the HTML content to the file
        fs.writeFileSync(filePath, indexHtml);
    }
}

module.exports = LocalWebCache;
