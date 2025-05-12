/* ------------------------------------------------------------------
   Presence helper — 2025‑05‑compatible
   ------------------------------------------------------------------ */
window.WWebJS = window.WWebJS || {};

/* ---------- subscribePresence: ask WA to start streaming ---------- */
window.WWebJS.subscribePresence = jid => {
    try {
        const utils = window.Store.PresenceUtils || {};
        const pres  = window.Store.Presence      || {};
        const coll  = window.Store.PresenceCollection || {};
        const wid   = window.Store.WidFactory.createWid(jid);

        // Try all known subscription methods
        if (typeof utils.subscribe === 'function') {
            utils.subscribe([wid]);
            return true;
        }

        if (typeof utils.sendSubscribe === 'function') {
            utils.sendSubscribe([wid]);
            return true;
        }

        if (typeof utils.sendSubscribeForDevices === 'function') {
            utils.sendSubscribeForDevices([wid]);
            return true;
        }

        // Only try this if it's actually a function
        if (pres && typeof pres.subscribe === 'function') {
            pres.subscribe(wid);
            return true;
        }

        // Last resort - add to collection
        if (coll && typeof coll.add === 'function') {
            coll.add({ id: wid });
            return true;
        }

        // Open the chat - this often triggers presence updates
        const chat = window.Store.Chat.get(wid);
        if (chat) {
            window.Store.Cmd.openChatAt(chat);
            return true;
        }

        return false;
    } catch (err) {
        return false;
    }
};

/* ---------- getPresence: try every known storage location ---------- */
window.WWebJS.getPresence = jid => {
    try {
        const wid = window.Store.WidFactory.createWid(jid);
        let result = null;

        // 1. Newer builds keep presence in the Contact model itself
        try {
            const contact = window.Store.Contact?.get?.(wid);
            if (contact && (contact.isOnline !== undefined || contact.lastSeen !== undefined)) {
                result = {
                    isOnline: !!contact.isOnline,
                    lastSeen: contact.lastSeen ?? null
                };
                // If we found data here, return it immediately
                return result;
            }
        } catch (e) {
            // Silent catch
        }

        // 2. Classic multi‑device
        try {
            const coll = window.Store.PresenceCollection || {};
            if (coll) {
                const fromColl = coll.get?.(wid) || coll.find?.(wid);
                if (fromColl) {
                    result = {
                        isOnline: !!fromColl.isOnline,
                        lastSeen: fromColl.lastSeen ?? fromColl.t ?? null
                    };
                    return result;
                }
            }
        } catch (e) {
            // Silent catch
        }

        // 3. Legacy single‑device
        try {
            const pres = window.Store.Presence || {};
            if (pres) {
                const fromPres = pres.get?.(wid) || pres.find?.(wid);
                if (fromPres) {
                    result = {
                        isOnline: !!fromPres.isOnline,
                        lastSeen: fromPres.lastSeen ?? fromPres.t ?? null
                    };
                    return result;
                }
            }
        } catch (e) {
            // Silent catch
        }

        // If we got here, we didn't find presence data anywhere
        return null;
    } catch (err) {
        return null;
    }
};
