const express = require('express');
const router = express.Router();
const { send_message_to_client } = require('../services/sendMessageToClient');
const { loginClient } = require('../services/loginClient');

// Endpoint to send a message
router.post('/send_message', async (req, res) => {
    const { location_identifier, receiver_phone, message } = req.body;
    return await send_message_to_client(location_identifier, res, receiver_phone, message);
});

router.post('/login', (req, res) => {
    const { location_identifier } = req.body;
    return loginClient(location_identifier, res);
});

module.exports = router;
