'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { automationsService } from '@/services/api.service'
import { toast } from 'sonner'
import { Loader2, Zap } from 'lucide-react'

interface CreateAutomationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateAutomationModal({ open, onOpenChange, onSuccess }: CreateAutomationModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'MESSAGE_RECEIVED',
    triggerConfig: {
      keyword: '',
    },
    actions: [
      {
        type: 'SEND_MESSAGE',
        config: {
          message: '',
        },
      },
    ],
    status: 'ACTIVE',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Please enter automation name')
      return
    }

    try {
      setLoading(true)

      await automationsService.create({
        name: formData.name,
        description: formData.description || undefined,
        triggerType: formData.triggerType,
        triggerConfig: formData.triggerConfig,
        actions: formData.actions,
        status: formData.status,
      })

      toast.success('Automation created successfully!')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Failed to create automation:', error)
      toast.error(error.response?.data?.message || 'Failed to create automation')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      triggerType: 'MESSAGE_RECEIVED',
      triggerConfig: {
        keyword: '',
      },
      actions: [
        {
          type: 'SEND_MESSAGE',
          config: {
            message: '',
          },
        },
      ],
      status: 'ACTIVE',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Automation</DialogTitle>
          <DialogDescription>
            Set up a new automation workflow to handle WhatsApp messages
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">
                Automation Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Welcome Message Automation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Send welcome message to new contacts"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Trigger Configuration */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Trigger</h3>

            <div className="space-y-2">
              <Label htmlFor="triggerType">When should this automation run?</Label>
              <select
                id="triggerType"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                value={formData.triggerType}
                onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                disabled={loading}
              >
                <option value="MESSAGE_RECEIVED">When message is received</option>
                <option value="KEYWORD">When keyword is detected</option>
                <option value="NEW_CONTACT">When new contact is created</option>
                <option value="SCHEDULED">On a schedule</option>
              </select>
            </div>

            {formData.triggerType === 'KEYWORD' && (
              <div className="space-y-2">
                <Label htmlFor="keyword">Trigger Keyword</Label>
                <Input
                  id="keyword"
                  placeholder="e.g., hello, help, info"
                  value={formData.triggerConfig.keyword}
                  onChange={(e) => setFormData({
                    ...formData,
                    triggerConfig: { ...formData.triggerConfig, keyword: e.target.value }
                  })}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Automation will trigger when message contains this keyword
                </p>
              </div>
            )}
          </div>

          {/* Action Configuration */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Action</h3>

            <div className="space-y-2">
              <Label htmlFor="actionType">What should happen?</Label>
              <select
                id="actionType"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                value={formData.actions[0].type}
                onChange={(e) => setFormData({
                  ...formData,
                  actions: [{ ...formData.actions[0], type: e.target.value }]
                })}
                disabled={loading}
              >
                <option value="SEND_MESSAGE">Send a message</option>
                <option value="ADD_TAG">Add a tag</option>
                <option value="ASSIGN_USER">Assign to team member</option>
                <option value="WEBHOOK">Call webhook</option>
              </select>
            </div>

            {formData.actions[0].type === 'SEND_MESSAGE' && (
              <div className="space-y-2">
                <Label htmlFor="message">Message to send</Label>
                <textarea
                  id="message"
                  placeholder="Hi! Thanks for reaching out. How can I help you today?"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 min-h-[100px]"
                  value={formData.actions[0].config.message}
                  onChange={(e) => setFormData({
                    ...formData,
                    actions: [{
                      ...formData.actions[0],
                      config: { ...formData.actions[0].config, message: e.target.value }
                    }]
                  })}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  You can use variables like {'{name}'}, {'{phone}'}, {'{email}'}
                </p>
              </div>
            )}

            {formData.actions[0].type === 'ADD_TAG' && (
              <div className="space-y-2">
                <Label htmlFor="tagName">Tag name</Label>
                <Input
                  id="tagName"
                  placeholder="new-customer"
                  value={formData.actions[0].config.tagName || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    actions: [{
                      ...formData.actions[0],
                      config: { ...formData.actions[0].config, tagName: e.target.value }
                    }]
                  })}
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                checked={formData.status === 'ACTIVE'}
                onChange={(e) => setFormData({
                  ...formData,
                  status: e.target.checked ? 'ACTIVE' : 'INACTIVE'
                })}
                disabled={loading}
                className="w-4 h-4"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Activate automation immediately
              </Label>
            </div>
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
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Create Automation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
