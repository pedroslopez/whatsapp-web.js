'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Send, Calendar, Users, TrendingUp, Eye } from 'lucide-react'

const mockBroadcasts = [
  { id: 1, name: 'Summer Sale Announcement', status: 'sent', recipients: 1234, sent: 1200, delivered: 1150, read: 980, scheduledFor: null },
  { id: 2, name: 'New Product Launch', status: 'scheduled', recipients: 2500, sent: 0, delivered: 0, read: 0, scheduledFor: 'Tomorrow 10:00 AM' },
  { id: 3, name: 'Weekly Newsletter', status: 'draft', recipients: 3456, sent: 0, delivered: 0, read: 0, scheduledFor: null },
]

export default function BroadcastsPage() {
  const [broadcasts] = useState(mockBroadcasts)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Broadcasts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Send messages to multiple contacts at once
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Broadcast
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: '45.2K', icon: Send, color: 'text-blue-600' },
          { label: 'Delivered', value: '43.8K', icon: TrendingUp, color: 'text-green-600' },
          { label: 'Read Rate', value: '78.5%', icon: Eye, color: 'text-purple-600' },
          { label: 'Scheduled', value: '12', icon: Calendar, color: 'text-orange-600' },
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

      {/* Broadcasts List */}
      <div className="grid grid-cols-1 gap-4">
        {broadcasts.map((broadcast) => (
          <Card key={broadcast.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{broadcast.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(broadcast.status)}`}>
                      {broadcast.status}
                    </span>
                  </div>
                  {broadcast.scheduledFor && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Scheduled for: {broadcast.scheduledFor}
                    </p>
                  )}
                </div>
                <Button variant="outline">View Details</Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500">Recipients</p>
                  </div>
                  <p className="text-xl font-bold">{broadcast.recipients.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Send className="h-4 w-4 text-blue-500" />
                    <p className="text-xs text-gray-500">Sent</p>
                  </div>
                  <p className="text-xl font-bold">{broadcast.sent.toLocaleString()}</p>
                  {broadcast.sent > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((broadcast.sent / broadcast.recipients) * 100)}%
                    </p>
                  )}
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <p className="text-xs text-gray-500">Delivered</p>
                  </div>
                  <p className="text-xl font-bold">{broadcast.delivered.toLocaleString()}</p>
                  {broadcast.sent > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((broadcast.delivered / broadcast.sent) * 100)}%
                    </p>
                  )}
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Eye className="h-4 w-4 text-purple-500" />
                    <p className="text-xs text-gray-500">Read</p>
                  </div>
                  <p className="text-xl font-bold">{broadcast.read.toLocaleString()}</p>
                  {broadcast.delivered > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((broadcast.read / broadcast.delivered) * 100)}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
