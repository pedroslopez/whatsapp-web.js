import { Injectable } from '@nestjs/common';
import { IAiProvider } from './interfaces/ai-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { CustomProvider } from './providers/custom.provider';

@Injectable()
export class ProviderFactory {
  constructor(
    private openaiProvider: OpenAIProvider,
    private anthropicProvider: AnthropicProvider,
    private geminiProvider: GeminiProvider,
    private customProvider: CustomProvider,
  ) {}

  getProvider(type: string): IAiProvider {
    switch (type.toLowerCase()) {
      case 'openai':
        return this.openaiProvider;
      case 'anthropic':
        return this.anthropicProvider;
      case 'gemini':
        return this.geminiProvider;
      case 'custom':
        return this.customProvider;
      default:
        throw new Error(`Unknown AI provider type: ${type}`);
    }
  }
}
