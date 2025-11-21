import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAiProvider, AiProviderConfig, AiRequest, AiResponse } from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements IAiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenerativeAI;
  private config: AiProviderConfig;

  configure(config: AiProviderConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    this.logger.log('Generating response with Google Gemini');

    const model = this.client.getGenerativeModel({
      model: this.config.model || 'gemini-pro',
    });

    let prompt = request.prompt;

    if (request.systemPrompt) {
      prompt = `${request.systemPrompt}\n\n${prompt}`;
    }

    if (request.context && request.context.length > 0) {
      prompt = `Context:\n${request.context.join('\n')}\n\n${prompt}`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Note: Gemini API doesn't provide detailed token usage in the same way
    // We'll estimate based on text length
    const estimatedPromptTokens = Math.ceil(prompt.length / 4);
    const estimatedCompletionTokens = Math.ceil(text.length / 4);

    return {
      text,
      provider: 'gemini',
      model: this.config.model || 'gemini-pro',
      usage: {
        promptTokens: estimatedPromptTokens,
        completionTokens: estimatedCompletionTokens,
        totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
      },
      cost: this.calculateCost(estimatedPromptTokens, estimatedCompletionTokens),
    };
  }

  async validateConfig(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model || 'gemini-pro',
      });
      await model.generateContent('test');
      return true;
    } catch (error) {
      this.logger.error(`Gemini config validation failed: ${error.message}`);
      return false;
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Gemini pricing (example - update with actual pricing)
    const inputCost = (inputTokens / 1000000) * 0.125;
    const outputCost = (outputTokens / 1000000) * 0.375;
    return inputCost + outputCost;
  }
}
