'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Send, Paperclip, MoreVertical, Phone, Video, User, Check, CheckCheck, UserPlus, Image as ImageIcon, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { conversationsService, messagesService, whatsappService, usersService } from '@/services/api.service'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadConversations()
    loadSessions()
    loadTeamMembers()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      markAsRead(selectedConversation.id)
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const data = await conversationsService.getAll({ search: searchQuery })
      setConversations(data)
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0])
      }
    } catch (error: any) {
      console.error('Failed to load conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async () => {
    try {
      const data = await whatsappService.getAllSessions()
      setSessions(data.filter((s: any) => s.currentStatus === 'CONNECTED'))
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const loadTeamMembers = async () => {
    try {
      const data = await usersService.getAll()
      setTeamMembers(data)
    } catch (error) {
      console.error('Failed to load team members:', error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await messagesService.getByConversation(conversationId, { limit: 50 })
      setMessages(data.reverse()) // Reverse to show oldest first
    } catch (error: any) {
      console.error('Failed to load messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      await conversationsService.markAsRead(conversationId)
      // Update local state
      setConversations(prevConvs =>
        prevConvs.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return

    if (sessions.length === 0) {
      toast.error('No active WhatsApp session. Please connect WhatsApp in Settings.')
      return
    }

    try {
      setSendingMessage(true)
      const session = sessions[0] // Use first connected session

      await whatsappService.sendMessage(session.id, {
        to: selectedConversation.contact.whatsappId,
        message: messageText,
      })

      toast.success('Message sent!')
      setMessageText('')

      // Reload messages to show the sent message
      await loadMessages(selectedConversation.id)
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast.error(error.response?.data?.message || 'Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!selectedConversation) {
      toast.error('Please select a conversation first')
      return
    }

    if (sessions.length === 0) {
      toast.error('No active WhatsApp session. Please connect WhatsApp in Settings.')
      return
    }

    // Check file size (max 16MB for WhatsApp)
    if (file.size > 16 * 1024 * 1024) {
      toast.error('File size must be less than 16MB')
      return
    }

    try {
      setSendingMessage(true)
      const session = sessions[0]

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('to', selectedConversation.contact.whatsappId)

      await whatsappService.sendMedia(session.id, formData)

      toast.success('File sent successfully!')
      setSelectedFile(null)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Reload messages
      await loadMessages(selectedConversation.id)
    } catch (error: any) {
      console.error('Failed to send file:', error)
      toast.error(error.response?.data?.message || 'Failed to send file')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleAssignConversation = async (userId: string) => {
    if (!selectedConversation) return

    try {
      await conversationsService.assign(selectedConversation.id, userId)
      toast.success('Conversation assigned successfully')

      // Update local state
      setConversations(prevConvs =>
        prevConvs.map(c =>
          c.id === selectedConversation.id
            ? { ...c, assignedToId: userId }
            : c
        )
      )
      setSelectedConversation({ ...selectedConversation, assignedToId: userId })
    } catch (error: any) {
      console.error('Failed to assign conversation:', error)
      toast.error('Failed to assign conversation')
    }
  }

  const handleCallAction = (type: 'voice' | 'video') => {
    toast.info(`${type === 'voice' ? 'Voice' : 'Video'} calling requires WhatsApp Business API with calling capabilities`)
  }

  const filteredConversations = conversations.filter(conv =>
    conv.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contact?.phoneNumber?.includes(searchQuery)
  )

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SENT':
        return <Check className="h-3 w-3" />
      case 'DELIVERED':
        return <CheckCheck className="h-3 w-3" />
      case 'READ':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-gray-500">Loading conversations...</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <p className="text-gray-500 mb-4">No conversations yet</p>
        <p className="text-sm text-gray-400">Messages will appear here when you receive them</p>
      </div>
    )
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
                selectedConversation?.id === conv.id
                  ? 'bg-primary/5 border-l-4 border-l-primary'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">
                      {conv.contact?.name || conv.contact?.phoneNumber || 'Unknown'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {conv.lastMessageAt ? formatLastMessageTime(conv.lastMessageAt) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {conv.messages?.[0]?.body || 'No messages'}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full mt-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Message View */}
      {selectedConversation && (
        <Card className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium">
                  {selectedConversation.contact?.name || selectedConversation.contact?.phoneNumber}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedConversation.contact?.phoneNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleCallAction('voice')}>
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleCallAction('video')}>
                <Video className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Conversation Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-normal text-gray-500">Assign to</DropdownMenuLabel>
                  {teamMembers.length === 0 ? (
                    <DropdownMenuItem disabled>
                      No team members available
                    </DropdownMenuItem>
                  ) : (
                    teamMembers.map((member) => (
                      <DropdownMenuItem
                        key={member.id}
                        onClick={() => handleAssignConversation(member.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {member.name || member.email}
                        {selectedConversation.assignedToId === member.id && (
                          <Check className="h-4 w-4 ml-auto" />
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                No messages in this conversation
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg p-3',
                      msg.direction === 'OUTBOUND'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 dark:bg-gray-800'
                    )}
                  >
                    <p className="text-sm">{msg.body}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs opacity-70">
                        {formatTime(msg.timestamp)}
                      </span>
                      {msg.direction === 'OUTBOUND' && (
                        <span className="opacity-70">{getStatusIcon(msg.status)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
              />
              <Button variant="ghost" size="icon" onClick={handleAttachmentClick} disabled={sendingMessage}>
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={sendingMessage}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sendingMessage}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {sessions.length === 0 && (
              <p className="text-xs text-orange-500 mt-2">
                No active WhatsApp session. Connect WhatsApp in Settings to send messages.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
