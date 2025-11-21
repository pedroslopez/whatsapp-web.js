import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview' })
  @ApiResponse({ status: 200, description: 'Overview retrieved successfully' })
  async getOverview(@Request() req) {
    return this.analyticsService.getOverview(req.user.organizationId);
  }

  @Get('message-volume')
  @ApiOperation({ summary: 'Get message volume over time' })
  @ApiResponse({ status: 200, description: 'Message volume retrieved successfully' })
  async getMessageVolume(@Query('days') days: string, @Request() req) {
    const daysNum = days ? parseInt(days) : 30;
    return this.analyticsService.getMessageVolume(req.user.organizationId, daysNum);
  }

  @Get('top-automations')
  @ApiOperation({ summary: 'Get top performing automations' })
  @ApiResponse({ status: 200, description: 'Top automations retrieved successfully' })
  async getTopAutomations(@Query('limit') limit: string, @Request() req) {
    const limitNum = limit ? parseInt(limit) : 5;
    return this.analyticsService.getTopAutomations(req.user.organizationId, limitNum);
  }

  @Get('team-performance')
  @ApiOperation({ summary: 'Get team performance metrics' })
  @ApiResponse({ status: 200, description: 'Team performance retrieved successfully' })
  async getTeamPerformance(@Request() req) {
    return this.analyticsService.getTeamPerformance(req.user.organizationId);
  }

  @Get('ai-usage')
  @ApiOperation({ summary: 'Get AI usage statistics' })
  @ApiResponse({ status: 200, description: 'AI usage stats retrieved successfully' })
  async getAiUsageStats(@Request() req) {
    return this.analyticsService.getAiUsageStats(req.user.organizationId);
  }
}
