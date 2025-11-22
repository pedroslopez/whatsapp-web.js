'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Send, Calendar, Users, TrendingUp, Eye, Edit, Trash } from 'lucide-react'
import { broadcastsService } from '@/services/api.service'
import { toast } from 'sonner'
import { CreateBroadcastModal } from '@/components/CreateBroadcastModal'
import { EditBroadcastModal } from '@/components/EditBroadcastModal'

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [stats, setStats] = useState({ totalSent: 0, delivered: 0, readRate: 0, scheduled: 0 })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null)

  useEffect(() => {
    loadBroadcasts()
    loadStats()
  }, [])

  const loadBroadcasts = async () => {
    try {
      setLoading(true)
      const data = await broadcastsService.getAll()
      setBroadcasts(data)
    } catch (error: any) {
      console.error('Failed to load broadcasts:', error)
      toast.error('Failed to load broadcasts')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await broadcastsService.getStats()
      setStats({
        totalSent: data.totalSent || 0,
        delivered: data.delivered || 0,
        readRate: data.readRate || 0,
        scheduled: data.scheduled || 0,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleBroadcastSuccess = async () => {
    await loadBroadcasts()
    await loadStats()
  }

  const handleEditBroadcast = (broadcast: any) => {
    setSelectedBroadcast(broadcast)
    setShowEditModal(true)
  }

  const handleDeleteBroadcast = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await broadcastsService.delete(id)
      toast.success('Broadcast deleted successfully')
      await loadBroadcasts()
      await loadStats()
    } catch (error: any) {
      console.error('Failed to delete broadcast:', error)
      toast.error('Failed to delete broadcast')
    }
  }

  const handleSendBroadcast = async (id: string, name: string) => {
    if (!confirm(`Send broadcast "${name}" now? This will send messages to all recipients.`)) {
      return
    }

    try {
      await broadcastsService.send(id)
      toast.success('Broadcast sent successfully!')
      await loadBroadcasts()
      await loadStats()
    } catch (error: any) {
      console.error('Failed to send broadcast:', error)
      toast.error('Failed to send broadcast')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SENT':
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'SCHEDULED':
      case 'PENDING':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      case 'SENDING':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading broadcasts...</p>
      </div>
    )
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
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Broadcast
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: stats.totalSent.toLocaleString(), icon: Send, color: 'text-blue-600' },
          { label: 'Delivered', value: stats.delivered.toLocaleString(), icon: TrendingUp, color: 'text-green-600' },
          { label: 'Read Rate', value: `${stats.readRate.toFixed(1)}%`, icon: Eye, color: 'text-purple-600' },
          { label: 'Scheduled', value: stats.scheduled, icon: Calendar, color: 'text-orange-600' },
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
        {broadcasts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No broadcasts yet</h3>
              <p className="text-gray-500 mb-4">Create your first broadcast campaign to reach multiple contacts</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Broadcast
              </Button>
            </CardContent>
          </Card>
        ) : (
          broadcasts.map((broadcast) => (
            <Card key={broadcast.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{broadcast.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(broadcast.status)}`}>
                        {broadcast.status?.toLowerCase() || 'draft'}
                      </span>
                    </div>
                    {broadcast.scheduledFor && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Scheduled for: {new Date(broadcast.scheduledFor).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {(broadcast.status === 'DRAFT' || broadcast.status === 'PENDING') && (
                      <Button variant="default" size="sm" onClick={() => handleSendBroadcast(broadcast.id, broadcast.name)}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Now
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleEditBroadcast(broadcast)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteBroadcast(broadcast.id, broadcast.name)}>
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <p className="text-xs text-gray-500">Recipients</p>
                    </div>
                    <p className="text-xl font-bold">{(broadcast.totalRecipients || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Send className="h-4 w-4 text-blue-500" />
                      <p className="text-xs text-gray-500">Sent</p>
                    </div>
                    <p className="text-xl font-bold">{(broadcast.sentCount || 0).toLocaleString()}</p>
                    {broadcast.sentCount > 0 && broadcast.totalRecipients > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((broadcast.sentCount / broadcast.totalRecipients) * 100)}%
                      </p>
                    )}
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <p className="text-xs text-gray-500">Delivered</p>
                    </div>
                    <p className="text-xl font-bold">{(broadcast.deliveredCount || 0).toLocaleString()}</p>
                    {broadcast.sentCount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(((broadcast.deliveredCount || 0) / broadcast.sentCount) * 100)}%
                      </p>
                    )}
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <p className="text-xs text-gray-500">Read</p>
                    </div>
                    <p className="text-xl font-bold">{(broadcast.readCount || 0).toLocaleString()}</p>
                    {broadcast.deliveredCount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(((broadcast.readCount || 0) / broadcast.deliveredCount) * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Broadcast Modal */}
      <CreateBroadcastModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleBroadcastSuccess}
      />

      {/* Edit Broadcast Modal */}
      <EditBroadcastModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={handleBroadcastSuccess}
        broadcast={selectedBroadcast}
      />
    </div>
  )
}
