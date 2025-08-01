"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export function SessionTimeoutWarning() {
  const { data: session } = useSession()
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!session) return

    const checkSessionExpiry = () => {
      const now = Math.floor(Date.now() / 1000)
      const sessionExpiry = (session as any).expires ? Math.floor(new Date((session as any).expires).getTime() / 1000) : 0
      const timeRemaining = sessionExpiry - now

      // Show warning when 5 minutes (300 seconds) are left
      if (timeRemaining <= 300 && timeRemaining > 0) {
        setTimeLeft(timeRemaining)
        setShowWarning(true)
      } else if (timeRemaining <= 0) {
        // Session expired - force reload to redirect to signin
        window.location.reload()
      }
    }

    const interval = setInterval(checkSessionExpiry, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [session])

  const extendSession = async () => {
    // Refresh the session by making a request
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      setShowWarning(false)
      window.location.reload() // Refresh to get new session
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in {formatTime(timeLeft)}. Would you like to extend your session?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setShowWarning(false)}>
            Sign Out
          </Button>
          <AlertDialogAction onClick={extendSession}>
            Extend Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
