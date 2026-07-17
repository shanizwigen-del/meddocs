'use client'
import { useState, useEffect } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function InstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOS, setShowIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // בדיקה אם כבר מותקן
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (ios) {
      setIsIOS(true)
      const seen = localStorage.getItem('ios-install-seen')
      if (!seen) setShowIOS(true)
    }

    // Android / Desktop Chrome
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

  function dismissIOS() {
    localStorage.setItem('ios-install-seen', '1')
    setShowIOS(false)
  }

  if (dismissed) return null

  // Android/Desktop — כפתור התקנה
  if (installPrompt) {
    return (
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between gap-3" dir="rtl">
        <span className="text-sm font-medium">הוסיפי לשולחן העבודה לגישה מהירה</span>
        <div className="flex gap-2 shrink-0">
          <button onClick={install}
            className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold">
            התקיני
          </button>
          <button onClick={() => setDismissed(true)} className="text-blue-200 text-xs px-1">✕</button>
        </div>
      </div>
    )
  }

  // iOS — הוראות ידניות
  if (isIOS && showIOS) {
    return (
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 text-sm text-blue-800" dir="rtl">
        <div className="flex items-start justify-between gap-2">
          <p>
            להוספה למסך הבית: לחצי על{' '}
            <span className="font-semibold">שתף</span>{' '}
            ↑ ואז{' '}
            <span className="font-semibold">הוסף למסך הבית</span>
          </p>
          <button onClick={dismissIOS} className="text-blue-400 shrink-0 text-lg leading-none">✕</button>
        </div>
      </div>
    )
  }

  return null
}
