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
        return await this.pupPage.evaluate(async (chatId) => {
            const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            return await window.Store.Cmd.openChatBottom({'chat':chat});
        }, chatId);
    }

    /**
     * Opens the Chat Drawer
     * @param {string} chatId ID of the chat drawer that will be opened
     */
    async openChatDrawer(chatId) {
        await this.pupPage.evaluate(async chatId => {
            let chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            await window.Store.Cmd.openDrawerMid(chat);
        }, chatId);
    }

    /**
     * Opens the Chat Search
     * @param {string} chatId ID of the chat search that will be opened
     */
    async openChatSearch(chatId) {
        await this.pupPage.evaluate(async chatId => {
            let chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
            await window.Store.Cmd.chatSearch(chat);
        }, chatId);
    }

    /**
     * Opens or Scrolls the Chat Window to the position of the message
     * @param {string} msgId ID of the message that will be scrolled to
     */
    async openChatWindowAt(msgId) {
        await this.pupPage.evaluate(async (msgId) => {
            const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            const chat = window.Store.Chat.get(msg.id.remote) ?? await window.Store.Chat.find(msg.id.remote);
            const searchContext = await window.Store.SearchContext.getSearchContext(chat, msg.id);
            await window.Store.Cmd.openChatAt({ chat: chat, msgContext: searchContext });
        }, msgId);
    }

    /**
     * Opens the Message Drawer
     * @param {string} msgId ID of the message drawer that will be opened
     */
    async openMessageDrawer(msgId) {
        await this.pupPage.evaluate(async msgId => {
            const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            await window.Store.Cmd.msgInfoDrawer(msg);
        }, msgId);
    }

    /**
     * Closes the Right Drawer
     */
    async closeRightDrawer() {
        await this.pupPage.evaluate(async () => {
            await window.Store.DrawerManager.closeDrawerRight();
        });
    }

    /**
     * Get all Features
     */
    async getFeatures() {
        return await this.pupPage.evaluate(() => {
            if(!window.Store.Features) throw new Error('This version of Whatsapp Web does not support features');
            return window.Store.Features.F;
        });
    }

    /**
     * Check if Feature is enabled
     * @param {string} feature status to check
     */
    async checkFeatureStatus(feature) {
        return await this.pupPage.evaluate((feature) => {
            if(!window.Store.Features) throw new Error('This version of Whatsapp Web does not support features');
            return window.Store.Features.supportsFeature(feature);
        }, feature);
    }

    /**
     * Enable Features
     * @param {string[]} features to be enabled
     */
    async enableFeatures(features) {
        await this.pupPage.evaluate((features) => {
            if(!window.Store.Features) throw new Error('This version of Whatsapp Web does not support features');
            for (const feature in features) {
                window.Store.Features.setFeature(features[feature], true);
            }
        }, features);
    }

    /**
     * Disable Features
     * @param {string[]} features to be disabled
     */
    async disableFeatures(features) {
        await this.pupPage.evaluate((features) => {
            if(!window.Store.Features) throw new Error('This version of Whatsapp Web does not support features');
            for (const feature in features) {
                window.Store.Features.setFeature(features[feature], false);
            }
        }, features);
    }
}

module.exports = InterfaceController;
