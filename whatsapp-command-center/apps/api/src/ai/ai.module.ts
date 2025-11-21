/**
 * AI Module
 *
 * Handles AI integrations with multiple providers (OpenAI, Anthropic, Gemini, Custom)
 * Implements Strategy pattern for provider abstraction
 * Includes failover, caching, and cost tracking
 */

import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiOrchestratorService } from './ai-orchestrator.service';

// Providers
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { CustomProvider } from './providers/custom.provider';

// Dependencies
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [DatabaseModule, CacheModule, QueueModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiOrchestratorService,
    OpenAiProvider,
    AnthropicProvider,
    GeminiProvider,
    CustomProvider,
  ],
  exports: [AiService, AiOrchestratorService],
})
export class AiModule {}
