import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { CreateBroadcastDto, UpdateBroadcastDto } from './dto';

@Injectable()
export class BroadcastsService {
  private readonly logger = new Logger(BroadcastsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('broadcasts') private broadcastQueue: Queue,
  ) {}

  async create(organizationId: string, dto: CreateBroadcastDto) {
    return this.prisma.broadcast.create({
      data: {
        organizationId,
        ...dto,
        status: 'DRAFT',
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.broadcast.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            recipients: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const broadcast = await this.prisma.broadcast.findFirst({
      where: { id, organizationId },
      include: {
        recipients: {
          include: {
            contact: true,
          },
        },
        _count: {
          select: {
            recipients: true,
          },
        },
      },
    });

    if (!broadcast) {
      throw new NotFoundException('Broadcast not found');
    }

    return broadcast;
  }

  async update(id: string, organizationId: string, dto: UpdateBroadcastDto) {
    const broadcast = await this.findOne(id, organizationId);

    return this.prisma.broadcast.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, organizationId: string) {
    const broadcast = await this.findOne(id, organizationId);

    await this.prisma.broadcast.delete({
      where: { id },
    });

    return { success: true, message: 'Broadcast deleted successfully' };
  }

  async send(id: string, organizationId: string) {
    const broadcast = await this.findOne(id, organizationId);

    if (broadcast.status !== 'DRAFT') {
      throw new Error('Broadcast has already been sent or scheduled');
    }

    // Update status to sending
    await this.prisma.broadcast.update({
      where: { id },
      data: {
        status: 'SENDING',
        sentAt: new Date(),
      },
    });

    // Add to queue for processing
    await this.broadcastQueue.add('send', {
      broadcastId: id,
    });

    return { success: true, message: 'Broadcast is being sent' };
  }

  async getStats(organizationId: string) {
    const broadcasts = await this.prisma.broadcast.findMany({
      where: { organizationId },
      include: {
        recipients: true,
      },
    });

    const totalSent = broadcasts.filter(b => b.status === 'SENT').length;
    const totalRecipients = broadcasts.reduce((sum, b) => sum + b.recipients.length, 0);
    const totalDelivered = broadcasts.reduce(
      (sum, b) => sum + b.recipients.filter(r => r.status === 'DELIVERED').length,
      0,
    );
    const totalRead = broadcasts.reduce(
      (sum, b) => sum + b.recipients.filter(r => r.status === 'READ').length,
      0,
    );

    return {
      total: broadcasts.length,
      sent: totalSent,
      scheduled: broadcasts.filter(b => b.status === 'SCHEDULED').length,
      totalRecipients,
      delivered: totalDelivered,
      read: totalRead,
      readRate: totalRecipients > 0 ? (totalRead / totalRecipients) * 100 : 0,
    };
  }
}
