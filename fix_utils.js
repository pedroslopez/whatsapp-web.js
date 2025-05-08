const fs = require('fs');
const path = require('path');

// Read the original file
const utilsPath = path.join(__dirname, 'src', 'util', 'Injected', 'Utils.js');
const originalContent = fs.readFileSync(utilsPath, 'utf8');

// Find the position of the last function and the closing bracket
const lastFunctionIndex = originalContent.lastIndexOf('window.WWebJS.getAllStatuses');
const closingBracketIndex = originalContent.lastIndexOf('};');

// Extract the parts of the file
const beforeLastFunction = originalContent.substring(0, lastFunctionIndex);
const lastFunction = originalContent.substring(lastFunctionIndex, closingBracketIndex);
const closingBracket = originalContent.substring(closingBracketIndex);

// Create the new content with the presence functions
const presenceFunctions = `
    /**
     * Subscribe to presence updates for a contact
     * @param {string} jid e.g. '60123456789@c.us'
     */
    window.WWebJS.subscribePresence = (jid) => {
        if (window.Store?.Presence) {
            window.Store.Presence.subscribe(jid);
            return true;
        }
        return false;
    };

    /**
     * Get latest cached presence data
     * @param {string} jid
     * @returns {{isOnline: boolean, lastSeen: number}|null}
     */
    window.WWebJS.getPresence = (jid) => {
        const p = window.Store?.Presence?.find(jid);
        if (!p) return null;
        return { isOnline: p.isOnline, lastSeen: p.lastSeen };
    };`;

// Combine the parts
const newContent = beforeLastFunction + lastFunction + presenceFunctions + closingBracket;

// Write the new content to the file
fs.writeFileSync(utilsPath, newContent, 'utf8');

console.log('Successfully added presence functions to Utils.js');
