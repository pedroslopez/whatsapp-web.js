import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../database/prisma.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async create(organizationId: string, dto: CreateWebhookDto) {
    const secret = dto.secret || this.generateSecret();

    return this.prisma.webhook.create({
      data: {
        organizationId,
        ...dto,
        secret,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.webhook.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, organizationId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  async update(id: string, organizationId: string, dto: UpdateWebhookDto) {
    const webhook = await this.findOne(id, organizationId);

    return this.prisma.webhook.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, organizationId: string) {
    const webhook = await this.findOne(id, organizationId);

    await this.prisma.webhook.delete({
      where: { id },
    });

    return { success: true, message: 'Webhook deleted successfully' };
  }

  async trigger(organizationId: string, event: string, data: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        organizationId,
        enabled: true,
        events: {
          has: event,
        },
      },
    });

    for (const webhook of webhooks) {
      await this.sendWebhook(webhook, event, data);
    }
  }

  private async sendWebhook(webhook: any, event: string, data: any) {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const signature = this.generateSignature(payload, webhook.secret);

    try {
      const response = await firstValueFrom(
        this.httpService.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
          },
          timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '5000'),
        }),
      );

      this.logger.log(`Webhook sent successfully: ${webhook.id} - ${event}`);

      return { success: true, status: response.status };
    } catch (error) {
      this.logger.error(`Webhook failed: ${webhook.id} - ${error.message}`);

      // Could implement retry logic here
      return { success: false, error: error.message };
    }
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  async testWebhook(id: string, organizationId: string) {
    const webhook = await this.findOne(id, organizationId);

    const result = await this.sendWebhook(webhook, 'test', {
      message: 'This is a test webhook',
    });

    return result;
  }
}
