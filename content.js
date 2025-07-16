// WhatsApp Web.js Manager - Enhanced Content Script
// This script runs on WhatsApp Web pages to provide integration

(function() {
    'use strict';

    let injectScriptLoaded = false;
    let messageQueue = [];
    let isExtensionContextValid = true;

    // Check if extension context is still valid
    function checkExtensionContext() {
        try {
            // Try to access chrome.runtime to check if context is valid
            if (chrome.runtime && chrome.runtime.id) {
                return true;
            }
        } catch (error) {
            console.warn('Extension context invalidated:', error);
            isExtensionContextValid = false;
            return false;
        }
        return true;
    }

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
            sendToBackground({
                action: 'whatsapp_event',
                data: {
                    type: 'integration_failed',
                    data: { error: 'Failed to load inject script' }
                }
            });
        };
        (document.head || document.documentElement).appendChild(script);
    }

    // Safe function to send messages to background script
    function sendToBackground(message) {
        if (!checkExtensionContext()) {
            console.warn('Cannot send message - extension context invalid');
            return;
        }

        try {
            chrome.runtime.sendMessage(message).catch(error => {
                console.error('Failed to send message to background script:', error);
                // Don't mark context as invalid for communication errors
                // as they might be temporary
            });
        } catch (error) {
            console.error('Error sending message to background script:', error);
            if (error.message.includes('Extension context invalidated')) {
                isExtensionContextValid = false;
            }
        }
    }

    // Communication bridge between injected script and extension
    window.addEventListener('message', function(event) {
        // Only accept messages from same origin
        if (event.source !== window) return;

        if (event.data.type && event.data.type === 'FROM_INJECT_SCRIPT') {
            // Forward to background script
            sendToBackground({
                action: 'whatsapp_event',
                data: event.data.payload
            });
        }
    });

    // Listen for messages from extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!checkExtensionContext()) {
            sendResponse({ success: false, error: 'Extension context invalid' });
            return;
        }

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

    // Periodic context check
    setInterval(() => {
        checkExtensionContext();
    }, 5000);

    console.log('WhatsApp Web.js Manager content script loaded');
})();