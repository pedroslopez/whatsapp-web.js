import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateConversationDto } from './dto';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query?: { status?: string; assignedTo?: string; search?: string }) {
    const where: any = { organizationId };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.assignedTo) {
      where.assignedToId = query.assignedTo;
    }

    if (query?.search) {
      where.contact = {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { phoneNumber: { contains: query.search } },
        ],
      };
    }

    return this.prisma.conversation.findMany({
      where,
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: true,
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, organizationId },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: true,
        session: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async update(id: string, organizationId: string, dto: UpdateConversationDto) {
    const conversation = await this.findOne(id, organizationId);

    return this.prisma.conversation.update({
      where: { id },
      data: dto,
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: true,
      },
    });
  }

  async markAsRead(id: string, organizationId: string) {
    const conversation = await this.findOne(id, organizationId);

    return this.prisma.conversation.update({
      where: { id },
      data: {
        unreadCount: 0,
      },
    });
  }

  async getStats(organizationId: string) {
    const [total, open, assigned, unread] = await Promise.all([
      this.prisma.conversation.count({ where: { organizationId } }),
      this.prisma.conversation.count({
        where: { organizationId, status: 'OPEN' },
      }),
      this.prisma.conversation.count({
        where: { organizationId, assignedToId: { not: null } },
      }),
      this.prisma.conversation.count({
        where: { organizationId, unreadCount: { gt: 0 } },
      }),
    ]);

    return { total, open, assigned, unread };
  }
}
