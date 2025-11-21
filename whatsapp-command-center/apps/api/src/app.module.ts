import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';

// Core modules
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';

// WhatsApp modules
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';

// Feature modules
import { AutomationsModule } from './modules/automations/automations.module';
import { BroadcastsModule } from './modules/broadcasts/broadcasts.module';
import { AiModule } from './modules/ai/ai.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

// Gateway
import { EventsModule } from './modules/events/events.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Queue
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),

    // Core modules
    DatabaseModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,

    // WhatsApp modules
    WhatsAppModule,
    ContactsModule,
    ConversationsModule,
    MessagesModule,

    // Feature modules
    AutomationsModule,
    BroadcastsModule,
    AiModule,
    AnalyticsModule,
    WebhooksModule,

    // WebSocket
    EventsModule,
  ],
})
export class AppModule {}
