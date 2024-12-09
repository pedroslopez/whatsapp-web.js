code index.js
// Importa bibliotecas necessárias
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Inicializa o cliente do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(), // Armazena sessão localmente
});

// Gera o QR Code no terminal
client.on('qr', (qr) => {
    console.log('Escaneie este QR Code para conectar ao WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Evento de prontidão
client.on('ready', () => {
    console.log('Bot conectado ao WhatsApp!');
});

// Lida com mensagens recebidas
client.on('message', async (msg) => {
    console.log(`Mensagem recebida de ${msg.from}: ${msg.body}`);
    msg.reply('Olá! Estou aqui para ajudar.');
});

// Inicializa o cliente
client.initialize();

