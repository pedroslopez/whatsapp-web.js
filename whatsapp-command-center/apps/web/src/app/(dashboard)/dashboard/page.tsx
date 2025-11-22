'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Users, Zap, TrendingUp, Clock } from 'lucide-react'
import { organizationService, contactsService, messagesService, automationsService } from '@/services/api.service'
import { toast } from 'sonner'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMessages: 0,
    activeContacts: 0,
    activeAutomations: 0,
    avgResponseTime: '0m',
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const [orgStats, contactStats, messageStats, automationStats] = await Promise.all([
        organizationService.getStats(),
        contactsService.getStats(),
        messagesService.getStats(),
        automationsService.getStats(),
      ])

      setStats({
        totalMessages: messageStats.total || 0,
        activeContacts: contactStats.active || 0,
        activeAutomations: automationStats.active || 0,
        avgResponseTime: '2m 30s', // Simplified for now
      })
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Messages',
      value: loading ? '...' : stats.totalMessages.toLocaleString(),
      icon: MessageSquare,
      color: 'text-blue-600',
    },
    {
      title: 'Active Contacts',
      value: loading ? '...' : stats.activeContacts.toLocaleString(),
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Active Automations',
      value: loading ? '...' : stats.activeAutomations.toString(),
      icon: Zap,
      color: 'text-purple-600',
    },
    {
      title: 'Avg Response Time',
      value: loading ? '...' : stats.avgResponseTime,
      icon: Clock,
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
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/inbox"
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <MessageSquare className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-medium">View Inbox</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check your messages</p>
            </a>
            <a
              href="/dashboard/contacts"
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Users className="h-6 w-6 text-green-600 mb-2" />
              <h3 className="font-medium">Manage Contacts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">View and organize contacts</p>
            </a>
            <a
              href="/dashboard/automations"
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Zap className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium">Create Automation</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Set up automated workflows</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
