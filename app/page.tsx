'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { DocumentCard } from '@/components/DocumentCard'
import { MultiEmailModal } from '@/components/MultiEmailModal'
import { FolderCard } from '@/components/FolderGrid'

interface Doc {
  id: string
  filename: string
  doc_date: string | null
  doctor: string | null
  hospital: string | null
  specialty: string | null
  summary: string | null
  status: string
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
  const [openFolder, setOpenFolder] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
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

  function selectAll() {
    setSelected(new Set(docs.map(d => d.id)))
  }

  async function deleteSelected() {
    if (!confirm(`למחוק ${selected.size} מסמכים?`)) return
    setDeleting(true)
    await Promise.all([...selected].map(id =>
      fetch(`/api/documents/${id}`, { method: 'DELETE' })
    ))
    setSelected(new Set())
    setDeleting(false)
    fetchDocs()
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

  const selectedDocs = docs.filter(d => selected.has(d.id))

  function renderDoc(doc: Doc) {
    return (
      <div key={doc.id} className="flex items-center gap-2 px-4 py-1">
        <input
          type="checkbox"
          checked={selected.has(doc.id)}
          onChange={() => toggleSelect(doc.id)}
          onClick={e => e.stopPropagation()}
          className="w-4 h-4 accent-blue-600 shrink-0 cursor-pointer"
        />
        <div className="flex-1">
          <DocumentCard doc={doc} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 pb-28">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">המסמכים שלי</h1>
          <div className="flex items-center gap-2">
            {docs.length > 0 && (
              <button onClick={selectAll} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">
                בחר הכל
              </button>
            )}
            <Link href="/upload" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              + העלה מסמך
            </Link>
          </div>
        </div>

        <input
          type="text"
          placeholder="חיפוש לפי רופא, מוסד, תחום..."
          value={q}
          onChange={e => { setQ(e.target.value); setOpenFolder(null) }}
          className="w-full border rounded-lg px-4 py-2 text-sm bg-white"
        />

        {q && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">{searchResults.length} תוצאות</p>
            {searchResults.map(doc => renderDoc(doc))}
          </div>
        )}

        {!q && (
          <div className="space-y-4">
            {Object.keys(folders).length === 0 && (
              <p className="text-center text-gray-400 py-12">אין מסמכים עדיין</p>
            )}

            {/* גריד תיקיות */}
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(folders)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([specialty, items]) => (
                  <FolderCard
                    key={specialty}
                    specialty={specialty}
                    count={items.length}
                    isOpen={openFolder === specialty}
                    onClick={() => setOpenFolder(openFolder === specialty ? null : specialty)}
                  />
                ))}
            </div>

            {/* תוכן תיקייה פתוחה */}
            {openFolder && folders[openFolder] && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50 text-sm font-medium text-gray-700">
                  {openFolder}
                </div>
                <div className="divide-y">
                  {folders[openFolder]
                    .sort((a, b) => (b.doc_date ?? '').localeCompare(a.doc_date ?? ''))
                    .map(doc => renderDoc(doc))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-white border shadow-xl rounded-2xl px-6 py-3">
          <span className="text-sm text-gray-600">{selected.size} נבחרו</span>
          <button
            onClick={() => setShowEmailModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            שלח במייל
          </button>
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {deleting ? 'מוחק...' : 'מחק'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-gray-400 text-sm hover:text-gray-600"
          >
            בטל
          </button>
        </div>
      )}

      {showEmailModal && (
        <MultiEmailModal
          selectedIds={[...selected]}
          selectedNames={selectedDocs.map(d => d.filename)}
          onClose={() => setShowEmailModal(false)}
          onSent={() => { setShowEmailModal(false); setSelected(new Set()) }}
        />
      )}
    </div>
  )
}
