'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Users, Smartphone, Zap, Webhook, Key, Save } from 'lucide-react'
import { whatsappService, aiService, usersService, webhooksService, organizationService } from '@/services/api.service'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization')
  const [loading, setLoading] = useState(false)

  // Data states
  const [organization, setOrganization] = useState<any>({})
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [aiProviders, setAiProviders] = useState<any[]>([])
  const [webhooks, setWebhooks] = useState<any[]>([])

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
          // API keys would be loaded here
          break
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
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
                  <Input id="orgName" defaultValue="Acme Corporation" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgEmail">Billing Email</Label>
                  <Input id="orgEmail" type="email" defaultValue="billing@acme.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgPlan">Current Plan</Label>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">Professional</p>
                      <p className="text-sm text-gray-500">$99/month</p>
                    </div>
                    <Button variant="outline">Upgrade</Button>
                  </div>
                </div>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
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
                  <Button>Invite Member</Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading team members...</div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No team members yet</p>
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
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                            {member.role || 'Member'}
                          </span>
                          <Button variant="ghost" size="sm">Edit</Button>
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
                  <Button>Add Session</Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading WhatsApp sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="mb-4">No WhatsApp sessions connected</p>
                    <Button>Add Session</Button>
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
                          <Button variant="outline" size="sm">Disconnect</Button>
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
                <CardTitle>AI Providers</CardTitle>
                <CardDescription>Configure your AI providers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading AI providers...</div>
                ) : aiProviders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="mb-4">No AI providers configured</p>
                    <Button>Add Provider</Button>
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
                        <Button variant="outline" size="sm">Configure</Button>
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
                  <Button>Add Webhook</Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading webhooks...</div>
                ) : webhooks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Webhook className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="mb-4">No webhooks configured</p>
                    <Button>Add Webhook</Button>
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
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm" className="text-red-600">Delete</Button>
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
                  <Button>Create New Key</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Production API', key: 'wac_prod_***************', created: '2 months ago' },
                    { name: 'Development API', key: 'wac_dev_***************', created: '1 week ago' },
                  ].map((apiKey) => (
                    <div key={apiKey.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{apiKey.name}</p>
                        <p className="text-sm text-gray-500 font-mono">{apiKey.key}</p>
                        <p className="text-xs text-gray-400 mt-1">Created {apiKey.created}</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
