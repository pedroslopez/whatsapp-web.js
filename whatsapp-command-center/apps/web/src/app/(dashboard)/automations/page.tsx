'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Play, Pause, Edit, Trash, Copy, Zap, Clock, MessageSquare } from 'lucide-react'
import { automationsService } from '@/services/api.service'
import { toast } from 'sonner'

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, totalExecutions: 0, scheduled: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAutomations()
    loadStats()
  }, [])

  const loadAutomations = async () => {
    try {
      setLoading(true)
      const data = await automationsService.getAll()
      setAutomations(data)
    } catch (error: any) {
      console.error('Failed to load automations:', error)
      toast.error('Failed to load automations')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await automationsService.getStats()
      setStats({
        total: data.total || 0,
        active: data.active || 0,
        totalExecutions: data.totalExecutions || 0,
        scheduled: data.scheduled || 0,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const toggleStatus = async (id: string) => {
    try {
      await automationsService.toggle(id)
      toast.success('Automation status updated')
      await loadAutomations()
      await loadStats()
    } catch (error: any) {
      console.error('Failed to toggle automation:', error)
      toast.error('Failed to update automation status')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading automations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Automate your WhatsApp workflows
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Automations', value: stats.total, icon: Zap, color: 'text-purple-600' },
          { label: 'Active', value: stats.active, icon: Play, color: 'text-green-600' },
          { label: 'Total Executions', value: stats.totalExecutions.toLocaleString(), icon: MessageSquare, color: 'text-blue-600' },
          { label: 'Scheduled', value: stats.scheduled, icon: Clock, color: 'text-orange-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Automations List */}
      <div className="grid grid-cols-1 gap-4">
        {automations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
              <p className="text-gray-500 mb-4">Create your first automation to get started</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Automation
              </Button>
            </CardContent>
          </Card>
        ) : (
          automations.map((automation) => (
            <Card key={automation.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{automation.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          automation.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {automation.status?.toLowerCase() || 'inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Trigger</p>
                        <p className="font-medium">{automation.triggerType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Actions</p>
                        <p className="font-medium">{automation.actions?.length || 0} steps</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Executions</p>
                        <p className="font-medium">{(automation.executionCount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Last Run</p>
                        <p className="font-medium">{formatDate(automation.lastExecutedAt)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleStatus(automation.id)}
                    >
                      {automation.status === 'ACTIVE' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Start Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Templates</CardTitle>
          <CardDescription>Start with pre-built automation templates</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Welcome Message', desc: 'Greet new contacts automatically', icon: '👋' },
            { name: 'Order Confirmation', desc: 'Send order details instantly', icon: '📦' },
            { name: 'Support Ticket', desc: 'Auto-assign support requests', icon: '🎫' },
          ].map((template) => (
            <div
              key={template.name}
              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <div className="text-3xl mb-2">{template.icon}</div>
              <h4 className="font-medium mb-1">{template.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{template.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
