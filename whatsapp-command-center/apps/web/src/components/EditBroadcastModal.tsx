'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { broadcastsService } from '@/services/api.service'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface EditBroadcastModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  broadcast: any
}

export function EditBroadcastModal({ open, onOpenChange, onSuccess, broadcast }: EditBroadcastModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    scheduledFor: '',
    status: 'DRAFT',
  })

  useEffect(() => {
    if (broadcast && open) {
      setFormData({
        name: broadcast.name || '',
        message: broadcast.message || '',
        scheduledFor: broadcast.scheduledFor ? new Date(broadcast.scheduledFor).toISOString().slice(0, 16) : '',
        status: broadcast.status || 'DRAFT',
      })
    }
  }, [broadcast, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.message.trim()) {
      toast.error('Please enter broadcast name and message')
      return
    }

    try {
      setLoading(true)

      await broadcastsService.update(broadcast.id, {
        name: formData.name,
        message: formData.message,
        scheduledFor: formData.scheduledFor || undefined,
        status: formData.status,
      })

      toast.success('Broadcast updated successfully!')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Failed to update broadcast:', error)
      toast.error(error.response?.data?.message || 'Failed to update broadcast')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Broadcast</DialogTitle>
          <DialogDescription>
            Update your broadcast campaign details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Campaign Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Black Friday Sale"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="message"
              placeholder="Hi! We're having a special promotion..."
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 min-h-[150px]"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500">
              You can use variables like {'{name}'}, {'{phone}'}, {'{email}'}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formData.message.length} characters</span>
              <span>~{Math.ceil(formData.message.length / 160)} SMS segments</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledFor">Schedule for later (optional)</Label>
            <Input
              id="scheduledFor"
              type="datetime-local"
              value={formData.scheduledFor}
              onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={loading}
            >
              <option value="DRAFT">Save as draft</option>
              <option value="SCHEDULED">Schedule for sending</option>
              <option value="PENDING">Ready to send</option>
              <option value="SENT">Sent</option>
              <option value="COMPLETED">Completed</option>
            </select>
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
