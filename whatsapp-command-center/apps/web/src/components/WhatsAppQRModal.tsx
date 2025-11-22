'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { whatsappService } from '@/services/api.service'
import { toast } from 'sonner'
import { Loader2, CheckCircle, QrCode } from 'lucide-react'

interface WhatsAppQRModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function WhatsAppQRModal({ open, onOpenChange, onSuccess }: WhatsAppQRModalProps) {
  const [sessionName, setSessionName] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'generating' | 'waiting' | 'success'>('idle')
  const [loading, setLoading] = useState(false)

  const handleInitializeSession = async () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a session name')
      return
    }

    try {
      setLoading(true)
      setStatus('generating')

      // Initialize WhatsApp session
      const response = await whatsappService.initSession({
        name: sessionName,
      })

      // Get QR code
      if (response.qrCode) {
        setQrCode(response.qrCode)
        setStatus('waiting')

        // Start polling for connection status
        pollConnectionStatus(response.id)
      } else if (response.status === 'CONNECTED') {
        setStatus('success')
        toast.success('WhatsApp connected successfully!')
        setTimeout(() => {
          onSuccess()
          handleClose()
        }, 2000)
      }
    } catch (error: any) {
      console.error('Failed to initialize WhatsApp session:', error)
      toast.error(error.response?.data?.message || 'Failed to initialize WhatsApp session')
      setStatus('idle')
    } finally {
      setLoading(false)
    }
  }

  const pollConnectionStatus = async (sessionId: string) => {
    const maxAttempts = 60 // 5 minutes (5 seconds interval)
    let attempts = 0

    const poll = setInterval(async () => {
      try {
        const session = await whatsappService.getSession(sessionId)

        if (session.currentStatus === 'CONNECTED') {
          clearInterval(poll)
          setStatus('success')
          toast.success('WhatsApp connected successfully!')
          setTimeout(() => {
            onSuccess()
            handleClose()
          }, 2000)
        } else if (session.currentStatus === 'DISCONNECTED' || session.currentStatus === 'FAILED') {
          clearInterval(poll)
          toast.error('Connection failed. Please try again.')
          setStatus('idle')
          setQrCode('')
        }

        attempts++
        if (attempts >= maxAttempts) {
          clearInterval(poll)
          toast.error('Connection timeout. Please try again.')
          setStatus('idle')
          setQrCode('')
        }
      } catch (error) {
        clearInterval(poll)
        console.error('Failed to check connection status:', error)
      }
    }, 5000) // Poll every 5 seconds
  }

  const handleClose = () => {
    setSessionName('')
    setQrCode('')
    setStatus('idle')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect WhatsApp</DialogTitle>
          <DialogDescription>
            Scan the QR code with your WhatsApp mobile app to connect
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {status === 'idle' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sessionName">Session Name</Label>
                <Input
                  id="sessionName"
                  placeholder="My WhatsApp Account"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleInitializeSession}
                className="w-full"
                disabled={loading || !sessionName.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </>
          )}

          {status === 'generating' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-gray-500">Generating QR code...</p>
            </div>
          )}

          {status === 'waiting' && qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <img
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64"
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Scan with WhatsApp</p>
                <ol className="text-xs text-gray-500 space-y-1 text-left max-w-xs">
                  <li>1. Open WhatsApp on your phone</li>
                  <li>2. Tap Menu or Settings</li>
                  <li>3. Tap Linked Devices</li>
                  <li>4. Tap Link a Device</li>
                  <li>5. Point your phone at this screen to scan the code</li>
                </ol>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for scan...
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-lg font-medium text-green-600">Connected Successfully!</p>
              <p className="text-sm text-gray-500 mt-2">Your WhatsApp account is now connected</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
