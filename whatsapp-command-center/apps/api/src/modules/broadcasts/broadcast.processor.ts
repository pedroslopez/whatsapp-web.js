import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../database/prisma.service';

@Processor('broadcasts')
export class BroadcastProcessor {
  private readonly logger = new Logger(BroadcastProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('send')
  async handleSend(job: Job<{ broadcastId: string }>) {
    const { broadcastId } = job.data;

    this.logger.log(`Processing broadcast: ${broadcastId}`);

    const broadcast = await this.prisma.broadcast.findUnique({
      where: { id: broadcastId },
      include: {
        recipients: {
          include: {
            contact: true,
          },
        },
      },
    });

    if (!broadcast) {
      return;
    }

    try {
      // Send messages to all recipients
      for (const recipient of broadcast.recipients) {
        try {
          // Here you would integrate with WhatsApp to send the message
          // For now, just update the status

          await this.prisma.broadcastRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          });

          // Simulate delivery delay
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          this.logger.error(`Failed to send to recipient ${recipient.id}: ${error.message}`);

          await this.prisma.broadcastRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'FAILED',
              error: error.message,
            },
          });
        }
      }

      // Update broadcast status
      await this.prisma.broadcast.update({
        where: { id: broadcastId },
        data: {
          status: 'SENT',
          completedAt: new Date(),
        },
      });

      this.logger.log(`Broadcast completed: ${broadcastId}`);
    } catch (error) {
      this.logger.error(`Broadcast processing failed: ${broadcastId} - ${error.message}`);

      await this.prisma.broadcast.update({
        where: { id: broadcastId },
        data: {
          status: 'FAILED',
        },
      });
    }
  }
}
