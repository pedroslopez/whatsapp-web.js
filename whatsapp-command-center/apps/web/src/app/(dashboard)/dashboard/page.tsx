'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Users, Zap, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Messages',
      value: '12,453',
      change: '+12.5%',
      icon: MessageSquare,
      color: 'text-blue-600',
    },
    {
      title: 'Active Contacts',
      value: '2,345',
      change: '+5.2%',
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Automations',
      value: '24',
      change: '+2',
      icon: Zap,
      color: 'text-purple-600',
    },
    {
      title: 'Response Rate',
      value: '94.8%',
      change: '+2.1%',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back! Here's an overview of your WhatsApp Command Center.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-green-600 mt-1">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Your latest WhatsApp interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Customer {i}</p>
                    <p className="text-xs text-gray-500 truncate">Last message preview...</p>
                  </div>
                  <span className="text-xs text-gray-400">2m ago</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: 'New Broadcast', icon: MessageSquare },
              { label: 'Add Contact', icon: Users },
              { label: 'Create Automation', icon: Zap },
              { label: 'View Analytics', icon: TrendingUp },
            ].map((action) => (
              <button
                key={action.label}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <action.icon className="h-6 w-6 mb-2 text-primary" />
                <p className="text-sm font-medium">{action.label}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
