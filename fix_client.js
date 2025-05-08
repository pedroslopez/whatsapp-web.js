const fs = require('fs');
const path = require('path');

// Read the original file
const clientPath = path.join(__dirname, 'src', 'Client.js');
const originalContent = fs.readFileSync(clientPath, 'utf8');

// Find the position of the module.exports line
const moduleExportsIndex = originalContent.indexOf('module.exports = Client;');

// Extract the parts of the file
const beforeExports = originalContent.substring(0, moduleExportsIndex);
const exportsLine = originalContent.substring(moduleExportsIndex);

// Create the new content with the presence methods
const presenceMethods = `
/**
 * Subscribe to presence updates for a contact.
 * Emits \`presence_update\` every time we poll.
 * @param {string} jid
 * @param {number} pollInterval - Interval in milliseconds to poll for presence updates
 */
Client.prototype.subscribePresence = async function(jid, pollInterval = 5000) {
    await this.pupPage.evaluate(jid => window.WWebJS.subscribePresence(jid), jid);

    // First read immediately
    const first = await this.getPresence(jid);
    if (first) this.emit(Events.PRESENCE_UPDATE, { jid, ...first });

    // Start a polling loop (simple but effective)
    const timer = setInterval(async () => {
        const p = await this.getPresence(jid);
        if (!p) return;
        this.emit(Events.PRESENCE_UPDATE, { jid, ...p });
    }, pollInterval);

    // Remember timer so caller can clear later if needed
    this._presenceTimers = this._presenceTimers || new Map();
    this._presenceTimers.set(jid, timer);
};

/**
 * Get the latest presence snapshot.
 * @param {string} jid
 * @returns {Promise<{isOnline: boolean, lastSeen: number}|null>}
 */
Client.prototype.getPresence = async function(jid) {
    return await this.pupPage.evaluate(jid => window.WWebJS.getPresence(jid), jid);
};

`;

// Combine the parts
const newContent = beforeExports + presenceMethods + exportsLine;

// Write the new content to the file
fs.writeFileSync(clientPath, newContent, 'utf8');

console.log('Successfully added presence methods to Client.js');
