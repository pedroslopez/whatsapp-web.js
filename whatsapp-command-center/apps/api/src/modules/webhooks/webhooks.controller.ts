import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWebhookDto, UpdateWebhookDto } from './dto';

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  async create(@Body() dto: CreateWebhookDto, @Request() req) {
    return this.webhooksService.create(req.user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhooks' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  async findAll(@Request() req) {
    return this.webhooksService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.webhooksService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateWebhookDto, @Request() req) {
    return this.webhooksService.update(id, req.user.organizationId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.webhooksService.delete(id, req.user.organizationId);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test webhook' })
  @ApiResponse({ status: 200, description: 'Webhook test sent' })
  async test(@Param('id') id: string, @Request() req) {
    return this.webhooksService.testWebhook(id, req.user.organizationId);
  }
}
