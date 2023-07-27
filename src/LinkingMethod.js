class LinkingMethod {
    /**
     *
     * @typedef QR
     * @type {object}
     * @property {number} maxRetries - The maximum number of retries to get the QR code before disconnecting
     *
     * @typedef Phone
     * @type {object}
     * @property {string} number - The phone number to link with. This should be in the format of <country code><phone number> (e.g. 5521998765432)
     *
     * @typedef LinkingMethodData
     * @type {object}
     * @property {QR} qr - Configuration for QR code linking
     * @property {Phone} phone - Configuration for phone number linking
     *
     * @param {LinkingMethodData} data - Linking method configuration
     */
    constructor(data) {

        if (data) this._patch(data);
    }

    /**
     *
     * @param {LinkingMethodData} data
     */
    _patch({ phone, qr }) {
        if (qr && phone)
            throw new Error(
                'Cannot create a link with both QR and phone. Please check the linkingMethod property of the client options.'
            );
        this.qr = qr;
        this.phone = phone;
    }

    isPhone() {
        return !!this.phone;
    }

    isQR() {
        return !!this.qr;
    }
}

module.exports = LinkingMethod;
