import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../database/prisma.service';

@Processor('automations')
export class AutomationProcessor {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('execute')
  async handleExecute(job: Job<{ automationId: string; context: any }>) {
    const { automationId, context } = job.data;

    this.logger.log(`Executing automation: ${automationId}`);

    const automation = await this.prisma.automation.findUnique({
      where: { id: automationId },
    });

    if (!automation || !automation.enabled) {
      return;
    }

    const startTime = Date.now();

    try {
      // Execute automation logic based on actions
      const actions = automation.actions as any[];

      for (const action of actions) {
        await this.executeAction(automation, action, context);
      }

      const executionTime = Date.now() - startTime;

      // Log successful execution
      await this.prisma.automationExecution.create({
        data: {
          automationId,
          status: 'SUCCESS',
          executionTime,
          context: context as any,
        },
      });

      this.logger.log(`Automation executed successfully: ${automationId}`);
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Log failed execution
      await this.prisma.automationExecution.create({
        data: {
          automationId,
          status: 'FAILED',
          executionTime,
          error: error.message,
          context: context as any,
        },
      });

      this.logger.error(`Automation execution failed: ${automationId} - ${error.message}`);
    }
  }

  private async executeAction(automation: any, action: any, context: any) {
    switch (action.type) {
      case 'send_message':
        // Implementation for sending message
        this.logger.debug(`Executing action: send_message`);
        break;
      case 'assign_conversation':
        // Implementation for assigning conversation
        this.logger.debug(`Executing action: assign_conversation`);
        break;
      case 'add_tag':
        // Implementation for adding tag
        this.logger.debug(`Executing action: add_tag`);
        break;
      case 'trigger_webhook':
        // Implementation for triggering webhook
        this.logger.debug(`Executing action: trigger_webhook`);
        break;
      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }
}
