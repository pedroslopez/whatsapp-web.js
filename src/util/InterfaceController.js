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
        await this.pupPage.evaluate(async chatId => {
            let chatWid = window.Store.WidFactory.createWid(chatId);
            let chat = await window.Store.Chat.find(chatWid);
            await window.Store.Cmd.openChatAt(chat);
        }, chatId);
    }

    /**
     * Opens the Chat Drawer
     * @param {string} chatId ID of the chat drawer that will be opened
     */
    async openChatDrawer(chatId) {
        await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.chatInfoDrawer(chat);
        }, chatId);
    }

    /**
     * Opens the Chat Search
     * @param {string} chatId ID of the chat search that will be opened
     */
    async openChatSearch(chatId) {
        await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.chatSearch(chat);
        }, chatId);
    }

    /**
     * Opens or Scrolls the Chat Window to the position of the message
     * @param {string} msgId ID of the message that will be scrolled to
     */
    async openChatWindowAt(msgId) {
        await this.pupPage.evaluate(async msgId => {
            let msg = await window.Store.Msg.get(msgId);
            await window.Store.Cmd.openChatAt(msg.chat, msg.chat.getSearchContext(msg));
        }, msgId);
    }

    /**
     * Opens the Message Drawer
     * @param {string} msgId ID of the message drawer that will be opened
     */
    async openMessageDrawer(msgId) {
        await this.pupPage.evaluate(async msgId => {
            let msg = await window.Store.Msg.get(msgId);
            await window.Store.Cmd.msgInfoDrawer(msg);
        }, msgId);
    }

    /**
     * Closes the Right Drawer
     */
    async closeRightDrawer() {
        await this.pupPage.evaluate(async () => {
            await window.Store.Cmd.closeDrawerRight();
        });
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
        return await this.pupPage.evaluate((feature) => {
            return window.Store.Features.supportsFeature(feature);
        }, feature);
    }

    /**
     * Enable Features
     * @param {string[]} features to be enabled
     */
    async enableFeatures(features) {
        await this.pupPage.evaluate((features) => {
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
            for (const feature in features) {
                window.Store.Features.setFeature(features[feature], false);
            }
        }, features);
    }
}

module.exports = InterfaceController;
