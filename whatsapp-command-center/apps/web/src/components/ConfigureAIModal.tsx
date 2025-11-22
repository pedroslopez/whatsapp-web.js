'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { aiService } from '@/services/api.service'
import { toast } from 'sonner'
import { Loader2, Save, Zap } from 'lucide-react'

interface ConfigureAIModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  provider: any
}

export function ConfigureAIModal({ open, onOpenChange, onSuccess, provider }: ConfigureAIModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    providerType: 'openai',
    apiKey: '',
    model: '',
    enabled: true,
  })

  useEffect(() => {
    if (provider && open) {
      setFormData({
        name: provider.name || '',
        providerType: provider.providerType || 'openai',
        apiKey: provider.apiKey || '',
        model: provider.model || '',
        enabled: provider.enabled !== undefined ? provider.enabled : true,
      })
    } else if (!provider && open) {
      // New provider - reset form
      setFormData({
        name: '',
        providerType: 'openai',
        apiKey: '',
        model: '',
        enabled: true,
      })
    }
  }, [provider, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.apiKey.trim()) {
      toast.error('Please enter provider name and API key')
      return
    }

    try {
      setLoading(true)

      if (provider) {
        // Update existing provider
        await aiService.updateProvider(provider.id, {
          name: formData.name,
          apiKey: formData.apiKey,
          model: formData.model || undefined,
          enabled: formData.enabled,
        })
        toast.success('AI Provider updated successfully!')
      } else {
        // Create new provider
        await aiService.createProvider({
          name: formData.name,
          providerType: formData.providerType,
          apiKey: formData.apiKey,
          model: formData.model || undefined,
          enabled: formData.enabled,
        })
        toast.success('AI Provider created successfully!')
      }

      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Failed to save AI provider:', error)
      toast.error(error.response?.data?.message || 'Failed to save AI provider')
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
          <DialogTitle>{provider ? 'Configure AI Provider' : 'Add AI Provider'}</DialogTitle>
          <DialogDescription>
            {provider ? 'Update AI provider configuration' : 'Add a new AI provider for message automation'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Provider Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="My AI Provider"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          {!provider && (
            <div className="space-y-2">
              <Label htmlFor="providerType">Provider Type</Label>
              <select
                id="providerType"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                value={formData.providerType}
                onChange={(e) => setFormData({ ...formData, providerType: e.target.value })}
                disabled={loading}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google AI</option>
                <option value="huggingface">HuggingFace</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="apiKey">
              API Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500">
              Your API key will be stored securely
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model (Optional)</Label>
            <Input
              id="model"
              placeholder="gpt-4, claude-3-opus, etc."
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Leave empty to use the default model
            </p>
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
              Enable this provider
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
                  {provider ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  {provider ? <Save className="mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
                  {provider ? 'Save Changes' : 'Add Provider'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
