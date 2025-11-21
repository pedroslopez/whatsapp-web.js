import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSessionDto, SendMessageDto } from './dto';

@ApiTags('whatsapp')
@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new WhatsApp session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  async createSession(@Body() dto: CreateSessionDto, @Request() req) {
    return this.whatsappService.createSession(req.user.organizationId, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all WhatsApp sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getAllSessions(@Request() req) {
    return this.whatsappService.getAllSessions(req.user.organizationId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(@Param('id') id: string, @Request() req) {
    return this.whatsappService.getSession(id, req.user.organizationId);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete WhatsApp session' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async deleteSession(@Param('id') id: string, @Request() req) {
    return this.whatsappService.deleteSession(id, req.user.organizationId);
  }

  @Post('sessions/:id/send')
  @ApiOperation({ summary: 'Send a WhatsApp message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Session not connected or invalid request' })
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Request() req,
  ) {
    return this.whatsappService.sendMessage(id, req.user.organizationId, dto);
  }
}
