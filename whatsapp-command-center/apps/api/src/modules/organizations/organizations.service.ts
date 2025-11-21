import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            whatsappSessions: true,
            contacts: true,
            conversations: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const organization = await this.findOne(id);

    return this.prisma.organization.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async getStats(organizationId: string) {
    const [
      totalUsers,
      totalSessions,
      totalContacts,
      totalConversations,
      totalMessages,
      activeAutomations,
      totalBroadcasts,
    ] = await Promise.all([
      this.prisma.user.count({ where: { organizationId } }),
      this.prisma.whatsAppSession.count({ where: { organizationId } }),
      this.prisma.contact.count({ where: { organizationId } }),
      this.prisma.conversation.count({ where: { organizationId } }),
      this.prisma.message.count({
        where: { conversation: { organizationId } },
      }),
      this.prisma.automation.count({
        where: { organizationId, enabled: true },
      }),
      this.prisma.broadcast.count({ where: { organizationId } }),
    ]);

    return {
      users: totalUsers,
      sessions: totalSessions,
      contacts: totalContacts,
      conversations: totalConversations,
      messages: totalMessages,
      activeAutomations,
      broadcasts: totalBroadcasts,
    };
  }
}
