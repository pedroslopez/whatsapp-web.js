const {getClient, initializeWhatsAppClient} = require('./whatsappService');

function loginClient(location_identifier, res) {
    if (!location_identifier) {
        return res.status(400).json({success: false, message: 'The location identifier is required'});
    }

    try {
        const client = getClient(location_identifier);
        if (!client) {
            initializeWhatsAppClient(location_identifier); // Initializes client and handles QR code
        }
        res.json({success: true, message: `Initialization process started for ${location_identifier}`});
    } catch (error) {
        console.error('Error in login process:', error);
        res.status(500).json({success: false, message: 'Error during login process'});
    }
}

module.exports = { loginClient };