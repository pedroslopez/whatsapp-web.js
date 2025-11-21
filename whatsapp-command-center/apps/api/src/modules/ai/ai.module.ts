import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { CustomProvider } from './providers/custom.provider';
import { ProviderFactory } from './provider.factory';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    OpenAIProvider,
    AnthropicProvider,
    GeminiProvider,
    CustomProvider,
    ProviderFactory,
  ],
  exports: [AiService],
})
export class AiModule {}
