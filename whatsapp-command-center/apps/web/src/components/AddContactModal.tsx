'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { contactsService } from '@/services/api.service'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'

interface AddContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddContactModal({ open, onOpenChange, onSuccess }: AddContactModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    whatsappId: '',
    email: '',
    phone: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.whatsappId.trim()) {
      toast.error('Please enter at least name and WhatsApp ID')
      return
    }

    try {
      setLoading(true)

      await contactsService.create({
        name: formData.name,
        whatsappId: formData.whatsappId,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      })

      toast.success('Contact created successfully!')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Failed to create contact:', error)
      toast.error(error.response?.data?.message || 'Failed to create contact')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      whatsappId: '',
      email: '',
      phone: '',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Create a new contact to start messaging on WhatsApp
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappId">
              WhatsApp ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="whatsappId"
              placeholder="1234567890@c.us"
              value={formData.whatsappId}
              onChange={(e) => setFormData({ ...formData, whatsappId: e.target.value })}
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500">
              Format: phone_number@c.us (e.g., 1234567890@c.us)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={loading}
            />
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
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Contact
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
