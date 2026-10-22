import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500 text-slate-900 text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 shadow-sm border-b border-amber-600/30"
    >
      <span>⚠️ Sie sind derzeit offline. Die angezeigten Umweltdaten stammen aus dem lokalen Zwischenspeicher.</span>
    </div>
  )
}
