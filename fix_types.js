const fs = require('fs');
const path = require('path');

// Read the original file
const typesPath = path.join(__dirname, 'index.d.ts');
const originalContent = fs.readFileSync(typesPath, 'utf8');

// Add the PresenceUpdate interface
const presenceInterface = `
export interface PresenceUpdate {
    jid: string;
    isOnline: boolean;
    lastSeen: number;
}
`;

// Find a good place to add the interface (after the last interface)
const lastInterfaceIndex = originalContent.lastIndexOf('export interface');
const nextExportIndex = originalContent.indexOf('export ', lastInterfaceIndex + 1);
const interfaceInsertPosition = nextExportIndex !== -1 ? nextExportIndex : originalContent.length;

// Insert the interface
let newContent = originalContent.substring(0, interfaceInsertPosition) + 
                presenceInterface + 
                originalContent.substring(interfaceInsertPosition);

// Find the Client interface
const clientInterfaceIndex = newContent.indexOf('export interface Client');
const clientInterfaceEndIndex = newContent.indexOf('}', clientInterfaceIndex);

// Add the presence methods to the Client interface
const presenceMethods = `
    /**
     * Subscribe to presence updates for a contact
     * @param jid The JID of the contact
     * @param pollInterval Interval in milliseconds to poll for presence updates
     */
    subscribePresence(jid: string, pollInterval?: number): Promise<void>;
    
    /**
     * Get the latest presence snapshot
     * @param jid The JID of the contact
     */
    getPresence(jid: string): Promise<PresenceUpdate | null>;
    
    /** Emitted when a presence update is received */
    on(event: 'presence_update', listener: (update: PresenceUpdate) => void): this;
`;

// Insert the methods
newContent = newContent.substring(0, clientInterfaceEndIndex) + 
            presenceMethods + 
            newContent.substring(clientInterfaceEndIndex);

// Write the new content to the file
fs.writeFileSync(typesPath, newContent, 'utf8');

console.log('Successfully updated TypeScript definitions in index.d.ts');
