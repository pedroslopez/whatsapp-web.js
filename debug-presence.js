/**
 * Debug script for WhatsApp Web presence issues
 * Run this in the browser console of the WhatsApp Web page
 */

// Target JID
const targetJid = '60138373362@c.us';

// Check which presence-related objects exist
console.log('=== PRESENCE OBJECTS AVAILABILITY ===');
console.log('Store.Presence:', !!window.Store.Presence);
console.log('Store.PresenceUtils:', !!window.Store.PresenceUtils);
console.log('Store.PresenceCollection:', !!window.Store.PresenceCollection);

// Check available methods
console.log('\n=== AVAILABLE METHODS ===');
if (window.Store.PresenceUtils) {
  console.log('PresenceUtils methods:', Object.getOwnPropertyNames(window.Store.PresenceUtils).filter(p => typeof window.Store.PresenceUtils[p] === 'function'));
}
if (window.Store.Presence) {
  console.log('Presence methods:', Object.getOwnPropertyNames(window.Store.Presence).filter(p => typeof window.Store.Presence[p] === 'function'));
}
if (window.Store.PresenceCollection) {
  console.log('PresenceCollection methods:', Object.getOwnPropertyNames(window.Store.PresenceCollection).filter(p => typeof window.Store.PresenceCollection[p] === 'function'));
}

// Try to find the contact in various collections
console.log('\n=== PRESENCE DATA LOOKUP ===');
const wid = window.Store.WidFactory.createWid(targetJid);
console.log('Target JID:', targetJid);
console.log('WID object:', wid);

// Check if the contact exists in PresenceCollection
if (window.Store.PresenceCollection) {
  const presenceEntry = window.Store.PresenceCollection.get?.(wid) || 
                        window.Store.PresenceCollection.find?.(wid);
  console.log('Found in PresenceCollection:', !!presenceEntry);
  if (presenceEntry) {
    console.log('PresenceCollection data:', {
      isOnline: presenceEntry.isOnline,
      lastSeen: presenceEntry.lastSeen,
      t: presenceEntry.t,
      raw: presenceEntry
    });
  }
}

// Check if the contact exists in Presence
if (window.Store.Presence) {
  const presenceEntry = window.Store.Presence.get?.(wid) || 
                        window.Store.Presence.find?.(wid);
  console.log('Found in Presence:', !!presenceEntry);
  if (presenceEntry) {
    console.log('Presence data:', {
      isOnline: presenceEntry.isOnline,
      lastSeen: presenceEntry.lastSeen,
      t: presenceEntry.t,
      raw: presenceEntry
    });
  }
}

// Try all subscription methods
console.log('\n=== ATTEMPTING SUBSCRIPTIONS ===');

// Method 1: PresenceUtils.subscribe
if (window.Store.PresenceUtils && typeof window.Store.PresenceUtils.subscribe === 'function') {
  console.log('Trying PresenceUtils.subscribe...');
  try {
    const result = window.Store.PresenceUtils.subscribe([wid]);
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

// Method 2: PresenceUtils.sendSubscribe
if (window.Store.PresenceUtils && typeof window.Store.PresenceUtils.sendSubscribe === 'function') {
  console.log('Trying PresenceUtils.sendSubscribe...');
  try {
    const result = window.Store.PresenceUtils.sendSubscribe([wid]);
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

// Method 3: PresenceUtils.sendSubscribeForDevices
if (window.Store.PresenceUtils && typeof window.Store.PresenceUtils.sendSubscribeForDevices === 'function') {
  console.log('Trying PresenceUtils.sendSubscribeForDevices...');
  try {
    const result = window.Store.PresenceUtils.sendSubscribeForDevices([wid]);
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

// Method 4: Presence.subscribe
if (window.Store.Presence && typeof window.Store.Presence.subscribe === 'function') {
  console.log('Trying Presence.subscribe...');
  try {
    const result = window.Store.Presence.subscribe(wid);
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

// Method 5: Add to PresenceCollection
if (window.Store.PresenceCollection && window.Store.PresenceCollection.add) {
  console.log('Trying PresenceCollection.add...');
  try {
    window.Store.PresenceCollection.add({ id: wid });
    console.log('Added to collection');
  } catch (err) {
    console.error('Error:', err);
  }
}

// Set up a monitor to watch for presence changes
console.log('\n=== SETTING UP PRESENCE MONITOR ===');
console.log('Will monitor presence for 30 seconds...');

// Function to check presence
const checkPresence = () => {
  const coll = window.Store.PresenceCollection || {};
  const pres = window.Store.Presence || {};
  const raw = 
    coll.get?.(wid) ??
    coll.find?.(wid) ??
    pres.get?.(wid) ??
    pres.find?.(wid) ??
    null;
  
  if (raw) {
    console.log(`[${new Date().toISOString()}] Presence update:`, {
      isOnline: !!raw.isOnline,
      lastSeen: raw.lastSeen ?? raw.t ?? null
    });
  } else {
    console.log(`[${new Date().toISOString()}] No presence data found`);
  }
};

// Check immediately
checkPresence();

// Set up interval to check every 2 seconds
const monitorInterval = setInterval(checkPresence, 2000);

// Stop after 30 seconds
setTimeout(() => {
  clearInterval(monitorInterval);
  console.log('Presence monitoring stopped');
}, 30000);

console.log('Debug script completed. Monitoring for 30 seconds...');
