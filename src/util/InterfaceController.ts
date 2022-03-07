'use strict';

import { Page } from "puppeteer";

/**
 * Interface Controller
 */
export class InterfaceController {
    pupPage: Page;

    constructor(props: {pupPage: Page}) {
        this.pupPage = props.pupPage;
    }

    /**
     * Opens the Chat Window
     */
    async openChatWindow(chatId: string) {
        await this.pupPage.evaluate(async chatId => {
            let chatWid = window.Store.WidFactory.createWid(chatId);
            let chat = await window.Store.Chat.find(chatWid);
            await window.Store.Cmd.openChatAt(chat);
        }, chatId);
    }

    /**
     * Opens the Chat Drawer
     */
    async openChatDrawer(chatId: string) {
        await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.openDrawerMid(chat);
        }, chatId);
    }

    /**
     * Opens the Chat Search
     */
    async openChatSearch(chatId: string) {
        await this.pupPage.evaluate(async chatId => {
            let chat = await window.Store.Chat.get(chatId);
            await window.Store.Cmd.chatSearch(chat);
        }, chatId);
    }

    /**
     * Opens or Scrolls the Chat Window to the position of the message
     */
    async openChatWindowAt(msgId: string) {
        await this.pupPage.evaluate(async msgId => {
            let msg = await window.Store.Msg.get(msgId);
            await window.Store.Cmd.openChatAt(msg.chat, msg.chat.getSearchContext(msg));
        }, msgId);
    }

    /**
     * Opens the Message Drawer
     */
    async openMessageDrawer(msgId: string) {
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
    async checkFeatureStatus(feature: string) {
        return await this.pupPage.evaluate((feature) => {
            return window.Store.Features.supportsFeature(feature);
        }, feature);
    }

    /**
     * Enable Features
     * @param {string[]} features to be enabled
     */
    async enableFeatures(features: string[]) {
        await this.pupPage.evaluate((features: string[]) => {
            for (const feature in features) {
                window.Store.Features.setFeature(features[feature], true);
            }
        }, features);
    }

    /**
     * Disable Features
     * @param {string[]} features to be disabled
     */
    async disableFeatures(features: string[]) {
        await this.pupPage.evaluate((features: string[]) => {
            for (const feature in features) {
                window.Store.Features.setFeature(features[feature], false);
            }
        }, features);
    }
}