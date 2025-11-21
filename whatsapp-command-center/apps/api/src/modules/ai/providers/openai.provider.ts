import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { IAiProvider, AiProviderConfig, AiRequest, AiResponse } from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenAIProvider implements IAiProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private client: OpenAI;
  private config: AiProviderConfig;

  configure(config: AiProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    this.logger.log('Generating response with OpenAI');

    const messages: any[] = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    if (request.context && request.context.length > 0) {
      messages.push({
        role: 'system',
        content: `Context:\n${request.context.join('\n')}`,
      });
    }

    messages.push({
      role: 'user',
      content: request.prompt,
    });

    const response = await this.client.chat.completions.create({
      model: this.config.model || 'gpt-4',
      messages,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
    });

    const usage = response.usage!;

    return {
      text: response.choices[0].message.content || '',
      provider: 'openai',
      model: this.config.model || 'gpt-4',
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      cost: this.calculateCost(usage.prompt_tokens, usage.completion_tokens),
    };
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      this.logger.error(`OpenAI config validation failed: ${error.message}`);
      return false;
    }
  }

  private calculateCost(promptTokens: number, completionTokens: number): number {
    // GPT-4 pricing (example - update with actual pricing)
    const promptCost = (promptTokens / 1000) * 0.03;
    const completionCost = (completionTokens / 1000) * 0.06;
    return promptCost + completionCost;
  }
}
