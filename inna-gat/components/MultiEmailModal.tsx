'use client'
import { useState } from 'react'

interface Props {
  selectedIds: string[]
  selectedNames: string[]
  onClose: () => void
  onSent: () => void
}

export function MultiEmailModal({ selectedIds, selectedNames, onClose, onSent }: Props) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/email-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, to, subject, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'שגיאה בשליחה')
      } else {
        setSent(true)
        setTimeout(onSent, 1500)
      }
    } catch {
      setError('שגיאת רשת')
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-2xl p-6 w-96 space-y-4 shadow-xl">
        <h2 className="font-semibold text-lg">שליחת {selectedIds.length} מסמכים במייל</h2>

        {sent ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-green-600 text-lg">נשלח בהצלחה!</p>
            <p className="text-gray-400 text-sm">{selectedIds.length} קבצים נשלחו</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1 max-h-28 overflow-y-auto">
              {selectedNames.map((name, i) => <p key={i}>📎 {name}</p>)}
            </div>

            <input placeholder="אל (מייל)" value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="נושא" value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="הודעה (אופציונלי)" value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <div className="flex gap-2">
              <button onClick={handleSend} disabled={!to || sending}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                {sending ? 'שולח...' : `שלח ${selectedIds.length} קבצים`}
              </button>
              <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm">בטל</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
