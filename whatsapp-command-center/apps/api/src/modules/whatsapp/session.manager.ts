import { Injectable, Logger } from '@nestjs/common';
import { Client, LocalAuth, Message as WAMessage } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import { PrismaService } from '../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface SessionClient {
  client: Client;
  sessionId: string;
  organizationId: string;
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED';
  qrCode?: string;
}

@Injectable()
export class SessionManager {
  private readonly logger = new Logger(SessionManager.name);
  private sessions: Map<string, SessionClient> = new Map();

  constructor(
    private prisma: PrismaService,
  ) {}

  async createSession(sessionId: string, organizationId: string): Promise<SessionClient> {
    this.logger.log(`Creating WhatsApp session: ${sessionId}`);

    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      this.logger.warn(`Session ${sessionId} already exists`);
      return this.sessions.get(sessionId)!;
    }

    // Create WhatsApp client
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: process.env.WHATSAPP_SESSION_PATH || './.wwebjs_auth',
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });

    const sessionClient: SessionClient = {
      client,
      sessionId,
      organizationId,
      status: 'CONNECTING',
    };

    this.sessions.set(sessionId, sessionClient);

    // Set up event handlers
    this.setupEventHandlers(sessionClient);

    // Initialize client
    await client.initialize();

    return sessionClient;
  }

  private setupEventHandlers(sessionClient: SessionClient) {
    const { client, sessionId, organizationId } = sessionClient;

    // QR Code generation
    client.on('qr', async (qr) => {
      this.logger.log(`QR code generated for session: ${sessionId}`);

      try {
        const qrCodeDataUrl = await QRCode.toDataURL(qr);
        sessionClient.qrCode = qrCodeDataUrl;
        sessionClient.status = 'CONNECTING';

        // Update in database
        await this.prisma.whatsAppSession.update({
          where: { id: sessionId },
          data: {
            qrCode: qrCodeDataUrl,
            status: 'CONNECTING',
          },
        });

        this.logger.log(`QR code stored for session: ${sessionId}`);
      } catch (error) {
        this.logger.error(`Failed to generate QR code: ${error.message}`);
      }
    });

    // Client ready
    client.on('ready', async () => {
      this.logger.log(`WhatsApp client ready for session: ${sessionId}`);
      sessionClient.status = 'CONNECTED';
      sessionClient.qrCode = undefined;

      const clientInfo = client.info;

      await this.prisma.whatsAppSession.update({
        where: { id: sessionId },
        data: {
          status: 'CONNECTED',
          phoneNumber: clientInfo.wid.user,
          qrCode: null,
          lastConnectedAt: new Date(),
        },
      });
    });

    // Authenticated
    client.on('authenticated', () => {
      this.logger.log(`Session authenticated: ${sessionId}`);
    });

    // Authentication failure
    client.on('auth_failure', async (msg) => {
      this.logger.error(`Authentication failed for session ${sessionId}: ${msg}`);
      sessionClient.status = 'FAILED';

      await this.prisma.whatsAppSession.update({
        where: { id: sessionId },
        data: {
          status: 'FAILED',
        },
      });
    });

    // Disconnected
    client.on('disconnected', async (reason) => {
      this.logger.warn(`Session disconnected ${sessionId}: ${reason}`);
      sessionClient.status = 'DISCONNECTED';

      await this.prisma.whatsAppSession.update({
        where: { id: sessionId },
        data: {
          status: 'DISCONNECTED',
        },
      });

      // Clean up session
      this.sessions.delete(sessionId);
    });

    // Incoming messages
    client.on('message', async (message: WAMessage) => {
      this.logger.debug(`Message received on session ${sessionId}: ${message.id._serialized}`);

      try {
        await this.handleIncomingMessage(sessionClient, message);
      } catch (error) {
        this.logger.error(`Error handling message: ${error.message}`);
      }
    });

    // Message acknowledgment
    client.on('message_ack', async (message: WAMessage, ack) => {
      this.logger.debug(`Message ACK ${sessionId}: ${message.id._serialized} - ${ack}`);

      try {
        await this.handleMessageAck(sessionClient, message, ack);
      } catch (error) {
        this.logger.error(`Error handling message ACK: ${error.message}`);
      }
    });
  }

  private async handleIncomingMessage(sessionClient: SessionClient, waMessage: WAMessage) {
    const { sessionId, organizationId } = sessionClient;

    // Get or create contact
    const contact = await this.getOrCreateContact(
      organizationId,
      waMessage.from,
      waMessage.author || waMessage.from,
    );

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(
      organizationId,
      sessionId,
      contact.id,
      waMessage.from,
    );

    // Store message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        whatsappId: waMessage.id._serialized,
        direction: 'INBOUND',
        type: this.getMessageType(waMessage),
        body: waMessage.body,
        fromNumber: waMessage.from,
        toNumber: waMessage.to,
        timestamp: new Date(waMessage.timestamp * 1000),
        status: 'RECEIVED',
      },
    });

    // Update conversation
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    this.logger.log(`Message stored: ${waMessage.id._serialized}`);
  }

  private async handleMessageAck(sessionClient: SessionClient, waMessage: WAMessage, ack: number) {
    // Update message status based on acknowledgment
    const statusMap = {
      1: 'SENT',
      2: 'DELIVERED',
      3: 'READ',
    };

    const status = statusMap[ack] || 'SENT';

    await this.prisma.message.updateMany({
      where: {
        whatsappId: waMessage.id._serialized,
      },
      data: {
        status,
      },
    });
  }

  private async getOrCreateContact(organizationId: string, whatsappId: string, phoneNumber: string) {
    let contact = await this.prisma.contact.findFirst({
      where: {
        organizationId,
        whatsappId,
      },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          organizationId,
          whatsappId,
          phoneNumber,
        },
      });
    }

    return contact;
  }

  private async getOrCreateConversation(
    organizationId: string,
    sessionId: string,
    contactId: string,
    whatsappChatId: string,
  ) {
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        organizationId,
        whatsappChatId,
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          organizationId,
          sessionId,
          contactId,
          whatsappChatId,
          status: 'OPEN',
        },
      });
    }

    return conversation;
  }

  private getMessageType(message: WAMessage): string {
    if (message.hasMedia) {
      if (message.type === 'image') return 'IMAGE';
      if (message.type === 'video') return 'VIDEO';
      if (message.type === 'audio' || message.type === 'ptt') return 'AUDIO';
      if (message.type === 'document') return 'DOCUMENT';
      return 'MEDIA';
    }
    return 'TEXT';
  }

  async getSession(sessionId: string): Promise<SessionClient | undefined> {
    return this.sessions.get(sessionId);
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (session) {
      await session.client.destroy();
      this.sessions.delete(sessionId);
      this.logger.log(`Session destroyed: ${sessionId}`);
    }
  }

  async sendMessage(sessionId: string, to: string, message: string): Promise<WAMessage> {
    const session = this.sessions.get(sessionId);

    if (!session || session.status !== 'CONNECTED') {
      throw new Error('Session not connected');
    }

    return await session.client.sendMessage(to, message);
  }

  getAllSessions(): SessionClient[] {
    return Array.from(this.sessions.values());
  }
}
