import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BroadcastsService } from './broadcasts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBroadcastDto, UpdateBroadcastDto } from './dto';

@ApiTags('broadcasts')
@Controller('broadcasts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BroadcastsController {
  constructor(private broadcastsService: BroadcastsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new broadcast' })
  @ApiResponse({ status: 201, description: 'Broadcast created successfully' })
  async create(@Body() dto: CreateBroadcastDto, @Request() req) {
    return this.broadcastsService.create(req.user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all broadcasts' })
  @ApiResponse({ status: 200, description: 'Broadcasts retrieved successfully' })
  async findAll(@Request() req) {
    return this.broadcastsService.findAll(req.user.organizationId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get broadcast statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Request() req) {
    return this.broadcastsService.getStats(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get broadcast by ID' })
  @ApiResponse({ status: 200, description: 'Broadcast retrieved successfully' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.broadcastsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update broadcast' })
  @ApiResponse({ status: 200, description: 'Broadcast updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateBroadcastDto, @Request() req) {
    return this.broadcastsService.update(id, req.user.organizationId, dto);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send broadcast' })
  @ApiResponse({ status: 200, description: 'Broadcast is being sent' })
  async send(@Param('id') id: string, @Request() req) {
    return this.broadcastsService.send(id, req.user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete broadcast' })
  @ApiResponse({ status: 200, description: 'Broadcast deleted successfully' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.broadcastsService.delete(id, req.user.organizationId);
  }
}
