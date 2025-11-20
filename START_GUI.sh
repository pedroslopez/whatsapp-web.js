#!/bin/bash

# WhatsApp Web.js GUI Startup Script
# This script starts the WhatsApp Web.js GUI Manager

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   Starting WhatsApp Web.js GUI Manager...                     ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if node_modules exists
if [ ! -d "gui/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd gui
    npm install
    cd ..
    echo ""
fi

# Start the server
echo "🚀 Starting server..."
echo ""
cd gui
npm start
