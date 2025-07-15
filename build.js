#!/usr/bin/env node

/**
 * Build script for WhatsApp Web.js Manager Chrome Extension
 * This script packages the extension for distribution
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = 'build';
const EXTENSION_NAME = 'whatsapp-webjs-manager';

// Files to include in the extension package
const EXTENSION_FILES = [
    'manifest.json',
    'background.js',
    'content.js',
    'inject.js',
    'popup.html',
    'options.html',
    'styles/',
    'icons/',
    'LICENSE'
];

// Files to exclude from packaging
const EXCLUDE_PATTERNS = [
    '.git*',
    'node_modules/*',
    'build/*',
    '*.md',
    'package*.json',
    'build.js',
    '.eslint*',
    '.editor*'
];

console.log('🚀 Building WhatsApp Web.js Manager Extension...\n');

// Clean build directory
if (fs.existsSync(BUILD_DIR)) {
    console.log('🧹 Cleaning build directory...');
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}

// Create build directory
fs.mkdirSync(BUILD_DIR, { recursive: true });

// Copy extension files
console.log('📁 Copying extension files...');
EXTENSION_FILES.forEach(file => {
    const srcPath = path.join('.', file);
    const destPath = path.join(BUILD_DIR, file);
    
    if (fs.existsSync(srcPath)) {
        const stats = fs.statSync(srcPath);
        if (stats.isDirectory()) {
            copyDirectory(srcPath, destPath);
            console.log(`   ✅ Copied directory: ${file}`);
        } else {
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.copyFileSync(srcPath, destPath);
            console.log(`   ✅ Copied file: ${file}`);
        }
    } else {
        console.log(`   ⚠️  File not found: ${file}`);
    }
});

// Validate manifest.json
console.log('\n🔍 Validating manifest.json...');
try {
    const manifest = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'manifest.json'), 'utf8'));
    
    // Check required fields
    const requiredFields = ['manifest_version', 'name', 'version', 'description'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
        console.log(`   ❌ Missing required fields: ${missingFields.join(', ')}`);
    } else {
        console.log('   ✅ Manifest validation passed');
        console.log(`   📦 Extension: ${manifest.name} v${manifest.version}`);
    }
} catch (error) {
    console.log(`   ❌ Manifest validation failed: ${error.message}`);
}

// Check for icon files
console.log('\n🎨 Checking icon files...');
const iconSizes = ['16', '32', '48', '128'];
const iconsDir = path.join(BUILD_DIR, 'icons');

if (fs.existsSync(iconsDir)) {
    iconSizes.forEach(size => {
        const iconPath = path.join(iconsDir, `icon${size}.png`);
        if (fs.existsSync(iconPath)) {
            console.log(`   ✅ Icon found: icon${size}.png`);
        } else {
            console.log(`   ⚠️  Icon missing: icon${size}.png (currently SVG placeholder)`);
        }
    });
} else {
    console.log('   ❌ Icons directory not found');
}

// Create ZIP package
console.log('\n📦 Creating ZIP package...');
try {
    const zipName = `${EXTENSION_NAME}-v${getVersion()}.zip`;
    const zipPath = path.join('.', zipName);
    
    // Remove existing zip
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
    }
    
    // Create zip using system zip command
    process.chdir(BUILD_DIR);
    execSync(`zip -r ../${zipName} .`, { stdio: 'inherit' });
    process.chdir('..');
    
    const stats = fs.statSync(zipPath);
    console.log(`   ✅ Package created: ${zipName} (${(stats.size / 1024).toFixed(1)} KB)`);
    
} catch (error) {
    console.log(`   ❌ Failed to create ZIP: ${error.message}`);
    console.log('   💡 Make sure zip command is available on your system');
}

// Generate build report
console.log('\n📊 Build Report:');
const buildSize = getFolderSize(BUILD_DIR);
console.log(`   📁 Build size: ${(buildSize / 1024).toFixed(1)} KB`);
console.log(`   📁 Build location: ./${BUILD_DIR}/`);

console.log('\n🎉 Build completed successfully!');
console.log('\n📋 Next steps:');
console.log('   1. Test the extension by loading the build folder in Chrome');
console.log('   2. Convert SVG icons to PNG format for production');
console.log('   3. Upload the ZIP file to Chrome Web Store');

// Helper functions
function copyDirectory(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function getVersion() {
    try {
        const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
        return manifest.version || '1.0.0';
    } catch {
        return '1.0.0';
    }
}

function getFolderSize(folderPath) {
    let size = 0;
    const files = fs.readdirSync(folderPath);
    
    files.forEach(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
            size += stats.size;
        } else if (stats.isDirectory()) {
            size += getFolderSize(filePath);
        }
    });
    
    return size;
}