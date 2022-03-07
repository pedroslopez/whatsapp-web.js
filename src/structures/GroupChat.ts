'use strict';

import { Chat } from "./Chat";
import { ContactId } from "./Contact";

/**
 * Group participant information
 * @typedef {Object} GroupParticipant
 * @property {ContactId} id
 * @property {boolean} isAdmin
 * @property {boolean} isSuperAdmin
 */

export interface GroupParticipant {
    id: ContactId;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}

/**
 * Represents a Group Chat on WhatsApp
 * @extends {Chat}
 */
export class GroupChat extends Chat {
    groupMetadata: {
        owner: ContactId;
        creation: number;
        desc: string;
        participants: GroupParticipant[];
        announce: boolean;
        restrict: boolean;
    } & Record<string, any>;

    _patch(data: Record<string, any>) {
        this.groupMetadata = data.groupMetadata;

        return super._patch(data);
    }

    /**
     * Gets the group owner
     */
    get owner() {
        return this.groupMetadata.owner;
    }
    
    /**
     * Gets the date at which the group was created
     */
    get createdAt() {
        return new Date(this.groupMetadata.creation * 1000);
    }

    /** 
     * Gets the group description
     */
    get description() {
        return this.groupMetadata.desc;
    }

    /**
     * Gets the group participants
     */
    get participants() {
        return this.groupMetadata.participants;
    }

    /**
     * Adds a list of participants by ID to the group
     * @param {Array<string>} participantIds 
     * @returns {Promise<Object>}
     */
    async addParticipants(participantIds: string[]) {
        return await this.client.pupPage.evaluate((chatId, participantIds) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const participantWids = participantIds.map(p => window.Store.WidFactory.createWid(p));
            return window.Store.GroupParticipants.sendAddParticipants(chatWid, participantWids);
        }, this.id._serialized, participantIds);
    }

    /**
     * Removes a list of participants by ID to the group
     * @param {Array<string>} participantIds 
     * @returns {Promise<Object>}
     */
    async removeParticipants(participantIds: string[]) {
        return await this.client.pupPage.evaluate((chatId, participantIds) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const participantWids = participantIds.map(p => window.Store.WidFactory.createWid(p));
            return window.Store.GroupParticipants.sendRemoveParticipants(chatWid, participantWids);
        }, this.id._serialized, participantIds);
    }

    /**
     * Promotes participants by IDs to admins
     * @param {Array<string>} participantIds 
     * @returns {Promise<{ status: number }>} Object with status code indicating if the operation was successful
     */
    async promoteParticipants(participantIds: string[]) {
        return await this.client.pupPage.evaluate((chatId, participantIds) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const participantWids = participantIds.map(p => window.Store.WidFactory.createWid(p));
            return window.Store.GroupParticipants.sendPromoteParticipants(chatWid, participantWids);
        }, this.id._serialized, participantIds);
    }

    /**
     * Demotes participants by IDs to regular users
     * @param {Array<string>} participantIds 
     * @returns {Promise<{ status: number }>} Object with status code indicating if the operation was successful
     */
    async demoteParticipants(participantIds: string[]) {
        return await this.client.pupPage.evaluate((chatId, participantIds) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            const participantWids = participantIds.map(p => window.Store.WidFactory.createWid(p));
            return window.Store.GroupParticipants.sendDemoteParticipants(chatWid, participantWids);
        }, this.id._serialized, participantIds);
    }

    /**
     * Updates the group subject
     * @param {string} subject 
     * @returns Returns true if the subject was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setSubject(subject: string) {
        const success = await this.client.pupPage.evaluate(async (chatId, subject) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                return await window.Store.GroupUtils.sendSetGroupSubject(chatWid, subject);
            } catch (err) {
                if(err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, this.id._serialized, subject);

        if(!success) return false;
        this.name = subject;
        return true;
    }

    /**
     * Updates the group description
     * @param {string} description 
     * @returns Returns true if the description was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setDescription(description: string) {
        const success = await this.client.pupPage.evaluate(async (chatId, description) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            let descId = window.Store.GroupMetadata.get(chatWid).descId;
            try {
                return await window.Store.GroupUtils.sendSetGroupDescription(chatWid, description, window.Store.genId(), descId);
            } catch (err) {
                if(err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, this.id._serialized, description);

        if(!success) return false;
        this.groupMetadata.desc = description;
        return true;
    }

    /**
     * Updates the group settings to only allow admins to send messages.
     * @param {boolean} [adminsOnly=true] Enable or disable this option 
     * @returns Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setMessagesAdminsOnly(adminsOnly=true) {
        const success = await this.client.pupPage.evaluate(async (chatId, adminsOnly) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                return await window.Store.GroupUtils.sendSetGroupProperty(chatWid, 'announcement', adminsOnly ? 1 : 0);
            } catch (err) {
                if(err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, this.id._serialized, adminsOnly);

        if(!success) return false;

        this.groupMetadata.announce = adminsOnly;
        return true;
    }

    /**
     * Updates the group settings to only allow admins to edit group info (title, description, photo).
     * @param {boolean} [adminsOnly=true] Enable or disable this option 
     * @returns Returns true if the setting was properly updated. This can return false if the user does not have the necessary permissions.
     */
    async setInfoAdminsOnly(adminsOnly=true) {
        const success = await this.client.pupPage.evaluate(async (chatId, adminsOnly) => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            try {
                return await window.Store.GroupUtils.sendSetGroupProperty(chatWid, 'restrict', adminsOnly ? 1 : 0);
            } catch (err) {
                if(err.name === 'ServerStatusCodeError') return false;
                throw err;
            }
        }, this.id._serialized, adminsOnly);

        if(!success) return false;
        
        this.groupMetadata.restrict = adminsOnly;
        return true;
    }

    /**
     * Gets the invite code for a specific group
     * @returns Group's invite code
     */
    async getInviteCode() {
        const code: string = await this.client.pupPage.evaluate(async chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            return window.Store.Invite.sendQueryGroupInviteCode(chatWid);
        }, this.id._serialized);

        return code;
    }
    
    /**
     * Invalidates the current group invite code and generates a new one
     * @returns New invite code
     */
    async revokeInvite() {
        const code: string = await this.client.pupPage.evaluate(chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            return window.Store.Invite.sendRevokeGroupInviteCode(chatWid);
        }, this.id._serialized);

        return code;
    }

    /**
     * Makes the bot leave the group
     */
    async leave() {
        await this.client.pupPage.evaluate(chatId => {
            const chatWid = window.Store.WidFactory.createWid(chatId);
            return window.Store.GroupUtils.sendExitGroup(chatWid);
        }, this.id._serialized);
    }

}
