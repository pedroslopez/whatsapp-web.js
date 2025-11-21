'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, MessageSquare, Users, Zap, Clock } from 'lucide-react'

export default function AnalyticsPage() {
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
        {[
          { label: 'Total Messages', value: '12,453', change: '+12.5%', trend: 'up', icon: MessageSquare },
          { label: 'Active Users', value: '2,345', change: '+5.2%', trend: 'up', icon: Users },
          { label: 'Automations Run', value: '1,567', change: '+8.1%', trend: 'up', icon: Zap },
          { label: 'Avg Response Time', value: '2.5m', change: '-15.3%', trend: 'down', icon: Clock },
        ].map((metric) => (
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
            <div className="space-y-3">
              {[
                { name: 'Welcome Message', executions: 1234, success: 98 },
                { name: 'Order Confirmation', executions: 890, success: 100 },
                { name: 'Follow-up Reminder', executions: 567, success: 95 },
                { name: 'Birthday Wishes', executions: 234, success: 99 },
              ].map((auto, i) => (
                <div key={auto.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium">{auto.name}</p>
                      <p className="text-xs text-gray-500">{auto.executions} executions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{auto.success}%</p>
                    <p className="text-xs text-gray-500">Success</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Agent response metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Sarah Johnson', messages: 234, avgTime: '1.2m', satisfaction: 4.8 },
                { name: 'John Smith', messages: 189, avgTime: '2.1m', satisfaction: 4.6 },
                { name: 'Alice Cooper', messages: 156, avgTime: '1.8m', satisfaction: 4.9 },
                { name: 'Bob Wilson', messages: 123, avgTime: '2.5m', satisfaction: 4.5 },
              ].map((agent, i) => (
                <div key={agent.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.messages} messages</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{agent.avgTime}</p>
                    <p className="text-xs text-gray-500">Avg time</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
