'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usersService } from '@/services/api.service'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'

interface InviteTeamMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InviteTeamMemberModal({ open, onOpenChange, onSuccess }: InviteTeamMemberModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'MEMBER',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email.trim() || !formData.name.trim()) {
      toast.error('Please enter email and name')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setLoading(true)

      // Create user invitation
      await usersService.create({
        email: formData.email,
        name: formData.name,
        role: formData.role,
      })

      toast.success(`Invitation sent to ${formData.email}`)
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Failed to invite team member:', error)
      toast.error(error.response?.data?.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      email: '',
      name: '',
      role: 'MEMBER',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
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
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={loading}
            >
              <option value="ADMIN">Admin - Full access</option>
              <option value="MEMBER">Member - Standard access</option>
              <option value="VIEWER">Viewer - Read-only access</option>
            </select>
            <p className="text-xs text-gray-500">
              Role determines what actions this user can perform
            </p>
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
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
