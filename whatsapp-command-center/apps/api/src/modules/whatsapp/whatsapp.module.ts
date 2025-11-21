import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppGateway } from './whatsapp.gateway';
import { SessionManager } from './session.manager';

@Module({
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppGateway, SessionManager],
  exports: [WhatsAppService, SessionManager],
})
export class WhatsAppModule {}
