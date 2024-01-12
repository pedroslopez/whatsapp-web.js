const {getClient, initializeWhatsAppClient} = require('./whatsappService');

async function send_message_to_client(location_identifier, res, receiver_phone, message) {
    try {
        const client = getClient(location_identifier);

        if (!client) {
            // Initialize client if not already done
            await initializeWhatsAppClient(location_identifier);
            return res.status(400).json({
                success: false,
                message: 'Client not initialized yet. Please try again after QR code authentication.'
            });
        }

        if (client.isReady()) {
            await client.sendMessage(`${receiver_phone}@c.us`, message);
            res.json({success: true, message: 'Message sent successfully'});
        } else {
            res.status(400).json({success: false, message: 'Client is not ready.'});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'Error sending message'});
    }
}

module.exports = { send_message_to_client };
