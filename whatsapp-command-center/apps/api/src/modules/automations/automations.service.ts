import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { CreateAutomationDto, UpdateAutomationDto } from './dto';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('automations') private automationQueue: Queue,
  ) {}

  async create(organizationId: string, dto: CreateAutomationDto) {
    return this.prisma.automation.create({
      data: {
        organizationId,
        ...dto,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.automation.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const automation = await this.prisma.automation.findFirst({
      where: { id, organizationId },
      include: {
        executions: {
          take: 10,
          orderBy: { executedAt: 'desc' },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
    });

    if (!automation) {
      throw new NotFoundException('Automation not found');
    }

    return automation;
  }

  async update(id: string, organizationId: string, dto: UpdateAutomationDto) {
    const automation = await this.findOne(id, organizationId);

    return this.prisma.automation.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, organizationId: string) {
    const automation = await this.findOne(id, organizationId);

    await this.prisma.automation.delete({
      where: { id },
    });

    return { success: true, message: 'Automation deleted successfully' };
  }

  async toggle(id: string, organizationId: string) {
    const automation = await this.findOne(id, organizationId);

    return this.prisma.automation.update({
      where: { id },
      data: {
        enabled: !automation.enabled,
      },
    });
  }

  async execute(automationId: string, context: any) {
    const automation = await this.prisma.automation.findUnique({
      where: { id: automationId },
    });

    if (!automation || !automation.enabled) {
      return;
    }

    // Add to queue for processing
    await this.automationQueue.add('execute', {
      automationId,
      context,
    });
  }

  async getStats(organizationId: string) {
    const [total, active, totalExecutions] = await Promise.all([
      this.prisma.automation.count({ where: { organizationId } }),
      this.prisma.automation.count({
        where: { organizationId, enabled: true },
      }),
      this.prisma.automationExecution.count({
        where: { automation: { organizationId } },
      }),
    ]);

    return { total, active, totalExecutions };
  }
}
