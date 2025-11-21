import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProviderFactory } from './provider.factory';
import { CreateAiProviderDto, GenerateTextDto, UpdateAiProviderDto } from './dto';
import { AiRequest } from './interfaces/ai-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private providerFactory: ProviderFactory,
  ) {}

  async createProvider(organizationId: string, dto: CreateAiProviderDto) {
    this.logger.log(`Creating AI provider for organization: ${organizationId}`);

    // Validate provider configuration
    const provider = this.providerFactory.getProvider(dto.provider);
    provider.configure({
      apiKey: dto.apiKey,
      model: dto.model,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      baseUrl: dto.baseUrl,
    });

    const isValid = await provider.validateConfig();

    if (!isValid) {
      throw new BadRequestException('Invalid provider configuration');
    }

    return this.prisma.aiProvider.create({
      data: {
        organizationId,
        provider: dto.provider,
        apiKey: dto.apiKey,
        model: dto.model,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
        baseUrl: dto.baseUrl,
        enabled: true,
      },
    });
  }

  async getAllProviders(organizationId: string) {
    return this.prisma.aiProvider.findMany({
      where: { organizationId },
      select: {
        id: true,
        provider: true,
        model: true,
        temperature: true,
        maxTokens: true,
        baseUrl: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
        // Don't expose API keys
      },
    });
  }

  async getProvider(id: string, organizationId: string) {
    const provider = await this.prisma.aiProvider.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        provider: true,
        model: true,
        temperature: true,
        maxTokens: true,
        baseUrl: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('AI provider not found');
    }

    return provider;
  }

  async updateProvider(id: string, organizationId: string, dto: UpdateAiProviderDto) {
    const provider = await this.getProvider(id, organizationId);

    return this.prisma.aiProvider.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        provider: true,
        model: true,
        temperature: true,
        maxTokens: true,
        baseUrl: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteProvider(id: string, organizationId: string) {
    const provider = await this.getProvider(id, organizationId);

    await this.prisma.aiProvider.delete({
      where: { id },
    });

    return { success: true, message: 'AI provider deleted successfully' };
  }

  async generateText(providerId: string, organizationId: string, dto: GenerateTextDto) {
    const providerConfig = await this.prisma.aiProvider.findFirst({
      where: { id: providerId, organizationId },
    });

    if (!providerConfig) {
      throw new NotFoundException('AI provider not found');
    }

    if (!providerConfig.enabled) {
      throw new BadRequestException('AI provider is disabled');
    }

    const provider = this.providerFactory.getProvider(providerConfig.provider);
    provider.configure({
      apiKey: providerConfig.apiKey,
      model: providerConfig.model,
      temperature: providerConfig.temperature || undefined,
      maxTokens: providerConfig.maxTokens || undefined,
      baseUrl: providerConfig.baseUrl || undefined,
    });

    const request: AiRequest = {
      prompt: dto.prompt,
      context: dto.context,
      systemPrompt: dto.systemPrompt,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
    };

    try {
      const response = await provider.generate(request);

      // Log AI usage for analytics
      await this.prisma.aiUsage.create({
        data: {
          organizationId,
          providerId,
          provider: providerConfig.provider,
          model: providerConfig.model,
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          cost: response.cost || 0,
        },
      });

      return response;
    } catch (error) {
      this.logger.error(`AI generation failed: ${error.message}`);
      throw new BadRequestException('Failed to generate text');
    }
  }

  async getDefaultProvider(organizationId: string) {
    const provider = await this.prisma.aiProvider.findFirst({
      where: {
        organizationId,
        enabled: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!provider) {
      throw new NotFoundException('No enabled AI provider found');
    }

    return provider;
  }
}
