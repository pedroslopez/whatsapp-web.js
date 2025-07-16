const RemoteWebCache = require('./RemoteWebCache');
const LocalWebCache = require('./LocalWebCache');
const { WebCache } = require('./WebCache');

const createWebCache = (type, options) => {
    switch (type) {
    case 'remote':
        return new RemoteWebCache(options);
    case 'local':
        return new LocalWebCache(options);
    case 'none':
        return new WebCache();
    default:
        throw new Error(`Invalid WebCache type ${type}`);
    }
};

module.exports = {
    createWebCache,
};