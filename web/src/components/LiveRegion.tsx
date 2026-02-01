import type { Announcement } from '../hooks/useLiveRegion'

interface LiveRegionProps {
  announcements: Announcement[]
}

/**
 * Screen reader announcement component using aria-live regions.
 * 
 * This component renders invisible live regions that announce messages
 * to screen readers without moving focus.
 */
export function LiveRegion({ announcements }: LiveRegionProps) {
  const politeAnnouncements = announcements.filter(a => a.type === 'polite')
  const assertiveAnnouncements = announcements.filter(a => a.type === 'assertive')

  return (
    <>
      {/* Polite announcements - won't interrupt current speech */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncements.map(a => (
          <div key={a.id}>{a.message}</div>
        ))}
      </div>

      {/* Assertive announcements - will interrupt current speech */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncements.map(a => (
          <div key={a.id}>{a.message}</div>
        ))}
      </div>
    </>
  )
}
