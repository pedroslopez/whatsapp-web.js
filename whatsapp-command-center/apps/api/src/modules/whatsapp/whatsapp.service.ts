import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SessionManager } from './session.manager';
import { CreateSessionDto, SendMessageDto } from './dto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private prisma: PrismaService,
    private sessionManager: SessionManager,
  ) {}

  async createSession(organizationId: string, dto: CreateSessionDto) {
    this.logger.log(`Creating session for organization: ${organizationId}`);

    // Create session in database
    const session = await this.prisma.whatsAppSession.create({
      data: {
        organizationId,
        name: dto.name,
        status: 'CONNECTING',
      },
    });

    // Initialize WhatsApp client
    try {
      const sessionClient = await this.sessionManager.createSession(session.id, organizationId);

      return {
        id: session.id,
        name: session.name,
        status: sessionClient.status,
        qrCode: sessionClient.qrCode,
      };
    } catch (error) {
      this.logger.error(`Failed to create session: ${error.message}`);

      await this.prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { status: 'FAILED' },
      });

      throw new BadRequestException('Failed to initialize WhatsApp session');
    }
  }

  async getAllSessions(organizationId: string) {
    const sessions = await this.prisma.whatsAppSession.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(session => {
      const sessionClient = this.sessionManager.getSession(session.id);

      return {
        ...session,
        currentStatus: sessionClient?.status || session.status,
        qrCode: sessionClient?.qrCode,
      };
    });
  }

  async getSession(sessionId: string, organizationId: string) {
    const session = await this.prisma.whatsAppSession.findFirst({
      where: { id: sessionId, organizationId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const sessionClient = this.sessionManager.getSession(sessionId);

    return {
      ...session,
      currentStatus: sessionClient?.status || session.status,
      qrCode: sessionClient?.qrCode,
    };
  }

  async deleteSession(sessionId: string, organizationId: string) {
    const session = await this.prisma.whatsAppSession.findFirst({
      where: { id: sessionId, organizationId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Destroy WhatsApp client
    await this.sessionManager.destroySession(sessionId);

    // Delete from database
    await this.prisma.whatsAppSession.delete({
      where: { id: sessionId },
    });

    return { success: true, message: 'Session deleted successfully' };
  }

  async sendMessage(sessionId: string, organizationId: string, dto: SendMessageDto) {
    const session = await this.getSession(sessionId, organizationId);

    if (session.currentStatus !== 'CONNECTED') {
      throw new BadRequestException('Session is not connected');
    }

    try {
      const waMessage = await this.sessionManager.sendMessage(
        sessionId,
        dto.to,
        dto.message,
      );

      // Get or create contact
      const contact = await this.getOrCreateContact(organizationId, dto.to);

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        organizationId,
        sessionId,
        contact.id,
        dto.to,
      );

      // Store message
      const message = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          whatsappId: waMessage.id._serialized,
          direction: 'OUTBOUND',
          type: 'TEXT',
          body: dto.message,
          fromNumber: waMessage.from,
          toNumber: waMessage.to,
          timestamp: new Date(waMessage.timestamp * 1000),
          status: 'SENT',
        },
      });

      // Update conversation
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
        },
      });

      return message;
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`);
      throw new BadRequestException('Failed to send message');
    }
  }

  private async getOrCreateContact(organizationId: string, whatsappId: string) {
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
          phoneNumber: whatsappId.replace('@c.us', ''),
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
}
