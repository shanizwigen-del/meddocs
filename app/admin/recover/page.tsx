'use client'
import { useState } from 'react'

interface Orphan {
  url: string
  pathname: string
  size: number
  uploadedAt: string
}

interface Audit {
  totalBlobs: number
  thumbnails: number
  documentBlobs: number
  documentsInDb: number
  orphanCount: number
  orphans: Orphan[]
}

export default function RecoverPage() {
  const [audit, setAudit] = useState<Audit | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runAudit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/audit-blobs')
      if (!res.ok) throw new Error('failed')
      setAudit(await res.json())
    } catch {
      setError('הבדיקה נכשלה, נסי שוב')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <h1 className="text-2xl font-semibold text-gray-900">בדיקת קבצים שנפלו</h1>
        <p className="text-sm text-gray-500">
          משווה בין הקבצים ששמורים באחסון לבין המסמכים שמופיעים באפליקציה,
          ומזהה קבצים שנשמרו אך לא מקושרים (מועמדים לשחזור).
        </p>

        <button
          onClick={runAudit}
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'בודק... (עשוי לקחת דקה)' : 'הרץ בדיקה'}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {audit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="קבצים באחסון (מסמכים)" value={audit.documentBlobs} />
              <Stat label="מסמכים באפליקציה" value={audit.documentsInDb} />
              <Stat
                label="קבצים שנפלו (לשחזור)"
                value={audit.orphanCount}
                highlight={audit.orphanCount > 0}
              />
              <Stat label="תמונות ממוזערות" value={audit.thumbnails} muted />
            </div>

            {audit.orphanCount > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-amber-800">
                  נמצאו {audit.orphanCount} קבצים ששמורים באחסון אך לא מופיעים באפליקציה 🎯
                </p>
                <p className="text-xs text-amber-700">
                  אלה קבצים שניתן לשחזר בלי להעלות מחדש. אמרי לי והכין כלי שיחזיר אותם לאפליקציה.
                </p>
                <div className="bg-white rounded-lg p-2 max-h-72 overflow-y-auto text-xs text-gray-600 space-y-1 mt-2">
                  {audit.orphans.map((o, i) => (
                    <div key={i} className="flex justify-between gap-2 border-b last:border-0 py-1">
                      <a href={o.url} target="_blank" rel="noopener noreferrer"
                        className="truncate text-blue-600 hover:underline flex-1">
                        📎 {decodeURIComponent(o.pathname)}
                      </a>
                      <span className="text-gray-400 shrink-0">
                        {new Date(o.uploadedAt).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                לא נמצאו קבצים יתומים — כל מה ששמור באחסון כבר מקושר לאפליקציה.
                (אם עדיין חסרים קבצים, סימן שההעלאה שלהם נקטעה לפני שהגיעו לאחסון, ואז צריך להעלות מחדש.)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight, muted }: { label: string; value: number; highlight?: boolean; muted?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
      <p className={`text-2xl font-semibold ${highlight ? 'text-amber-700' : muted ? 'text-gray-400' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
