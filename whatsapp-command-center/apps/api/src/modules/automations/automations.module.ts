import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { AutomationProcessor } from './automation.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'automations',
    }),
  ],
  controllers: [AutomationsController],
  providers: [AutomationsService, AutomationProcessor],
  exports: [AutomationsService],
})
export class AutomationsModule {}
