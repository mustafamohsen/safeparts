import { createContext, useContext, type ReactNode } from 'react'
import { useLiveRegion, type AnnouncementType } from '../hooks/useLiveRegion'

interface LiveRegionContextValue {
  announce: (message: string, type?: AnnouncementType) => void
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null)

export function useAnnouncement() {
  const context = useContext(LiveRegionContext)
  if (!context) {
    throw new Error('useAnnouncement must be used within LiveRegionProvider')
  }
  return context
}

interface LiveRegionProviderProps {
  children: ReactNode
  announce: (message: string, type?: AnnouncementType) => void
}

export function LiveRegionProvider({ children, announce }: LiveRegionProviderProps) {
  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
    </LiveRegionContext.Provider>
  )
}
