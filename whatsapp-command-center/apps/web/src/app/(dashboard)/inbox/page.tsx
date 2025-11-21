'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Send, Paperclip, MoreVertical, Phone, Video, User, Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data
const mockConversations = [
  { id: 1, name: 'Sarah Johnson', lastMessage: 'Thanks for your help!', time: '2m ago', unread: 2, online: true },
  { id: 2, name: 'Tech Support Team', lastMessage: 'Your ticket has been resolved', time: '1h ago', unread: 0, online: false },
  { id: 3, name: 'John Smith', lastMessage: 'When can we schedule the meeting?', time: '3h ago', unread: 5, online: true },
  { id: 4, name: 'Marketing Campaign', lastMessage: 'New campaign analytics are ready', time: '1d ago', unread: 0, online: false },
  { id: 5, name: 'Alice Cooper', lastMessage: 'Perfect! See you tomorrow', time: '2d ago', unread: 0, online: true },
]

const mockMessages = [
  { id: 1, text: 'Hi there! I need help with my order', sent: false, time: '10:30 AM', status: 'read' },
  { id: 2, text: 'Hello! I\'d be happy to help. What\'s your order number?', sent: true, time: '10:31 AM', status: 'read' },
  { id: 3, text: 'It\'s #12345', sent: false, time: '10:32 AM', status: 'read' },
  { id: 4, text: 'Let me check that for you. One moment please.', sent: true, time: '10:33 AM', status: 'read' },
  { id: 5, text: 'I found your order! It\'s currently being processed and will ship tomorrow.', sent: true, time: '10:35 AM', status: 'delivered' },
  { id: 6, text: 'Thanks for your help!', sent: false, time: '10:36 AM', status: 'read' },
]

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0])
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // TODO: Send message via API
      console.log('Sending:', messageText)
      setMessageText('')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversation List */}
      <Card className="w-80 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={cn(
                'p-4 border-b cursor-pointer transition-colors',
                selectedConversation.id === conv.id
                  ? 'bg-primary/5 border-l-4 border-l-primary'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  {conv.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">{conv.name}</h3>
                    <span className="text-xs text-gray-500">{conv.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {conv.lastMessage}
                  </p>
                </div>
                {conv.unread > 0 && (
                  <div className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {conv.unread}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Message View */}
      <Card className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              {selectedConversation.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{selectedConversation.name}</h3>
              <p className="text-xs text-gray-500">
                {selectedConversation.online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.sent ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-lg px-4 py-2',
                  msg.sent
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800'
                )}
              >
                <p className="text-sm">{msg.text}</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <span className={cn(
                    'text-xs',
                    msg.sent ? 'text-white/70' : 'text-gray-500'
                  )}>
                    {msg.time}
                  </span>
                  {msg.sent && (
                    <span className="text-white/70">
                      {getStatusIcon(msg.status)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
