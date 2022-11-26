const fetch = require('node-fetch');

const VERSION_ARCHIVE_URL = 'https://archive.wwebjs.dev/web-index';

class VersionResolveError extends Error { }

const getIndexForVersion = async (version) => {
    const cachedRes = await fetch(`${VERSION_ARCHIVE_URL}/${version}`);
    if(!cachedRes.ok) throw new VersionResolveError(`Couldn't load app for version ${version} from the archive`);
    return cachedRes.text();
};

module.exports = {
    VersionResolveError,
    getIndexForVersion
};