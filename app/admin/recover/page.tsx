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

interface PagesResult {
  totalDocuments: number
  totalPages: number
  failed: number
  documents: { filename: string; pages: number | null }[]
}

interface DupDoc { id: string; filename: string }
interface Dupes {
  exactCount: number
  nameCount: number
  exactGroups: DupDoc[][]
  nameGroups: DupDoc[][]
}

export default function RecoverPage() {
  const [audit, setAudit] = useState<Audit | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pages, setPages] = useState<PagesResult | null>(null)
  const [loadingPages, setLoadingPages] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreMsg, setRestoreMsg] = useState('')
  const [dupes, setDupes] = useState<Dupes | null>(null)
  const [loadingDupes, setLoadingDupes] = useState(false)
  const [compareInput, setCompareInput] = useState('')
  const [compareResult, setCompareResult] = useState<{ total: number; foundCount: number; missingCount: number; missing: string[] } | null>(null)
  const [loadingCompare, setLoadingCompare] = useState(false)

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

  async function restoreOrphans() {
    if (!confirm('לשחזר את הקבצים שנפלו ולהחזיר אותם לאפליקציה?')) return
    setRestoring(true)
    setRestoreMsg('')
    setError('')
    try {
      const res = await fetch('/api/admin/restore-orphans', { method: 'POST' })
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setRestoreMsg(`שוחזרו ${data.restoredCount} קבצים! הם מופיעים עכשיו באפליקציה 🎉`)
      await runAudit()
    } catch {
      setError('השחזור נכשל, נסי שוב')
    }
    setRestoring(false)
  }

  async function compareNames() {
    const names = compareInput.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    if (names.length === 0) { setError('הדביקי קודם רשימת שמות קבצים'); return }
    setLoadingCompare(true)
    setError('')
    try {
      const res = await fetch('/api/admin/compare-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names }),
      })
      if (!res.ok) throw new Error('failed')
      setCompareResult(await res.json())
    } catch {
      setError('ההשוואה נכשלה, נסי שוב')
    }
    setLoadingCompare(false)
  }

  async function findDuplicates() {
    setLoadingDupes(true)
    setError('')
    try {
      const res = await fetch('/api/admin/find-duplicates')
      if (!res.ok) throw new Error('failed')
      setDupes(await res.json())
    } catch {
      setError('בדיקת הכפילויות נכשלה, נסי שוב')
    }
    setLoadingDupes(false)
  }

  async function deleteDoc(id: string, filename: string) {
    if (!confirm(`למחוק את "${filename}"? הפעולה בלתי הפיכה.`)) return
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      await findDuplicates()
    } catch {
      setError('המחיקה נכשלה, נסי שוב')
    }
  }

  async function countPages() {
    setLoadingPages(true)
    setError('')
    try {
      const res = await fetch('/api/admin/count-pages')
      if (!res.ok) throw new Error('failed')
      setPages(await res.json())
    } catch {
      setError('ספירת העמודים נכשלה, נסי שוב')
    }
    setLoadingPages(false)
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <h1 className="text-2xl font-semibold text-gray-900">בדיקת קבצים שנפלו</h1>
        <p className="text-sm text-gray-500">
          משווה בין הקבצים ששמורים באחסון לבין המסמכים שמופיעים באפליקציה,
          ומזהה קבצים שנשמרו אך לא מקושרים (מועמדים לשחזור).
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={runAudit}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'בודק... (עשוי לקחת דקה)' : 'הרץ בדיקה'}
          </button>
          <button
            onClick={countPages}
            disabled={loadingPages}
            className="bg-white border border-blue-600 text-blue-600 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {loadingPages ? 'סופר עמודים... (עשוי לקחת כמה דקות)' : 'ספירת עמודים'}
          </button>
          <button
            onClick={findDuplicates}
            disabled={loadingDupes}
            className="bg-white border border-blue-600 text-blue-600 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {loadingDupes ? 'בודק כפילויות...' : 'בדיקת כפילויות'}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* השוואה מול רשימת קבצים מקומית */}
        <details className="bg-white border rounded-xl p-4">
          <summary className="text-sm font-medium text-gray-800 cursor-pointer">
            השוואה מול תיקייה במחשב (לפי שמות)
          </summary>
          <div className="space-y-2 mt-3">
            <p className="text-xs text-gray-500">
              הדביקי כאן את רשימת שמות הקבצים מהתיקייה במחשב (שם אחד בכל שורה), ואבדוק מי מהם נמצא באפליקציה ומי חסר.
            </p>
            <textarea
              value={compareInput}
              onChange={e => setCompareInput(e.target.value)}
              rows={5}
              placeholder={'לדוגמה:\nPsychiatry_Summary_2025-12-02.pdf\nBlood_Test_2026-01-10.pdf'}
              className="w-full border rounded-lg px-3 py-2 text-xs font-mono"
              dir="ltr"
            />
            <button
              onClick={compareNames}
              disabled={loadingCompare}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loadingCompare ? 'משווה...' : 'השווה'}
            </button>

            {compareResult && (
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="ברשימה" value={compareResult.total} muted />
                  <Stat label="נמצאו באפליקציה" value={compareResult.foundCount} />
                  <Stat label="חסרים" value={compareResult.missingCount} highlight={compareResult.missingCount > 0} />
                </div>
                {compareResult.missingCount === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                    כל הקבצים מהרשימה נמצאים באפליקציה 🎉
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                    <p className="text-sm font-medium text-amber-800">קבצים שלא נמצאו באפליקציה (מועמדים להעלאה מחדש):</p>
                    <div className="max-h-60 overflow-y-auto text-xs text-gray-700 space-y-1 mt-1" dir="ltr">
                      {compareResult.missing.map((m, i) => <div key={i} className="border-b last:border-0 py-1">📄 {m}</div>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </details>

        {pages && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="סה״כ עמודים" value={pages.totalPages} highlight />
              <Stat label="מסמכים שנספרו" value={pages.totalDocuments} />
            </div>
            {pages.failed > 0 && (
              <p className="text-xs text-amber-700">
                ⚠️ {pages.failed} קבצים לא נפתחו לספירה (ייתכן פורמט לא נתמך) — לא נכללו בסכום.
              </p>
            )}
            <details className="bg-white border rounded-xl p-3">
              <summary className="text-sm text-gray-600 cursor-pointer">פירוט לפי מסמך</summary>
              <div className="max-h-72 overflow-y-auto text-xs text-gray-600 space-y-1 mt-2">
                {pages.documents.map((d, i) => (
                  <div key={i} className="flex justify-between gap-2 border-b last:border-0 py-1">
                    <span className="truncate flex-1">{decodeURIComponent(d.filename)}</span>
                    <span className="shrink-0 text-gray-400">
                      {d.pages === null ? 'נכשל' : `${d.pages} עמ׳`}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {dupes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="עותקים זהים לחלוטין" value={dupes.exactCount} highlight={dupes.exactCount > 0} />
              <Stat label="שמות דומים" value={dupes.nameCount} highlight={dupes.nameCount > 0} />
            </div>

            {dupes.exactCount === 0 && dupes.nameCount === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                לא נמצאו כפילויות 🎉
              </div>
            ) : (
              <>
                {dupes.exactGroups.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">עותקים זהים לחלוטין (מומלץ למחוק את המיותרים):</p>
                    {dupes.exactGroups.map((g, gi) => (
                      <DupGroup key={`e${gi}`} group={g} onDelete={deleteDoc} />
                    ))}
                  </div>
                )}
                {dupes.nameGroups.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">שמות דומים (ייתכן שאותו מסמך — כדאי לבדוק):</p>
                    {dupes.nameGroups.map((g, gi) => (
                      <DupGroup key={`n${gi}`} group={g} onDelete={deleteDoc} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
                  אלה קבצים שניתן לשחזר בלי להעלות מחדש.
                </p>
                <button
                  onClick={restoreOrphans}
                  disabled={restoring}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {restoring ? 'משחזר...' : `שחזר את ${audit.orphanCount} הקבצים לאפליקציה`}
                </button>
                {restoreMsg && <p className="text-sm text-green-700 font-medium">{restoreMsg}</p>}
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

function DupGroup({ group, onDelete }: { group: DupDoc[]; onDelete: (id: string, filename: string) => void }) {
  return (
    <div className="bg-white border rounded-xl p-3 space-y-1">
      {group.map((d, i) => (
        <div key={d.id} className="flex items-center justify-between gap-2 text-xs py-1 border-b last:border-0">
          <span className="truncate flex-1">
            {i === 0 && <span className="text-green-600 ml-1">✓ לשמור</span>}{' '}
            <a
              href={`/doc/${d.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {decodeURIComponent(d.filename)}
            </a>
          </span>
          <button
            onClick={() => onDelete(d.id, d.filename)}
            className="text-red-500 hover:text-red-700 shrink-0 px-2"
          >
            מחק
          </button>
        </div>
      ))}
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
