'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Users, Smartphone, Zap, Webhook, Key, Save } from 'lucide-react'
import { whatsappService, aiService, usersService, webhooksService, organizationService, apiKeysService } from '@/services/api.service'
import { toast } from 'sonner'
import { WhatsAppQRModal } from '@/components/WhatsAppQRModal'
import { AddWebhookModal } from '@/components/AddWebhookModal'
import { EditWebhookModal } from '@/components/EditWebhookModal'
import { ConfigureAIModal } from '@/components/ConfigureAIModal'
import { InviteTeamMemberModal } from '@/components/InviteTeamMemberModal'
import { CreateAPIKeyModal } from '@/components/CreateAPIKeyModal'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization')
  const [loading, setLoading] = useState(false)

  // Modal states
  const [showQRModal, setShowQRModal] = useState(false)
  const [showAddWebhookModal, setShowAddWebhookModal] = useState(false)
  const [showEditWebhookModal, setShowEditWebhookModal] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null)
  const [showConfigureAIModal, setShowConfigureAIModal] = useState(false)
  const [selectedAIProvider, setSelectedAIProvider] = useState<any>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCreateAPIKeyModal, setShowCreateAPIKeyModal] = useState(false)

  // Data states
  const [organization, setOrganization] = useState<any>({})
  const [orgFormData, setOrgFormData] = useState({ name: '', email: '' })
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [aiProviders, setAiProviders] = useState<any[]>([])
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [apiKeys, setApiKeys] = useState<any[]>([])

  useEffect(() => {
    loadTabData(activeTab)
  }, [activeTab])

  const loadTabData = async (tab: string) => {
    try {
      setLoading(true)

      switch (tab) {
        case 'organization':
          const orgData = await organizationService.getStats().catch(() => ({}))
          setOrganization(orgData)
          break
        case 'team':
          const users = await usersService.getAll().catch(() => [])
          setTeamMembers(users)
          break
        case 'whatsapp':
          const sessionsData = await whatsappService.getAllSessions().catch(() => [])
          setSessions(sessionsData)
          break
        case 'ai':
          const providers = await aiService.getAllProviders().catch(() => [])
          setAiProviders(providers)
          break
        case 'integrations':
          const webhooksData = await webhooksService.getAll().catch(() => [])
          setWebhooks(webhooksData)
          break
        case 'api':
          const keysData = await apiKeysService.getAll().catch(() => [])
          setApiKeys(keysData)
          break
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppSessionSuccess = async () => {
    // Reload WhatsApp sessions after successful connection
    const sessionsData = await whatsappService.getAllSessions().catch(() => [])
    setSessions(sessionsData)
    toast.success('WhatsApp session connected successfully!')
  }

  const handleDisconnectSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp session?')) {
      return
    }

    try {
      await whatsappService.deleteSession(sessionId)
      toast.success('Session disconnected successfully')
      // Reload sessions
      const sessionsData = await whatsappService.getAllSessions().catch(() => [])
      setSessions(sessionsData)
    } catch (error: any) {
      console.error('Failed to disconnect session:', error)
      toast.error('Failed to disconnect session')
    }
  }

  const handleWebhookSuccess = async () => {
    // Reload webhooks after add/edit
    const webhooksData = await webhooksService.getAll().catch(() => [])
    setWebhooks(webhooksData)
  }

  const handleEditWebhook = (webhook: any) => {
    setSelectedWebhook(webhook)
    setShowEditWebhookModal(true)
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return
    }

    try {
      await webhooksService.delete(webhookId)
      toast.success('Webhook deleted successfully')
      // Reload webhooks
      const webhooksData = await webhooksService.getAll().catch(() => [])
      setWebhooks(webhooksData)
    } catch (error: any) {
      console.error('Failed to delete webhook:', error)
      toast.error('Failed to delete webhook')
    }
  }

  const handleAIProviderSuccess = async () => {
    // Reload AI providers after add/edit
    const providers = await aiService.getAllProviders().catch(() => [])
    setAiProviders(providers)
  }

  const handleConfigureAIProvider = (provider?: any) => {
    setSelectedAIProvider(provider || null)
    setShowConfigureAIModal(true)
  }

  const handleTeamMemberSuccess = async () => {
    const users = await usersService.getAll().catch(() => [])
    setTeamMembers(users)
  }

  const handleRemoveTeamMember = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from your organization?`)) {
      return
    }

    try {
      await usersService.delete(userId)
      toast.success('Team member removed successfully')
      const users = await usersService.getAll().catch(() => [])
      setTeamMembers(users)
    } catch (error: any) {
      console.error('Failed to remove team member:', error)
      toast.error('Failed to remove team member')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await usersService.update(userId, { role: newRole })
      toast.success('Role updated successfully')
      const users = await usersService.getAll().catch(() => [])
      setTeamMembers(users)
    } catch (error: any) {
      console.error('Failed to update role:', error)
      toast.error('Failed to update role')
    }
  }

  const handleAPIKeySuccess = async () => {
    const keysData = await apiKeysService.getAll().catch(() => [])
    setApiKeys(keysData)
  }

  const handleRevokeAPIKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to revoke "${keyName}"? This action cannot be undone and will immediately invalidate the key.`)) {
      return
    }

    try {
      await apiKeysService.revoke(keyId)
      toast.success('API key revoked successfully')
      const keysData = await apiKeysService.getAll().catch(() => [])
      setApiKeys(keysData)
    } catch (error: any) {
      console.error('Failed to revoke API key:', error)
      toast.error('Failed to revoke API key')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const handleSaveOrganization = async (data: any) => {
    try {
      setLoading(true)
      await organizationService.update(data)
      toast.success('Organization settings saved successfully')
      const orgData = await organizationService.getStats().catch(() => ({}))
      setOrganization(orgData)
    } catch (error: any) {
      console.error('Failed to save organization:', error)
      toast.error('Failed to save organization settings')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
    { id: 'ai', label: 'AI Providers', icon: Zap },
    { id: 'integrations', label: 'Integrations', icon: Webhook },
    { id: 'api', label: 'API Keys', icon: Key },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <Card className="lg:col-span-1">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'organization' && (
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Manage your organization details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgFormData.name}
                    onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                    placeholder="Acme Corporation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgEmail">Billing Email</Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    value={orgFormData.email}
                    onChange={(e) => setOrgFormData({ ...orgFormData, email: e.target.value })}
                    placeholder="billing@acme.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgPlan">Current Plan</Label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">{organization.plan || 'Professional'}</p>
                      <p className="text-sm text-gray-500">{organization.planPrice || '$99/month'}</p>
                    </div>
                    <Button variant="outline" disabled>Upgrade</Button>
                  </div>
                </div>
                <Button onClick={() => handleSaveOrganization(orgFormData)} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'team' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage who has access to your workspace</CardDescription>
                  </div>
                  <Button onClick={() => setShowInviteModal(true)}>Invite Member</Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading team members...</div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="mb-4">No team members yet</p>
                    <Button onClick={() => setShowInviteModal(true)}>Invite Your First Member</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary">
                            {member.name?.charAt(0) || member.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{member.name || 'Unnamed User'}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            className="px-2 py-1 text-xs border rounded bg-white dark:bg-gray-800"
                            value={member.role || 'MEMBER'}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Member</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleRemoveTeamMember(member.id, member.name || member.email)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'whatsapp' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>WhatsApp Sessions</CardTitle>
                    <CardDescription>Manage your connected WhatsApp accounts</CardDescription>
                  </div>
                  <Button onClick={() => setShowQRModal(true)}>Add Session</Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading WhatsApp sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="mb-4">No WhatsApp sessions connected</p>
                    <Button onClick={() => setShowQRModal(true)}>Add Session</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{session.name || 'WhatsApp Session'}</p>
                          <p className="text-sm text-gray-500">{session.phoneNumber || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            session.currentStatus === 'CONNECTED'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {session.currentStatus || 'Unknown'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnectSession(session.id)}
                          >
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'ai' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>AI Providers</CardTitle>
                    <CardDescription>Configure your AI providers</CardDescription>
                  </div>
                  <Button onClick={() => handleConfigureAIProvider()}>Add Provider</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading AI providers...</div>
                ) : aiProviders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="mb-4">No AI providers configured</p>
                    <Button onClick={() => handleConfigureAIProvider()}>Add Provider</Button>
                  </div>
                ) : (
                  aiProviders.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{provider.name || provider.providerType}</p>
                        <p className="text-sm text-gray-500">{provider.model || 'Default Model'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          provider.enabled || provider.isDefault
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {provider.enabled || provider.isDefault ? 'Enabled' : 'Disabled'}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => handleConfigureAIProvider(provider)}>Configure</Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Webhooks</CardTitle>
                    <CardDescription>Manage webhook integrations</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddWebhookModal(true)}>Add Webhook</Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading webhooks...</div>
                ) : webhooks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Webhook className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="mb-4">No webhooks configured</p>
                    <Button onClick={() => setShowAddWebhookModal(true)}>Add Webhook</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {webhooks.map((webhook) => (
                      <div key={webhook.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{webhook.name || 'Unnamed Webhook'}</h4>
                            <p className="text-sm text-gray-500 break-all">{webhook.url}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            webhook.enabled
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {webhook.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => handleEditWebhook(webhook)}>Edit</Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteWebhook(webhook.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'api' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>Manage API keys for external access</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateAPIKeyModal(true)}>Create New Key</Button>
                </div>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-12">
                    <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
                    <p className="text-gray-500 mb-4">Create your first API key to access the API programmatically</p>
                    <Button onClick={() => setShowCreateAPIKeyModal(true)}>
                      <Key className="h-4 w-4 mr-2" />
                      Create New Key
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{apiKey.name}</p>
                            {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
                              <Badge variant="destructive" className="text-xs">Expired</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 font-mono">
                            {apiKey.key ? apiKey.key.substring(0, 20) + '***************' : 'wac_***************'}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-400">
                            <span>Created {formatDate(apiKey.createdAt)}</span>
                            {apiKey.expiresAt && (
                              <span>
                                Expires {new Date(apiKey.expiresAt) < new Date() ? formatDate(apiKey.expiresAt) : new Date(apiKey.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleRevokeAPIKey(apiKey.id, apiKey.name)}
                        >
                          Revoke
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* WhatsApp QR Code Modal */}
      <WhatsAppQRModal
        open={showQRModal}
        onOpenChange={setShowQRModal}
        onSuccess={handleWhatsAppSessionSuccess}
      />

      {/* Webhook Modals */}
      <AddWebhookModal
        open={showAddWebhookModal}
        onOpenChange={setShowAddWebhookModal}
        onSuccess={handleWebhookSuccess}
      />

      <EditWebhookModal
        open={showEditWebhookModal}
        onOpenChange={setShowEditWebhookModal}
        onSuccess={handleWebhookSuccess}
        webhook={selectedWebhook}
      />

      {/* AI Provider Configuration Modal */}
      <ConfigureAIModal
        open={showConfigureAIModal}
        onOpenChange={setShowConfigureAIModal}
        onSuccess={handleAIProviderSuccess}
        provider={selectedAIProvider}
      />

      {/* Team Member Invite Modal */}
      <InviteTeamMemberModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onSuccess={handleTeamMemberSuccess}
      />

      {/* Create API Key Modal */}
      <CreateAPIKeyModal
        open={showCreateAPIKeyModal}
        onOpenChange={setShowCreateAPIKeyModal}
        onSuccess={handleAPIKeySuccess}
      />
    </div>
  )
}
