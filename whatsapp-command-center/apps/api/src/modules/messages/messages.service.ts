import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private prisma: PrismaService) {}

  async findByConversation(conversationId: string, organizationId: string, query?: { limit?: number; offset?: number }) {
    // Verify conversation belongs to organization
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const limit = query?.limit || 50;
    const offset = query?.offset || 0;

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getStats(organizationId: string) {
    const [total, sent, received, aiGenerated] = await Promise.all([
      this.prisma.message.count({
        where: { conversation: { organizationId } },
      }),
      this.prisma.message.count({
        where: {
          conversation: { organizationId },
          direction: 'OUTBOUND',
        },
      }),
      this.prisma.message.count({
        where: {
          conversation: { organizationId },
          direction: 'INBOUND',
        },
      }),
      this.prisma.message.count({
        where: {
          conversation: { organizationId },
          isAiGenerated: true,
        },
      }),
    ]);

    return { total, sent, received, aiGenerated };
  }
}
