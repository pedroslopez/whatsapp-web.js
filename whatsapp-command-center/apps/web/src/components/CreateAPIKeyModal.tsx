'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiKeysService } from '@/services/api.service'
import { toast } from 'sonner'
import { Loader2, Key, Copy, Check } from 'lucide-react'

interface CreateAPIKeyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateAPIKeyModal({ open, onOpenChange, onSuccess }: CreateAPIKeyModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    expiresIn: '365',
  })
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Please enter API key name')
      return
    }

    try {
      setLoading(true)

      const result = await apiKeysService.create({
        name: formData.name,
        expiresIn: parseInt(formData.expiresIn),
      })

      toast.success('API key created successfully!')
      setCreatedKey(result.key || result.apiKey)
    } catch (error: any) {
      console.error('Failed to create API key:', error)
      toast.error(error.response?.data?.message || 'Failed to create API key')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey)
      setCopied(true)
      toast.success('API key copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    if (createdKey) {
      onSuccess()
    }
    setFormData({
      name: '',
      expiresIn: '365',
    })
    setCreatedKey(null)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {createdKey ? 'API Key Created' : 'Create New API Key'}
          </DialogTitle>
          <DialogDescription>
            {createdKey
              ? 'Save this API key now. You won\'t be able to see it again!'
              : 'Create a new API key for programmatic access to your WhatsApp Command Center'}
          </DialogDescription>
        </DialogHeader>

        {!createdKey ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Key Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Production API Key"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500">
                A descriptive name to help you identify this key
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresIn">Expires In</Label>
              <select
                id="expiresIn"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                value={formData.expiresIn}
                onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                disabled={loading}
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
                <option value="0">Never</option>
              </select>
              <p className="text-xs text-gray-500">
                The API key will automatically expire after this period
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Create API Key
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                ⚠️ Important: Save this key now!
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                For security reasons, this key will only be displayed once. Make sure to copy and store it securely.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={createdKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done - I've saved my key
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
