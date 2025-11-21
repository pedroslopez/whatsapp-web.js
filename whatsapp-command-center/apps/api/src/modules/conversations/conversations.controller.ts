import { Controller, Get, Patch, Body, Param, Query, Post, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateConversationDto } from './dto';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  async findAll(@Query() query, @Request() req) {
    return this.conversationsService.findAll(req.user.organizationId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get conversation statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Request() req) {
    return this.conversationsService.getStats(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.conversationsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update conversation' })
  @ApiResponse({ status: 200, description: 'Conversation updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateConversationDto, @Request() req) {
    return this.conversationsService.update(id, req.user.organizationId, dto);
  }

  @Post(':id/mark-read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  @ApiResponse({ status: 200, description: 'Conversation marked as read' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.conversationsService.markAsRead(id, req.user.organizationId);
  }
}
