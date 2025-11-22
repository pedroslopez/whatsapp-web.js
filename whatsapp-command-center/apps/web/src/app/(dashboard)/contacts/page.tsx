'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Mail, Phone, Tag, Download, Upload } from 'lucide-react'
import { contactsService } from '@/services/api.service'
import { toast } from 'sonner'
import { AddContactModal } from '@/components/AddContactModal'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, newThisMonth: 0, vip: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadContacts()
    loadStats()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const data = await contactsService.getAll({ search: searchQuery })
      setContacts(data)
      if (data.length > 0 && !selectedContact) {
        setSelectedContact(data[0])
      }
    } catch (error) {
      console.error('Failed to load contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await contactsService.getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleContactAdded = async () => {
    // Reload contacts and stats after adding a new contact
    await loadContacts()
    await loadStats()
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber?.includes(searchQuery)
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading contacts...</p></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Import</Button>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />Add Contact
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: stats.total, color: 'text-blue-600' },
          { label: 'Active', value: stats.active, color: 'text-green-600' },
          { label: 'New This Month', value: stats.newThisMonth, color: 'text-purple-600' },
          { label: 'VIP', value: stats.vip, color: 'text-orange-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Contacts</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search contacts..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredContacts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchQuery ? 'No contacts found' : 'No contacts yet. Add your first contact to get started.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContacts.map((contact) => (
                  <div key={contact.id} onClick={() => setSelectedContact(contact)} className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedContact?.id === contact.id ? 'bg-primary/5 border-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{contact.name || contact.phoneNumber}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {contact.email && (<div className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</div>)}
                          {contact.phoneNumber && (<div className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phoneNumber}</div>)}
                        </div>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {contact.tags.map((tag: any) => (
                              <span key={tag.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                <Tag className="h-3 w-3 mr-1" />{tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{contact.lastContactedAt ? formatDate(contact.lastContactedAt) : 'Never'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Details */}
        {selectedContact && (
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">{(selectedContact.name || selectedContact.phoneNumber || '?')[0].toUpperCase()}</span>
                </div>
                <h3 className="text-xl font-semibold text-center">{selectedContact.name || selectedContact.phoneNumber}</h3>
              </div>
              <div className="space-y-3 pt-4 border-t">
                {selectedContact.email && (<div><Label className="text-xs text-gray-500">Email</Label><p className="text-sm">{selectedContact.email}</p></div>)}
                {selectedContact.phoneNumber && (<div><Label className="text-xs text-gray-500">Phone</Label><p className="text-sm">{selectedContact.phoneNumber}</p></div>)}
                {selectedContact.whatsappId && (<div><Label className="text-xs text-gray-500">WhatsApp ID</Label><p className="text-sm">{selectedContact.whatsappId}</p></div>)}
                {selectedContact.lastContactedAt && (<div><Label className="text-xs text-gray-500">Last Contact</Label><p className="text-sm">{formatDate(selectedContact.lastContactedAt)}</p></div>)}
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">Edit</Button>
                <Button variant="outline" className="flex-1">Delete</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Contact Modal */}
      <AddContactModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleContactAdded}
      />
    </div>
  )
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>
}
