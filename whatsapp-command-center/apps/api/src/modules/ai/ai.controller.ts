import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAiProviderDto, GenerateTextDto, UpdateAiProviderDto } from './dto';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('providers')
  @ApiOperation({ summary: 'Create a new AI provider configuration' })
  @ApiResponse({ status: 201, description: 'AI provider created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid configuration' })
  async createProvider(@Body() dto: CreateAiProviderDto, @Request() req) {
    return this.aiService.createProvider(req.user.organizationId, dto);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get all AI providers' })
  @ApiResponse({ status: 200, description: 'AI providers retrieved successfully' })
  async getAllProviders(@Request() req) {
    return this.aiService.getAllProviders(req.user.organizationId);
  }

  @Get('providers/:id')
  @ApiOperation({ summary: 'Get AI provider by ID' })
  @ApiResponse({ status: 200, description: 'AI provider retrieved successfully' })
  @ApiResponse({ status: 404, description: 'AI provider not found' })
  async getProvider(@Param('id') id: string, @Request() req) {
    return this.aiService.getProvider(id, req.user.organizationId);
  }

  @Patch('providers/:id')
  @ApiOperation({ summary: 'Update AI provider' })
  @ApiResponse({ status: 200, description: 'AI provider updated successfully' })
  @ApiResponse({ status: 404, description: 'AI provider not found' })
  async updateProvider(
    @Param('id') id: string,
    @Body() dto: UpdateAiProviderDto,
    @Request() req,
  ) {
    return this.aiService.updateProvider(id, req.user.organizationId, dto);
  }

  @Delete('providers/:id')
  @ApiOperation({ summary: 'Delete AI provider' })
  @ApiResponse({ status: 200, description: 'AI provider deleted successfully' })
  @ApiResponse({ status: 404, description: 'AI provider not found' })
  async deleteProvider(@Param('id') id: string, @Request() req) {
    return this.aiService.deleteProvider(id, req.user.organizationId);
  }

  @Post('providers/:id/generate')
  @ApiOperation({ summary: 'Generate text using AI provider' })
  @ApiResponse({ status: 200, description: 'Text generated successfully' })
  @ApiResponse({ status: 400, description: 'Provider disabled or generation failed' })
  async generateText(
    @Param('id') id: string,
    @Body() dto: GenerateTextDto,
    @Request() req,
  ) {
    return this.aiService.generateText(id, req.user.organizationId, dto);
  }
}
