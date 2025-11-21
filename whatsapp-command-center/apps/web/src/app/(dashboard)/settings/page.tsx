'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Users, Smartphone, Zap, Webhook, Key, Save } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization')

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
                <div className="space-y-3">
                  {[
                    { name: 'John Doe', email: 'john@acme.com', role: 'Owner' },
                    { name: 'Sarah Johnson', email: 'sarah@acme.com', role: 'Admin' },
                    { name: 'Bob Wilson', email: 'bob@acme.com', role: 'Agent' },
                  ].map((member) => (
                    <div key={member.email} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                          {member.role}
                        </span>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="space-y-3">
                  {[
                    { name: 'Main Account', phone: '+1 (234) 567-8900', status: 'Connected' },
                    { name: 'Support Line', phone: '+1 (234) 567-8901', status: 'Connected' },
                  ].map((session) => (
                    <div key={session.phone} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{session.name}</p>
                        <p className="text-sm text-gray-500">{session.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                          {session.status}
                        </span>
                        <Button variant="outline" size="sm">Disconnect</Button>
                      </div>
                    </div>
                  ))}
                </div>
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
                {[
                  { name: 'OpenAI', model: 'GPT-4', enabled: true },
                  { name: 'Anthropic', model: 'Claude 3 Sonnet', enabled: true },
                  { name: 'Google', model: 'Gemini 1.5 Pro', enabled: false },
                  { name: 'Custom', model: 'Your API', enabled: false },
                ].map((provider) => (
                  <div key={provider.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-gray-500">{provider.model}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        provider.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {provider.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connect external services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Shopify', desc: 'E-commerce platform', status: 'Connected' },
                    { name: 'Google Sheets', desc: 'Spreadsheet integration', status: 'Not connected' },
                    { name: 'Zapier', desc: 'Workflow automation', status: 'Not connected' },
                    { name: 'Webhooks', desc: 'Custom webhooks', status: 'Connected' },
                  ].map((integration) => (
                    <div key={integration.name} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-1">{integration.name}</h4>
                      <p className="text-sm text-gray-500 mb-3">{integration.desc}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        {integration.status === 'Connected' ? 'Manage' : 'Connect'}
                      </Button>
                    </div>
                  ))}
                </div>
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
