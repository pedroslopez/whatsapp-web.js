# Enhanced Presence Manager for WhatsApp Web.js

This document describes the Enhanced Presence Manager, a new feature that improves the reliability and accuracy of WhatsApp presence information (online status and last seen timestamps).

## Background

WhatsApp Web's presence API has several limitations:

1. **lastSeen is only sent when a contact goes offline** - While someone is online, WhatsApp intentionally keeps lastSeen as `null`
2. **Privacy settings can hide lastSeen** - If a contact has set their "Last seen" privacy to anything other than "Everyone," WhatsApp will never send the lastSeen timestamp
3. **Connection throttling** - WhatsApp throttles presence updates when the chat tab is in the background or after ~10 minutes of no interaction
4. **Inconsistent data sources** - WhatsApp Web stores presence data in multiple locations depending on the version

The Enhanced Presence Manager addresses these limitations by:

1. **Tracking historical lastSeen values** - Storing the most recent lastSeen timestamp for each contact
2. **Extracting lastSeen from the UI** - Reading the "last seen" text from the WhatsApp Web UI when available
3. **Maintaining active connections** - Periodically focusing chats to keep presence subscriptions active
4. **Checking multiple data sources** - Trying all known locations where WhatsApp might store presence data

## Usage

### Basic Usage

```javascript
const { Client } = require('whatsapp-web.js');
const client = new Client();

// Enable enhanced presence features
client.on('ready', async () => {
  await client.enableEnhancedPresence();
  
  // Start tracking a contact
  await client.trackPresence('1234567890@c.us');
});

// Listen for enhanced presence updates
client.on('enhanced_presence', (update) => {
  console.log(`${update.jid} is ${update.isOnline ? 'online' : 'offline'}`);
  
  if (update.lastSeen) {
    const lastSeenDate = new Date(update.lastSeen * 1000);
    console.log(`Last seen: ${lastSeenDate.toLocaleString()}`);
    
    if (update.historical) {
      console.log('(Using historical data)');
    }
    
    if (update.lastSeenSource) {
      console.log(`Source: ${update.lastSeenSource}`);
    }
  }
});

// Standard presence_update events still work for backward compatibility
client.on('presence_update', (update) => {
  console.log(`${update.jid} is ${update.isOnline ? 'online' : 'offline'}`);
  
  if (update.lastSeen) {
    console.log(`Last seen: ${new Date(update.lastSeen * 1000).toLocaleString()}`);
  }
});
```

### Advanced Usage

For more control, you can access the PresenceManager directly:

```javascript
const { Client } = require('whatsapp-web.js');
const client = new Client();

client.on('ready', async () => {
  // Get the presence manager
  const presenceManager = await client.enableEnhancedPresence();
  
  // Configure options
  presenceManager.focusInterval = 120000; // 2 minutes between focus calls
  presenceManager.pollInterval = 30000;   // 30 seconds between polls
  
  // Add a contact with options
  await presenceManager.add('1234567890@c.us', { openChat: true });
  
  // Get manager status
  const status = presenceManager.getStatus();
  console.log(`Tracking ${status.contactCount} contacts`);
});
```

## Enhanced Presence Data

The `enhanced_presence` event provides more detailed presence information:

```javascript
{
  jid: '1234567890@c.us',
  isOnline: false,
  lastSeen: 1715703740,        // Unix timestamp (seconds)
  historical: true,            // Optional: indicates this is from history
  lastSeenSource: 'header_parsed' // Optional: indicates where the data came from
}
```

Possible `lastSeenSource` values:

- `contact_presence` - From Contact model's presence property
- `chat_presence` - From Chat model's presence property
- `chatstate` - From PresenceCollection's chatstate
- `header_parsed` - Parsed from the chat header UI text
- `contact_info_parsed` - Parsed from the contact info UI text

## Integration with Existing Code

The Enhanced Presence Manager is fully backward compatible with existing code:

1. The standard `presence_update` event continues to work
2. The `client.getPresence()` method is enhanced but maintains the same API
3. The `client.trackPresence()` method is enhanced but maintains the same API

## Technical Details

### How It Works

1. **Subscription**: The manager subscribes to presence updates using WhatsApp's internal API
2. **Polling**: It periodically polls for presence updates (default: every 15 seconds)
3. **Focus**: It periodically focuses the chat to keep the connection active (default: every 60 seconds)
4. **UI Extraction**: When a contact is offline and no lastSeen is provided, it tries to extract it from the UI
5. **History**: It maintains a history of lastSeen values for each contact

### Limitations

1. **Privacy Settings**: If a contact has hidden their "last seen" in privacy settings, WhatsApp won't provide the timestamp
2. **UI Dependency**: UI extraction depends on WhatsApp Web's DOM structure, which may change
3. **Connection Requirements**: Requires keeping the WhatsApp Web tab active periodically

## Troubleshooting

If you're not receiving presence updates:

1. **Check Privacy Settings**: Ask the contact to set their "Last seen & online" privacy to "Everyone"
2. **Keep Chat Active**: Make sure the chat is opened periodically
3. **Check Connection**: Ensure WhatsApp Web is connected and not in a throttled state
4. **Version Compatibility**: Different WhatsApp Web versions store presence data in different locations

## Contributing

Contributions to improve the Enhanced Presence Manager are welcome. Please submit a PR with your changes.
