// WhatsApp Web.js Manager - Enhanced Content Script
// This script runs on WhatsApp Web pages to provide integration

(function() {
    'use strict';

    let injectScriptLoaded = false;
    let messageQueue = [];

    // Inject the main script into the page context
    function injectScript() {
        if (injectScriptLoaded) return;

        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inject.js');
        script.onload = function() {
            this.remove();
            injectScriptLoaded = true;
            console.log('WhatsApp Web.js Manager inject script loaded');
            
            // Process any queued messages
            while (messageQueue.length > 0) {
                const message = messageQueue.shift();
                window.postMessage({
                    type: 'FROM_EXTENSION',
                    payload: message
                }, '*');
            }
        };
        script.onerror = function() {
            console.error('Failed to load inject script');
            chrome.runtime.sendMessage({
                action: 'whatsapp_event',
                data: {
                    type: 'integration_failed',
                    data: { error: 'Failed to load inject script' }
                }
            });
        };
        (document.head || document.documentElement).appendChild(script);
    }

    // Communication bridge between injected script and extension
    window.addEventListener('message', function(event) {
        // Only accept messages from same origin
        if (event.source !== window) return;

        if (event.data.type && event.data.type === 'FROM_INJECT_SCRIPT') {
            // Forward to background script
            chrome.runtime.sendMessage({
                action: 'whatsapp_event',
                data: event.data.payload
            }).catch(error => {
                console.error('Failed to send message to background script:', error);
            });
        }
    });

    // Listen for messages from extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'execute_script') {
            if (injectScriptLoaded) {
                // Script is loaded, send message directly
                window.postMessage({
                    type: 'FROM_EXTENSION',
                    payload: message.data
                }, '*');
                
                // Set up response listener
                const responseListener = (event) => {
                    if (event.source !== window) return;
                    
                    if (event.data.type && event.data.type === 'FROM_INJECT_SCRIPT') {
                        const { type, data } = event.data.payload;
                        
                        // Check if this is a response to our request
                        if (type === message.data.type + '_result' || 
                            type === message.data.type + '_data' ||
                            type === message.data.type + '_sent') {
                            
                            window.removeEventListener('message', responseListener);
                            sendResponse(data);
                        }
                    }
                };
                
                window.addEventListener('message', responseListener);
                
                // Set timeout for response
                setTimeout(() => {
                    window.removeEventListener('message', responseListener);
                    if (!sendResponse.called) {
                        sendResponse({ 
                            success: false, 
                            error: 'No response from WhatsApp Web' 
                        });
                    }
                }, 15000); // 15 second timeout
                
            } else {
                // Script not loaded yet, queue the message
                messageQueue.push(message.data);
                sendResponse({ 
                    success: false, 
                    error: 'WhatsApp Web integration not ready yet' 
                });
            }
        }
    });

    // Inject script when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectScript);
    } else {
        injectScript();
    }

    // Also inject when page is updated (for SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            injectScriptLoaded = false;
            injectScript();
        }
    }).observe(document, { subtree: true, childList: true });

    console.log('WhatsApp Web.js Manager content script loaded');
})();