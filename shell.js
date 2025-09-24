const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { Client, MessageMedia, RemoteAuth} = require('./index');
const qrcode = require('qrcode-terminal');

// Require database
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');

const mongoURI = 'mongodb://127.0.0.1:27017/whatsapp-multi?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.2';
let dbStore = {}
// // Conexión a MongoDB
mongoose.connect(mongoURI).then(() => {
    const store = new MongoStore({ mongoose: mongoose });
    dbStore = store;
})

// Modificamos el esquema para incluir más información de la sesión
const instanceSchema = new mongoose.Schema({
    instanceId: String,
    name: String,
    status: String,
    qrCode: String,
    sessionId: { type: String, required: true, unique: true },
    createdAt: Date,
    active: { type: Boolean, default: false } // Nuevo campo para tracking,
});

const Instance = mongoose.model('Instance', instanceSchema);

// Almacén de instancias activas
const activeInstances = new Map();

// Función para inicializar una instancia
async function initializeWhatsAppInstance(instanceData) {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    try {

        console.log('Create New Instance', instanceData.name)

        const client = new Client({
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
                timeout: 60000
            },
            authStrategy: new RemoteAuth({
                store: dbStore,
                clientId: instanceData.instanceId,
                backupSyncIntervalMs: 300000
            })
        });

        client.on('qr', async (qr) => {
            console.log(`QR RECEIVED for instance ${instanceData.instanceId}`, qr);
            qrcode.generate(qr, {small: true});

            await Instance.findOneAndUpdate(
                {instanceId: instanceData.instanceId},
                {qrCode: qr, status: 'qr-received'}
            );
        });

        client.on('ready', async () => {
            console.log(`Instance ${instanceData.instanceId} is ready!`);
            await Instance.findOneAndUpdate(
                {instanceId: instanceData.instanceId},
                {status: 'ready', active: true}
            );
        });

        client.on('change_state', async (state) => {
            console.log('state', state)
        })

        client.on('remote_session_saved', () => {
            console.log('remote_session_saved')
            // Do Stuff...
        });


        client.on('authenticated', async (session) => {
            console.log(`Instance ${instanceData.instanceId} authenticated successfully!`);
            await Instance.findOneAndUpdate(
                {instanceId: instanceData.instanceId},
                {session, status: 'authenticated', active: true}
            );
        });

        client.on('disconnected', async () => {
            console.log(`Instance ${instanceData.instanceId} disconnected`);
            await Instance.findOneAndUpdate(
                {instanceId: instanceData.instanceId},
                {status: 'disconnected', active: false}
            );
        });

        client.on('error', async (error) => {
            console.error(`Client error for instance ${instanceData.instanceId}:`, error);
            await Instance.findOneAndUpdate(
                {instanceId: instanceData.instanceId},
                {status: 'error', active: false}
            );
        });


        await client.initialize();
        return client;
    }catch (error) {
        console.error(`Error initializing instance ${instanceData.instanceId}:`, error);

        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying initialization (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
            return initializeWhatsAppInstance(instanceData, retryCount + 1);
        }

        throw error;
    }

}


// --- RESTORE ACTIVE INSTANCES ---
async function restoreActiveInstances() {
    try {
        console.log('Restoring active instances...');
        const savedInstances = await Instance.find({status: {$in: ['active', 'shutdown','failed-to-restore', 'ready', 'authenticated']}});
        console.log(savedInstances)

        for (const instanceData of savedInstances) {
            console.log(`Restoring instance ${instanceData.instanceId}`);
            try {
                // The `initializeWhatsAppInstance` function now handles the session loading
                // from MongoDB automatically thanks to `MongoAuthStrategy`.
                const client = await initializeWhatsAppInstance(instanceData);
                activeInstances.set(instanceData.instanceId, client);
                console.log(`Instance ${instanceData.instanceId} restored successfully`);
            } catch (error) {
                console.error(`Error restoring instance ${instanceData.instanceId}:`, error);
                await Instance.findOneAndUpdate(
                    { instanceId: instanceData.instanceId },
                    { active: false, status: 'failed-to-restore' }
                );
            }
        }
    } catch (error) {
        console.error('Error restoring instances:', error);
    }
}

const app = express();
const port = 4050;

app.use(bodyParser.json());

