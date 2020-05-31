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
            let chat = await window.Store.Chat.get(chatId);
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
    
}

module.exports = InterfaceController;