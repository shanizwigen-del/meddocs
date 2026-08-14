'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { DocumentCard } from '@/components/DocumentCard'
import { MultiEmailModal } from '@/components/MultiEmailModal'
import { FolderCard } from '@/components/FolderGrid'
import { InstallBanner } from '@/components/InstallBanner'
import { useSelection } from '@/lib/useSelection'

interface Doc {
  id: string
  filename: string
  blob_url: string
  doc_date: string | null
  doctor: string | null
  hospital: string | null
  specialty: string | null
  summary: string | null
  status: string
  thumbnail_url?: string | null
}

const FOLDER_MAP: Record<string, string> = {
  'פסיכיאטריה': 'בריאות הנפש',
  'פסיכולוגיה': 'בריאות הנפש',
  'בריאות נפש': 'בריאות הנפש',
  'נפשי': 'בריאות הנפש',
  'psychiatry': 'בריאות הנפש',
  'psychology': 'בריאות הנפש',
  'mental health': 'בריאות הנפש',
}

export default function HomePage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [q, setQ] = useState('')
  const { items: selItems, has, toggle, remove, clear } = useSelection()
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchDocs = useCallback(async () => {
    const res = await fetch('/api/documents')
    setDocs(await res.json())
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  useEffect(() => {
    if (!docs.some(d => d.status === 'processing')) return
    const t = setTimeout(fetchDocs, 3000)
    return () => clearTimeout(t)
  }, [docs, fetchDocs])

  async function deleteSelected() {
    if (!confirm(`למחוק ${selItems.length} מסמכים?`)) return
    setDeleting(true)
    const ids = selItems.map(i => i.id)
    await Promise.all(ids.map(id =>
      fetch(`/api/documents/${id}`, { method: 'DELETE' })
    ))
    remove(ids)
    setDeleting(false)
    fetchDocs()
  }

  const folders = docs.reduce<Record<string, Doc[]>>((acc, doc) => {
    const specialty = doc.specialty ?? 'אחר'
    const key = FOLDER_MAP[specialty] ?? specialty
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})

  const searchResults = q
    ? docs.filter(d =>
        d.doctor?.includes(q) ||
        d.hospital?.includes(q) ||
        d.specialty?.includes(q) ||
        d.filename.includes(q) ||
        d.summary?.includes(q)
      )
    : []

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <InstallBanner />

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5 pb-28">
        {/* כותרת */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">המסמכים שלי</h1>
          <Link href="/upload"
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm active:scale-95 transition-transform">
            + העלה
          </Link>
        </div>

        {/* חיפוש */}
        <input
          type="search"
          placeholder="חיפוש לפי רופא, מוסד, תחום..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 text-sm bg-white shadow-sm"
        />

        {/* תוצאות חיפוש */}
        {q && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 px-1">{searchResults.length} תוצאות</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {searchResults.map(doc => (
                <div key={doc.id} className="relative">
                  <input type="checkbox" checked={has(doc.id)}
                    onChange={() => toggle({ id: doc.id, filename: doc.filename, blob_url: doc.blob_url })}
                    onClick={e => e.stopPropagation()}
                    className="absolute top-2 right-2 z-10 w-4 h-4 accent-blue-600 cursor-pointer" />
                  <DocumentCard doc={doc} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* תיקיות */}
        {!q && (
          <div>
            {Object.keys(folders).length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-4xl">📂</p>
                <p className="text-gray-400">אין מסמכים עדיין</p>
                <Link href="/upload" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium mt-2">
                  העלי מסמך ראשון
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(folders)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([specialty, items]) => (
                    <FolderCard key={specialty} specialty={specialty} count={items.length} />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* פס תחתון — בחירה מרובה (נשמרת בין הקטגוריות) */}
      {selItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t shadow-xl px-4 py-3 flex items-center gap-2 justify-between">
          <span className="text-sm text-gray-600 font-medium">{selItems.length} נבחרו</span>
          <div className="flex gap-2">
            <button onClick={() => setShowEmailModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              שלח במייל
            </button>
            <button onClick={deleteSelected} disabled={deleting}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {deleting ? 'מוחק...' : 'מחק'}
            </button>
            <button onClick={clear}
              className="text-gray-400 text-sm px-2">
              ✕
            </button>
          </div>
        </div>
      )}

      {showEmailModal && (
        <MultiEmailModal
          selectedIds={selItems.map(i => i.id)}
          selectedNames={selItems.map(i => i.filename)}
          onClose={() => setShowEmailModal(false)}
          onSent={() => { setShowEmailModal(false); clear() }}
        />
      )}
    </div>
  )
}
