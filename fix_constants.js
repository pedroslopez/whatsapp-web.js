const fs = require('fs');
const path = require('path');

// Read the original file
const constantsPath = path.join(__dirname, 'src', 'util', 'Constants.js');
const originalContent = fs.readFileSync(constantsPath, 'utf8');

// Find the Events object
const eventsStartIndex = originalContent.indexOf('exports.Events = {');
const eventsEndIndex = originalContent.indexOf('};', eventsStartIndex);

// Extract the parts of the file
const beforeEvents = originalContent.substring(0, eventsEndIndex);
const afterEvents = originalContent.substring(eventsEndIndex);

// Create the new content with the presence event
const presenceEvent = `
    /**
     * Emitted when a presence update is received
     * @event Client#presence_update
     * @param {object} presenceData
     * @param {string} presenceData.jid
     * @param {boolean} presenceData.isOnline
     * @param {number} presenceData.lastSeen
     */
    PRESENCE_UPDATE: 'presence_update',`;

// Combine the parts
const newContent = beforeEvents + presenceEvent + afterEvents;

// Write the new content to the file
fs.writeFileSync(constantsPath, newContent, 'utf8');

console.log('Successfully added PRESENCE_UPDATE event to Constants.js');
