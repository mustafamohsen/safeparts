import { useState, useCallback } from 'react'

export type AnnouncementType = 'polite' | 'assertive'

export interface Announcement {
  id: string
  message: string
  type: AnnouncementType
}

/**
 * Hook for managing screen reader announcements via aria-live regions.
 * 
 * Use this for:
 * - Error messages
 * - Success feedback (copy, operation complete)
 * - Status updates that should be announced without moving focus
 */
export function useLiveRegion() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  const announce = useCallback((message: string, type: AnnouncementType = 'polite') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    const announcement: Announcement = { id, message, type }
    
    setAnnouncements(prev => [...prev, announcement])
    
    // Remove announcement after screen reader has had time to announce it
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    }, 1000)
  }, [])

  return { announcements, announce }
}
