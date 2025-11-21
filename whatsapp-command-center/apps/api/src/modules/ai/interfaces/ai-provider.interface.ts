export interface AiProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
}

export interface AiRequest {
  prompt: string;
  context?: string[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiResponse {
  text: string;
  provider: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

export interface IAiProvider {
  generate(request: AiRequest): Promise<AiResponse>;
  validateConfig(): Promise<boolean>;
}
