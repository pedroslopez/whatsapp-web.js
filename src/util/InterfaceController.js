'use strict';

/**
 * Interface Controller
 */
class InterfaceController {

    constructor(props) {
        this.pupPage = props.pupPage;
    }

    /**
     * Opens the Chat Window
     * @param {string} chatId ID of the chat window that will be opened
     */
    async openChatWindow(chatId) {
        try {
            await this.pupPage.evaluate(async chatId => {
                let chatWid = window.Store.WidFactory.createWid(chatId);
                let chat = await window.Store.Chat.find(chatWid);
                await window.Store.Cmd.openChatAt(chat);
            }, chatId);
        } catch(err) {
            throw err
        }
        
    }

    /**
     * Opens the Chat Drawer
     * @param {string} chatId ID of the chat drawer that will be opened
     */
    async openChatDrawer(chatId) {
        try {
            await this.pupPage.evaluate(async chatId => {
                let chat = await window.Store.Chat.get(chatId);
                await window.Store.Cmd.openDrawerMid(chat);
            }, chatId);
        } catch(err) {
            throw err
        }
    }

    /**
     * Opens the Chat Search
     * @param {string} chatId ID of the chat search that will be opened
     */
    async openChatSearch(chatId) {
        try {
            await this.pupPage.evaluate(async chatId => {
                let chat = await window.Store.Chat.get(chatId);
                await window.Store.Cmd.chatSearch(chat);
            }, chatId);
        } catch(err) {
            throw err
        }
    }

    /**
     * Opens or Scrolls the Chat Window to the position of the message
     * @param {string} msgId ID of the message that will be scrolled to
     */
    async openChatWindowAt(msgId) {
        try {
            await this.pupPage.evaluate(async msgId => {
                try {
                    let msg = await window.Store.Msg.get(msgId);
                    await window.Store.Cmd.openChatAt(msg.chat, msg.chat.getSearchContext(msg));
                } catch(err) {
                    throw err
                }
            }, msgId)
        } catch(err) {
            throw err            
        }
    }

    /**
     * Opens the Message Drawer
     * @param {string} msgId ID of the message drawer that will be opened
     */
    async openMessageDrawer(msgId) {
        try {
            await this.pupPage.evaluate(async msgId => {
                try {
                    let msg = await window.Store.Msg.get(msgId);
                    await window.Store.Cmd.msgInfoDrawer(msg);
                } catch(err) {
                    throw err
                }
            }, msgId);
        } catch(err) {
            throw err
        }
    }

    /**
     * Closes the Right Drawer
     */
    async closeRightDrawer() {
        try {
            await this.pupPage.evaluate(async () => {
                await window.Store.Cmd.closeDrawerRight();
            });
        } catch(err) {
            throw err
        }
    }

    /**
     * Get all Features
     */
    async getFeatures() {
        return await this.pupPage.evaluate(() => {
            return window.Store.Features.F;
        });
    }

    /**
     * Check if Feature is enabled
     * @param {string} feature status to check
     */
    async checkFeatureStatus(feature) {
        try {
            return await this.pupPage.evaluate((feature) => {
                try {
                    return window.Store.Features.supportsFeature(feature);
                } catch(err) {
                    throw err
                }
            }, feature);
        } catch(err) {
            throw err
        }
    }

    /**
     * Enable Features
     * @param {string[]} features to be enabled
     */
    async enableFeatures(features) {
        await this.pupPage.evaluate((features) => {
            for (const feature in features) {
                try {
                    window.Store.Features.setFeature(features[feature], true);
                } catch(err) {
                    throw err
                }
            }
        }, features);
    }

    /**
     * Disable Features
     * @param {string[]} features to be disabled
     */
    async disableFeatures(features) {
        try {
            await this.pupPage.evaluate((features) => {
                for (const feature in features) {
                    window.Store.Features.setFeature(features[feature], false);
                }
            }, features);
        } catch(err) {
            throw err
        }
    }
}

module.exports = InterfaceController;
