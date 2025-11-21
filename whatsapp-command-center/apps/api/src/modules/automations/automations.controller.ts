import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AutomationsService } from './automations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAutomationDto, UpdateAutomationDto } from './dto';

@ApiTags('automations')
@Controller('automations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AutomationsController {
  constructor(private automationsService: AutomationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new automation' })
  @ApiResponse({ status: 201, description: 'Automation created successfully' })
  async create(@Body() dto: CreateAutomationDto, @Request() req) {
    return this.automationsService.create(req.user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all automations' })
  @ApiResponse({ status: 200, description: 'Automations retrieved successfully' })
  async findAll(@Request() req) {
    return this.automationsService.findAll(req.user.organizationId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get automation statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Request() req) {
    return this.automationsService.getStats(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get automation by ID' })
  @ApiResponse({ status: 200, description: 'Automation retrieved successfully' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.automationsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update automation' })
  @ApiResponse({ status: 200, description: 'Automation updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateAutomationDto, @Request() req) {
    return this.automationsService.update(id, req.user.organizationId, dto);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle automation enabled/disabled' })
  @ApiResponse({ status: 200, description: 'Automation toggled successfully' })
  async toggle(@Param('id') id: string, @Request() req) {
    return this.automationsService.toggle(id, req.user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete automation' })
  @ApiResponse({ status: 200, description: 'Automation deleted successfully' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.automationsService.delete(id, req.user.organizationId);
  }
}
