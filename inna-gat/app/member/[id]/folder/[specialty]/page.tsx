'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DocumentCard } from '@/components/DocumentCard'
import { MultiEmailModal } from '@/components/MultiEmailModal'
import { shareDocuments } from '@/lib/share'
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

export default function MemberFolderPage() {
  const params = useParams<{ id: string; specialty: string }>()
  const memberId = params.id
  const specialty = decodeURIComponent(params.specialty)
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const { items: selItems, has, toggle, remove, clear } = useSelection()
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchDocs = useCallback(async () => {
    const res = await fetch(`/api/documents?member=${memberId}`)
    const all: Doc[] = await res.json()
    const filtered = all.filter(d => {
      const key = FOLDER_MAP[d.specialty ?? ''] ?? d.specialty ?? 'אחר'
      return key === specialty
    })
    setDocs(filtered)
  }, [specialty, memberId])

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

  async function shareSelected() {
    const r = await shareDocuments(selItems.map(i => ({ blob_url: i.blob_url, filename: i.filename })))
    if (r === 'unsupported') alert('השיתוף נתמך בעיקר מהנייד. מהמחשב אפשר לשלוח במייל.')
    else if (r === 'error') alert('השיתוף נכשל, נסי שוב')
    else if (r === 'shared') clear()
  }

  const sorted = [...docs].sort((a, b) => (b.doc_date ?? '').localeCompare(a.doc_date ?? ''))

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-28">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/member/${memberId}`)} className="text-gray-400 hover:text-gray-600 text-lg">
            →
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{specialty}</h1>
            <p className="text-sm text-gray-400">{docs.length} מסמכים</p>
          </div>
        </div>

        {docs.length === 0 ? (
          <p className="text-center text-gray-400 py-16">אין מסמכים בתיקייה זו</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sorted.map(doc => (
              <div key={doc.id} className="relative">
                <input
                  type="checkbox"
                  checked={has(doc.id)}
                  onChange={() => toggle({ id: doc.id, filename: doc.filename, blob_url: doc.blob_url })}
                  onClick={e => e.stopPropagation()}
                  className="absolute top-2 right-2 z-10 w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <DocumentCard doc={doc} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-white border shadow-xl rounded-2xl px-6 py-3">
          <span className="text-sm text-gray-600">{selItems.length} נבחרו</span>
          <button
            onClick={shareSelected}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            שתף
          </button>
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
            onClick={clear}
            className="text-gray-400 text-sm hover:text-gray-600"
          >
            בטל
          </button>
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
