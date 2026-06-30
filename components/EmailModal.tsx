'use client'
import { useState } from 'react'

interface Props {
  docId: string
  onClose: () => void
}

export function EmailModal({ docId, onClose }: Props) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSend() {
    setSending(true)
    await fetch(`/api/documents/${docId}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, message })
    })
    setSent(true)
    setSending(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-2xl p-6 w-96 space-y-4 shadow-xl">
        <h2 className="font-semibold text-lg">שלח מסמך במייל</h2>
        {sent ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-green-600">נשלח בהצלחה!</p>
            <button onClick={onClose} className="border rounded-lg px-4 py-2 text-sm">סגור</button>
          </div>
        ) : (
          <>
            <input placeholder="אל (מייל הרופא)" value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="נושא" value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="הודעה (אופציונלי)" value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
            <div className="flex gap-2">
              <button onClick={handleSend} disabled={!to || sending}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                {sending ? 'שולח...' : 'שלח'}
              </button>
              <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm">בטל</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
