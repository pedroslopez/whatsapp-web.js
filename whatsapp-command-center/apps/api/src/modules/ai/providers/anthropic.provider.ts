import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { IAiProvider, AiProviderConfig, AiRequest, AiResponse } from '../interfaces/ai-provider.interface';

@Injectable()
export class AnthropicProvider implements IAiProvider {
  private readonly logger = new Logger(AnthropicProvider.name);
  private client: Anthropic;
  private config: AiProviderConfig;

  configure(config: AiProviderConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    this.logger.log('Generating response with Anthropic Claude');

    let systemPrompt = request.systemPrompt || '';

    if (request.context && request.context.length > 0) {
      systemPrompt += `\n\nContext:\n${request.context.join('\n')}`;
    }

    const response = await this.client.messages.create({
      model: this.config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: request.maxTokens ?? this.config.maxTokens ?? 1024,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
    });

    const usage = response.usage;
    const textContent = response.content.find(block => block.type === 'text');

    return {
      text: textContent ? (textContent as any).text : '',
      provider: 'anthropic',
      model: this.config.model || 'claude-3-5-sonnet-20241022',
      usage: {
        promptTokens: usage.input_tokens,
        completionTokens: usage.output_tokens,
        totalTokens: usage.input_tokens + usage.output_tokens,
      },
      cost: this.calculateCost(usage.input_tokens, usage.output_tokens),
    };
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error) {
      this.logger.error(`Anthropic config validation failed: ${error.message}`);
      return false;
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Claude pricing (example - update with actual pricing)
    const inputCost = (inputTokens / 1000000) * 3.0;
    const outputCost = (outputTokens / 1000000) * 15.0;
    return inputCost + outputCost;
  }
}
