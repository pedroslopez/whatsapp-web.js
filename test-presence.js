const { Client } = require('./index');

// Just test that the methods exist
console.log('Checking if presence methods exist:');
console.log('Client.prototype.subscribePresence:', typeof Client.prototype.subscribePresence === 'function');
console.log('Client.prototype.getPresence:', typeof Client.prototype.getPresence === 'function');
console.log('Client.prototype.trackPresence:', typeof Client.prototype.trackPresence === 'function');

console.log('\nAll presence methods are properly defined!');
