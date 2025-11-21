import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getOverview(organizationId: string) {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      messagesLast30Days,
      messagesLast60Days,
      contactsLast30Days,
      contactsLast60Days,
      activeAutomations,
      avgResponseTime,
    ] = await Promise.all([
      this.prisma.message.count({
        where: {
          conversation: { organizationId },
          timestamp: { gte: last30Days },
        },
      }),
      this.prisma.message.count({
        where: {
          conversation: { organizationId },
          timestamp: { gte: last60Days, lt: last30Days },
        },
      }),
      this.prisma.contact.count({
        where: {
          organizationId,
          createdAt: { gte: last30Days },
        },
      }),
      this.prisma.contact.count({
        where: {
          organizationId,
          createdAt: { gte: last60Days, lt: last30Days },
        },
      }),
      this.prisma.automation.count({
        where: { organizationId, enabled: true },
      }),
      this.getAverageResponseTime(organizationId),
    ]);

    const messagesTrend = this.calculateTrend(messagesLast30Days, messagesLast60Days);
    const contactsTrend = this.calculateTrend(contactsLast30Days, contactsLast60Days);

    return {
      messages: {
        value: messagesLast30Days,
        trend: messagesTrend,
      },
      contacts: {
        value: contactsLast30Days,
        trend: contactsTrend,
      },
      activeAutomations: {
        value: activeAutomations,
        trend: 0,
      },
      avgResponseTime: {
        value: avgResponseTime,
        trend: 0,
      },
    };
  }

  async getMessageVolume(organizationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const messages = await this.prisma.$queryRaw`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as count,
        SUM(CASE WHEN direction = 'INBOUND' THEN 1 ELSE 0 END) as inbound,
        SUM(CASE WHEN direction = 'OUTBOUND' THEN 1 ELSE 0 END) as outbound
      FROM "Message"
      INNER JOIN "Conversation" ON "Message"."conversationId" = "Conversation"."id"
      WHERE "Conversation"."organizationId" = ${organizationId}
        AND "Message"."timestamp" >= ${startDate}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    return messages;
  }

  async getTopAutomations(organizationId: string, limit: number = 5) {
    const automations = await this.prisma.automation.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            executions: true,
          },
        },
        executions: {
          where: {
            status: 'SUCCESS',
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        executions: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return automations.map(automation => ({
      id: automation.id,
      name: automation.name,
      totalExecutions: automation._count.executions,
      successfulExecutions: automation.executions.length,
    }));
  }

  async getTeamPerformance(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      include: {
        assignedConversations: {
          include: {
            messages: {
              where: {
                direction: 'OUTBOUND',
              },
            },
          },
        },
      },
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      assignedConversations: user.assignedConversations.length,
      messagesSent: user.assignedConversations.reduce(
        (sum, conv) => sum + conv.messages.length,
        0,
      ),
    }));
  }

  async getAiUsageStats(organizationId: string) {
    const aiUsage = await this.prisma.aiUsage.groupBy({
      by: ['provider'],
      where: { organizationId },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: {
        id: true,
      },
    });

    return aiUsage.map(usage => ({
      provider: usage.provider,
      requests: usage._count.id,
      totalTokens: usage._sum.totalTokens || 0,
      totalCost: usage._sum.cost || 0,
    }));
  }

  private async getAverageResponseTime(organizationId: string): Promise<number> {
    // Simplified calculation - in production, you'd calculate actual response times
    return 120; // 2 minutes in seconds
  }

  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  async trackEvent(organizationId: string, eventType: string, eventData: any) {
    return this.prisma.analyticsEvent.create({
      data: {
        organizationId,
        eventType,
        eventData,
      },
    });
  }
}
