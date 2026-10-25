'use client'
import { useEffect, useState } from 'react'
import { fileHref } from '@/lib/file-href'

interface Doc {
  id: string
  filename: string
  blob_url: string
  thumbnail_url: string | null
}

export default function AdminPage() {
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [done, setDone] = useState(false)

  // העברה חד-פעמית של הקבצים מהאחסון הציבורי הישן לאחסון הפרטי
  const [migStatus, setMigStatus] = useState<{ total: number; remaining: number } | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [migLog, setMigLog] = useState<string[]>([])

  async function loadMigStatus() {
    const r = await fetch('/api/admin/migrate-private')
    if (r.ok) setMigStatus(await r.json())
  }

  useEffect(() => { loadMigStatus() }, [])

  async function runMigration() {
    setMigrating(true)
    setMigLog([])
    const skip: string[] = []
    for (;;) {
      const r = await fetch('/api/admin/migrate-private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip }),
      })
      if (!r.ok) {
        setMigLog(prev => [...prev, `שגיאה בשרת (${r.status})`])
        break
      }
      const { migrated, failed, remaining } = await r.json() as {
        migrated: number
        failed: { id: string; error: string }[]
        remaining: number
      }
      skip.push(...failed.map(f => f.id))
      setMigLog(prev => [
        ...prev,
        ...failed.map(f => `⚠ לא הועבר ${f.id}: ${f.error}`),
        `✓ הועברו ${migrated}, נשארו ${remaining}`,
      ])
      if (migrated === 0 && failed.length === 0) break
    }
    await loadMigStatus()
    setMigrating(false)
  }

  async function runBackfill() {
    setRunning(true)
    setLog([])
    setDone(false)

    // שלב 1: עדכון תמונות (blob_url = thumbnail)
    addLog('מעדכן תמונות...')
    const r1 = await fetch('/api/admin/backfill-thumbnails', { method: 'POST' })
    const { updated, skipped } = await r1.json()
    addLog(`✓ תמונות: ${updated} עודכנו`)

    // שלב 2: PDFs — מוריד + מרנדר בדפדפן
    if (skipped > 0) {
      addLog(`מעבד ${skipped} קבצי PDF...`)
      const res = await fetch('/api/documents')
      const docs: Doc[] = await res.json()
      const pdfs = docs.filter(d => !d.thumbnail_url && !/\.(jpe?g|png|gif|webp)$/i.test(d.filename))

      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      let pdfCount = 0
      for (const doc of pdfs) {
        try {
          addLog(`מרנדר: ${doc.filename}...`)
          const arrayBuffer = await fetch(fileHref(doc.id)).then(r => r.arrayBuffer())
          const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
          const page = await pdf.getPage(1)
          const vp = page.getViewport({ scale: 1.5 })
          canvas.width = vp.width
          canvas.height = vp.height
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await page.render({ canvasContext: ctx as any, viewport: vp, canvas }).promise

          const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/jpeg', 0.8))
          const form = new FormData()
          form.append('file', new File([blob], `thumb-${doc.id}.jpg`, { type: 'image/jpeg' }))
          form.append('docId', doc.id)
          await fetch('/api/admin/save-thumbnail', { method: 'POST', body: form })
          pdfCount++
        } catch {
          addLog(`⚠ דילגתי: ${doc.filename}`)
        }
      }
      addLog(`✓ PDFs: ${pdfCount} עודכנו`)
    }

    addLog('סיום!')
    setDone(true)
    setRunning(false)
  }

  function addLog(msg: string) {
    setLog(prev => [...prev, msg])
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-2xl border shadow p-8 max-w-md w-full space-y-4">
        <h1 className="text-xl font-semibold">עדכון תמונות מסמכים</h1>
        <p className="text-sm text-gray-500">
          מחלץ תמונת תצוגה מכל מסמך שעדיין אין לו תמונה.
          PDFs מרונדרים בדפדפן — הישארי בעמוד עד הסיום.
        </p>

        <button
          onClick={runBackfill}
          disabled={running}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
        >
          {running ? 'מעבד...' : 'חדש תמונות'}
        </button>

        {log.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm font-mono max-h-64 overflow-y-auto">
            {log.map((l, i) => <p key={i} className="text-gray-700">{l}</p>)}
          </div>
        )}

        {done && (
          <div className="text-center">
            <a href="/" className="text-blue-600 text-sm underline">חזרה לרשימה</a>
          </div>
        )}

        <div className="border-t pt-4 space-y-3">
          <h2 className="font-semibold">העברה לאחסון פרטי</h2>
          <p className="text-sm text-gray-500">
            מעתיק את קבצי המסמכים מהאחסון הציבורי הישן לאחסון הפרטי. בטוח להריץ שוב.
            האחסון הישן לא נמחק כאן.
          </p>
          {migStatus && (
            <p className="text-sm">
              {migStatus.remaining === 0
                ? `✓ כל ${migStatus.total} המסמכים באחסון הפרטי`
                : `${migStatus.remaining} מתוך ${migStatus.total} מסמכים עדיין באחסון הציבורי`}
            </p>
          )}
          <button
            onClick={runMigration}
            disabled={migrating || migStatus?.remaining === 0}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium disabled:opacity-50"
          >
            {migrating ? 'מעביר...' : 'העבר לאחסון פרטי'}
          </button>
          {migLog.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm font-mono max-h-64 overflow-y-auto">
              {migLog.map((l, i) => <p key={i} className="text-gray-700">{l}</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
