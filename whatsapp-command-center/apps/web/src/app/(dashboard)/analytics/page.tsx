'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, MessageSquare, Users, Zap, Clock } from 'lucide-react'
import { analyticsService } from '@/services/api.service'
import { toast } from 'sonner'

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>({})
  const [topAutomations, setTopAutomations] = useState<any[]>([])
  const [teamPerformance, setTeamPerformance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      const [overviewData, automationsData, teamData] = await Promise.all([
        analyticsService.getOverview().catch(() => ({})),
        analyticsService.getTopAutomations().catch(() => []),
        analyticsService.getTeamPerformance().catch(() => []),
      ])

      setOverview(overviewData)
      setTopAutomations(automationsData)
      setTeamPerformance(teamData)
    } catch (error: any) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  const metrics = [
    {
      label: 'Total Messages',
      value: (overview.totalMessages || 0).toLocaleString(),
      change: overview.messagesChange || '+0%',
      trend: overview.messagesChange?.startsWith('+') ? 'up' : 'down',
      icon: MessageSquare
    },
    {
      label: 'Active Users',
      value: (overview.activeUsers || 0).toLocaleString(),
      change: overview.usersChange || '+0%',
      trend: overview.usersChange?.startsWith('+') ? 'up' : 'down',
      icon: Users
    },
    {
      label: 'Automations Run',
      value: (overview.automationsRun || 0).toLocaleString(),
      change: overview.automationsChange || '+0%',
      trend: overview.automationsChange?.startsWith('+') ? 'up' : 'down',
      icon: Zap
    },
    {
      label: 'Avg Response Time',
      value: overview.avgResponseTime || '0m',
      change: overview.responseTimeChange || '-0%',
      trend: overview.responseTimeChange?.startsWith('-') ? 'up' : 'down',
      icon: Clock
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track your performance and insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.label}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className={`text-xs flex items-center gap-1 mt-1 ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {metric.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Message Volume</CardTitle>
            <CardDescription>Messages sent and received over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart: Message Volume Over Time</p>
                <p className="text-sm text-gray-400 mt-1">
                  (Connect with Recharts library)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
            <CardDescription>Average response time by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart: Response Times</p>
                <p className="text-sm text-gray-400 mt-1">
                  (Connect with Recharts library)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Automations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Automations</CardTitle>
            <CardDescription>Most executed automations</CardDescription>
          </CardHeader>
          <CardContent>
            {topAutomations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No automation data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topAutomations.slice(0, 4).map((auto, i) => (
                  <div key={auto.id || i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium">{auto.name}</p>
                        <p className="text-xs text-gray-500">{(auto.executionCount || 0).toLocaleString()} executions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{auto.successRate || 0}%</p>
                      <p className="text-xs text-gray-500">Success</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Agent response metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {teamPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No team performance data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamPerformance.slice(0, 4).map((agent, i) => (
                  <div key={agent.id || i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {agent.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{agent.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{(agent.messageCount || 0).toLocaleString()} messages</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{agent.avgResponseTime || '0m'}</p>
                      <p className="text-xs text-gray-500">Avg time</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
