const fs = require('fs');
const path = require('path');

// Read the original file
const constantsPath = path.join(__dirname, 'src', 'util', 'Constants.js');
const originalContent = fs.readFileSync(constantsPath, 'utf8');

// Fix the syntax error
const fixedContent = originalContent.replace('PRESENCE_UPDATE: \'presence_update\',};', 'PRESENCE_UPDATE: \'presence_update\'\n};');

// Write the fixed content to the file
fs.writeFileSync(constantsPath, fixedContent, 'utf8');

console.log('Successfully fixed syntax error in Constants.js');
