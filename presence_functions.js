    /**
     * Subscribe to presence updates for a contact
     * @param {string} jid e.g. '60123456789@c.us'
     */
    window.WWebJS.subscribePresence = (jid) => {
        if (window.Store?.Presence) {
            window.Store.Presence.subscribe(jid);
            return true;
        }
        return false;
    };

    /**
     * Get latest cached presence data
     * @param {string} jid
     * @returns {{isOnline: boolean, lastSeen: number}|null}
     */
    window.WWebJS.getPresence = (jid) => {
        const p = window.Store?.Presence?.find(jid);
        if (!p) return null;
        return { isOnline: p.isOnline, lastSeen: p.lastSeen };
    };
