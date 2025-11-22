'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { webhooksService } from '@/services/api.service'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface EditWebhookModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  webhook: any
}

export function EditWebhookModal({ open, onOpenChange, onSuccess, webhook }: EditWebhookModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: 'message.received',
    enabled: true,
  })

  useEffect(() => {
    if (webhook && open) {
      setFormData({
        name: webhook.name || '',
        url: webhook.url || '',
        events: webhook.events?.[0] || 'message.received',
        enabled: webhook.enabled !== undefined ? webhook.enabled : true,
      })
    }
  }, [webhook, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error('Please enter webhook name and URL')
      return
    }

    // Basic URL validation
    try {
      new URL(formData.url)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    try {
      setLoading(true)

      await webhooksService.update(webhook.id, {
        name: formData.name,
        url: formData.url,
        events: [formData.events],
        enabled: formData.enabled,
      })

      toast.success('Webhook updated successfully!')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Failed to update webhook:', error)
      toast.error(error.response?.data?.message || 'Failed to update webhook')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Webhook</DialogTitle>
          <DialogDescription>
            Update webhook configuration
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="My Webhook"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">
              Webhook URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/webhook"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500">
              Your server endpoint that will receive webhook events
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="events">Events</Label>
            <select
              id="events"
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
              value={formData.events}
              onChange={(e) => setFormData({ ...formData, events: e.target.value })}
              disabled={loading}
            >
              <option value="message.received">Message Received</option>
              <option value="message.sent">Message Sent</option>
              <option value="contact.created">Contact Created</option>
              <option value="all">All Events</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="enabled"
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              disabled={loading}
              className="w-4 h-4"
            />
            <Label htmlFor="enabled" className="cursor-pointer">
              Webhook enabled
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
