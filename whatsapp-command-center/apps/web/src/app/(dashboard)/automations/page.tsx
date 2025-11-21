'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Play, Pause, Edit, Trash, Copy, Zap, Clock, MessageSquare } from 'lucide-react'

const mockAutomations = [
  { id: 1, name: 'Welcome New Customers', status: 'active', trigger: 'New Contact', actions: 3, executions: 1234, lastRun: '2 min ago' },
  { id: 2, name: 'Follow-up After Purchase', status: 'active', trigger: 'Order Completed', actions: 2, executions: 567, lastRun: '1 hour ago' },
  { id: 3, name: 'Abandoned Cart Reminder', status: 'paused', trigger: 'Cart Inactive 24h', actions: 4, executions: 890, lastRun: '3 hours ago' },
  { id: 4, name: 'Birthday Wishes', status: 'active', trigger: 'Schedule Daily', actions: 1, executions: 45, lastRun: '1 day ago' },
]

export default function AutomationsPage() {
  const [automations, setAutomations] = useState(mockAutomations)

  const toggleStatus = (id: number) => {
    setAutomations(automations.map(auto =>
      auto.id === id
        ? { ...auto, status: auto.status === 'active' ? 'paused' : 'active' }
        : auto
    ))
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
          { label: 'Total Automations', value: '24', icon: Zap, color: 'text-purple-600' },
          { label: 'Active', value: '18', icon: Play, color: 'text-green-600' },
          { label: 'Total Executions', value: '12.5K', icon: MessageSquare, color: 'text-blue-600' },
          { label: 'Scheduled', value: '6', icon: Clock, color: 'text-orange-600' },
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
        {automations.map((automation) => (
          <Card key={automation.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{automation.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        automation.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {automation.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Trigger</p>
                      <p className="font-medium">{automation.trigger}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Actions</p>
                      <p className="font-medium">{automation.actions} steps</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Executions</p>
                      <p className="font-medium">{automation.executions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Last Run</p>
                      <p className="font-medium">{automation.lastRun}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleStatus(automation.id)}
                  >
                    {automation.status === 'active' ? (
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
        ))}
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
