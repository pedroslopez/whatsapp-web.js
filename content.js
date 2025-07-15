// WhatsApp Web.js Manager - Content Script
// This script runs on WhatsApp Web pages to provide integration

(function() {
    'use strict';

    // Inject the main script into the page context
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);

    // Communication bridge between injected script and extension
    window.addEventListener('message', function(event) {
        // Only accept messages from same origin
        if (event.source !== window) return;

        if (event.data.type && event.data.type === 'FROM_INJECT_SCRIPT') {
            // Forward to background script
            chrome.runtime.sendMessage({
                action: 'whatsapp_event',
                data: event.data.payload
            });
        }
    });

    // Listen for messages from extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'execute_script') {
            // Execute script in page context
            window.postMessage({
                type: 'FROM_EXTENSION',
                payload: message.data
            }, '*');
        }
    });

    console.log('WhatsApp Web.js Manager content script loaded');
})();