// Crear nueva instancia
app.post('/instance/create', async (req, res) => {
    const { name } = req.body;
    const instanceId = uuidv4();
    const sessionId = uuidv4();

    try {
        const instance = new Instance({
            instanceId,
            sessionId,
            name,
            status: 'initializing',
            createdAt: new Date(),
            active: false
        });
        await instance.save();

        const client = await initializeWhatsAppInstance(instance);
        activeInstances.set(instanceId, client);

        res.status(201).json({
            status: 'success',
            instanceId,
            message: 'WhatsApp instance created successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para reconectar una instancia específica
app.post('/instance/:instanceId/reconnect', async (req, res) => {
    const { instanceId } = req.params;
    console.log('Reconnect Instance id:', instanceId )

    try {
        const instanceData = await Instance.findOne({ instanceId });
        if (!instanceData) {
            return res.status(404).json({ error: 'Instance not found' });
        }

        // Si ya existe una instancia activa, la desconectamos primero
        if (activeInstances.has(instanceId)) {
            const oldClient = activeInstances.get(instanceId);
            await oldClient.destroy();
            activeInstances.delete(instanceId);
        }

        const client = await initializeWhatsAppInstance(instanceData);
        activeInstances.set(instanceId, client);

        res.json({
            status: 'success',
            message: 'Instance reconnected successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para cerrar una instancia
app.post('/instance/:instanceId/logout', async (req, res) => {
    const { instanceId } = req.params;

    try {
        const client = activeInstances.get(instanceId);
        if (client) {
            await client.destroy();
            activeInstances.delete(instanceId);
            await Instance.findOneAndUpdate(
                { instanceId },
                { active: false, status: 'logged-out', session: null }
            );
        }

        res.json({
            status: 'success',
            message: 'Instance logged out successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enviar mensaje desde una instancia específica

// Enviar mensaje desde una instancia específica
app.post('/instance/:instanceId/send-message', async (req, res) => {
    const { instanceId } = req.params;
    const { recipients } = req.body;
    const messages = req.body.messages

    console.log(`Send Message for instanceid: ${instanceId}`)
    console.log(`recipients: ${recipients}`)
    console.log(`messages: ${messages}`)

    const client = activeInstances.get(instanceId);

    if (!client) {
        return res.status(404).json({ error: 'Instance not found or not active' });
    }

    if (!messages || !Array.isArray(messages) || !recipients || !Array.isArray(recipients)) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    try {
        const results = [];

        // Función auxiliar para crear un delay
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        for (const recipient of recipients) {
            for (const message of messages) {
                console.log(message);
                const { type, caption, body } = message;

                try {
                    if (type === 'image') {
                        const media = await MessageMedia.fromUrl(message.media.data, { unsafeMime: true });
                        await client.sendMessage(
                            recipient,
                            body,
                            {
                                media: media,
                                caption: caption
                            });
                    } else {
                        await client.sendMessage(recipient, body);
                    }
                    results.push({ recipient, status: 'sent' });

                    // Agregamos un delay de 500ms después de cada mensaje
                    await delay(500);
                } catch (error) {
                    results.push({ recipient, status: 'failed', error: error.message });
                }
            }
        }

        res.status(200).json({
            status: 'success',
            message: 'Messages sent successfully',
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/instance/:instanceId/clear-session', async (req, res) => {
    const { instanceId } = req.params;

    try {
        // Remove the instance from active instances
        if (activeInstances.has(instanceId)) {
            const client = activeInstances.get(instanceId);
            await client.destroy();
            activeInstances.delete(instanceId);
        }

        // Clear session data from database
        await Instance.findOneAndUpdate(
            { instanceId },
            {
                status: 'session-cleared',
                active: false,
                session: null,
                qrCode: null
            }
        );

        res.json({
            status: 'success',
            message: 'Session cleared successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// app.post('/instance/:instanceId/send-message', async (req, res) => {
//     const { instanceId } = req.params;
//     const { recipients } = req.body;
//     const messages = req.body.messages
//    
//     console.log(`Send Message for instanceid: ${instanceId}`)
//     console.log(`recipients: ${recipients}`)
//     console.log(`messages: ${messages}`)
//
//     const client = activeInstances.get(instanceId);
//
//     if (!client) {
//         return res.status(404).json({ error: 'Instance not found or not active' });
//     }
//    
//     if (!messages || !Array.isArray(messages) || !recipients || !Array.isArray(recipients)) {
//         return res.status(400).json({ error: 'Invalid request body' });
//     }
//
//     try {
//         const results = [];
//         const sendPromises = [];
//
//         const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
//
//
//         for (const recipient of recipients) {
//             for (const message of messages) {
//                 console.log(message);
//                 const { type, caption, body } = message;
//
//                 if (type === 'image') {
//                     const media = await MessageMedia.fromUrl(message.media.data, { unsafeMime: true });
//                     sendPromises.push(
//                         client.sendMessage(recipient, body, {
//                             media: media,
//                             caption: caption
//                         })
//                     );
//                 } else {
//                     sendPromises.push(
//                         client.sendMessage(recipient, body)
//                     );
//                 }
//                 results.push({ recipient, status: 'queued' });
//                 await delay(500);
//
//             }
//         }
//
//         await Promise.all(sendPromises);
//         res.status(200).json({
//             status: 'success',
//             message: 'Messages sent successfully',
//             results
//         });
//        
//        
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// Iniciar el servidor y restaurar las instancias
app.listen(port, async () => {
    console.log(`API is running on http://localhost:${port}`);
    await restoreActiveInstances();
});

// Manejar el cierre graceful del servidor
process.on('SIGINT', async () => {
    console.log('Shutting down server...');

    // Actualizar todas las instancias activas en la BD
    for (const [instanceId, client] of activeInstances) {
        try {
            await Instance.findOneAndUpdate(
                { instanceId },
                { status: 'shutdown', active: false }
            );
            await client.destroy();
        } catch (error) {
            console.error(`Error shutting down instance ${instanceId}:`, error);
        }
    }

    process.exit(0);
});