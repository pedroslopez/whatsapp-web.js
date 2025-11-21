'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Plus, Mail, Phone, Tag, MoreVertical, Edit, Trash, Download, Upload } from 'lucide-react'

// Mock data
const mockContacts = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1234567890', tags: ['Customer', 'VIP'], lastContact: '2 days ago' },
  { id: 2, name: 'John Smith', email: 'john@example.com', phone: '+1234567891', tags: ['Lead'], lastContact: '1 week ago' },
  { id: 3, name: 'Alice Cooper', email: 'alice@example.com', phone: '+1234567892', tags: ['Customer'], lastContact: '3 days ago' },
  { id: 4, name: 'Bob Wilson', email: 'bob@example.com', phone: '+1234567893', tags: ['Partner'], lastContact: '1 day ago' },
  { id: 5, name: 'Emma Davis', email: 'emma@example.com', phone: '+1234567894', tags: ['Customer', 'VIP'], lastContact: '5 hours ago' },
]

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState(mockContacts[0])

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your customer relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: '2,345', color: 'text-blue-600' },
          { label: 'Active', value: '1,234', color: 'text-green-600' },
          { label: 'New This Month', value: '156', color: 'text-purple-600' },
          { label: 'VIP', value: '45', color: 'text-orange-600' },
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
                <Input
                  placeholder="Search contacts..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedContact?.id === contact.id
                      ? 'bg-primary/5 border-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{contact.name}</h3>
                        <div className="flex gap-1">
                          {contact.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Last contact: {contact.lastContact}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedContact && (
              <>
                <div className="text-center pb-4 border-b">
                  <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {selectedContact.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{selectedContact.name}</h3>
                  <div className="flex gap-1 justify-center mt-2">
                    {selectedContact.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Email</Label>
                    <p className="text-sm">{selectedContact.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Phone</Label>
                    <p className="text-sm">{selectedContact.phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Last Contact</Label>
                    <p className="text-sm">{selectedContact.lastContact}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Recent Activity</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Message sent</span>
                      <span className="text-gray-500">2 days ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profile updated</span>
                      <span className="text-gray-500">1 week ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact created</span>
                      <span className="text-gray-500">3 weeks ago</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
