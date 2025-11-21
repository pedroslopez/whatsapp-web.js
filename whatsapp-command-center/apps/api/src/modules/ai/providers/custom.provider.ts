import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IAiProvider, AiProviderConfig, AiRequest, AiResponse } from '../interfaces/ai-provider.interface';

@Injectable()
export class CustomProvider implements IAiProvider {
  private readonly logger = new Logger(CustomProvider.name);
  private config: AiProviderConfig;

  configure(config: AiProviderConfig) {
    this.config = config;
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    this.logger.log('Generating response with Custom LLM');

    if (!this.config.baseUrl) {
      throw new Error('Base URL is required for custom provider');
    }

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

    try {
      // OpenAI-compatible API format
      const response = await axios.post(
        `${this.config.baseUrl}/v1/chat/completions`,
        {
          model: this.config.model,
          messages,
          temperature: request.temperature ?? this.config.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? this.config.maxTokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        },
      );

      const data = response.data;
      const usage = data.usage || {};

      return {
        text: data.choices[0].message.content || '',
        provider: 'custom',
        model: this.config.model,
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
        },
        cost: 0, // Custom providers don't have standard pricing
      };
    } catch (error) {
      this.logger.error(`Custom LLM request failed: ${error.message}`);
      throw new Error('Failed to generate response from custom LLM');
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      await axios.get(`${this.config.baseUrl}/v1/models`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });
      return true;
    } catch (error) {
      this.logger.error(`Custom provider config validation failed: ${error.message}`);
      return false;
    }
  }
}
