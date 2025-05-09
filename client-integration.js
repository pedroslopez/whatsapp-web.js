/**
 * This file contains the integration code to add the PresenceManager to the Client class.
 * It should be imported and used in the Client.js file.
 */

const PresenceManager = require('./presence-manager');

/**
 * Integrates the PresenceManager with the Client class.
 * @param {Client} Client - The Client class to enhance
 */
function integratePresenceManager(Client) {
  // Initialize PresenceManager in Client constructor
  const originalInitialize = Client.prototype.initialize;
  Client.prototype.initialize = async function() {
    // Call the original initialize method
    const result = await originalInitialize.call(this);
    
    // Initialize the presence manager after client is ready
    this.on('ready', () => {
      if (!this._presenceManager) {
        this._presenceManager = new PresenceManager(this);
      }
    });
    
    return result;
  };
  
  // Enhance getPresence method to use PresenceManager
  const originalGetPresence = Client.prototype.getPresence;
  Client.prototype.getPresence = async function(jid) {
    // First try the original method
    const nativePresence = await originalGetPresence.call(this, jid);
    
    // If we have a PresenceManager and it's initialized, enhance the data
    if (this._presenceManager && nativePresence) {
      return this._presenceManager.enhancePresence(jid, nativePresence);
    }
    
    return nativePresence;
  };
  
  // Enhance trackPresence to use PresenceManager
  const originalTrackPresence = Client.prototype.trackPresence;
  Client.prototype.trackPresence = async function(jid, interval = 45000) {
    // If we have a PresenceManager, use it
    if (this._presenceManager) {
      await this._presenceManager.add(jid);
      
      // Start the manager if it's not already running
      if (!this._presenceManager.isRunning()) {
        this._presenceManager.start();
      }
      
      return true;
    }
    
    // Fall back to original implementation
    return await originalTrackPresence.call(this, jid, interval);
  };
  
  // Add method to get the PresenceManager
  Client.prototype.getPresenceManager = function() {
    return this._presenceManager;
  };
  
  // Add method to enable enhanced presence features
  Client.prototype.enableEnhancedPresence = async function() {
    if (!this._presenceManager) {
      this._presenceManager = new PresenceManager(this);
    }
    
    // Start the manager if it's not already running
    if (!this._presenceManager.isRunning()) {
      this._presenceManager.start();
    }
    
    return this._presenceManager;
  };
}

module.exports = integratePresenceManager;
