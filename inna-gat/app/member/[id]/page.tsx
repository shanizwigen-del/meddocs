'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { DocumentCard } from '@/components/DocumentCard'
import { MultiEmailModal } from '@/components/MultiEmailModal'
import { FolderCard } from '@/components/FolderGrid'
import { AddMemberModal } from '@/components/AddMemberModal'
import { type Member, ageFromBirth } from '@/components/MemberCard'
import { colorFor } from '@/lib/memberColors'
import { shareDocuments } from '@/lib/share'

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

export default function MemberPage() {
  const params = useParams<{ id: string }>()
  const memberId = params.id
  const router = useRouter()

  const [member, setMember] = useState<Member | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchMember = useCallback(async () => {
    const res = await fetch(`/api/members/${memberId}`)
    if (res.ok) setMember(await res.json())
  }, [memberId])

  const fetchDocs = useCallback(async () => {
    const res = await fetch(`/api/documents?member=${memberId}`)
    setDocs(await res.json())
  }, [memberId])

  useEffect(() => { fetchMember(); fetchDocs() }, [fetchMember, fetchDocs])

  useEffect(() => {
    if (!docs.some(d => d.status === 'processing')) return
    const t = setTimeout(fetchDocs, 3000)
    return () => clearTimeout(t)
  }, [docs, fetchDocs])

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

  async function deleteMember() {
    if (!confirm(`למחוק את התיק של ${member?.name}? כל המסמכים בתיק יימחקו לצמיתות.`)) return
    await fetch(`/api/members/${memberId}`, { method: 'DELETE' })
    router.push('/')
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function shareSelected() {
    const r = await shareDocuments(selectedDocs.map(d => ({ blob_url: d.blob_url, filename: d.filename })))
    if (r === 'unsupported') alert('השיתוף נתמך בעיקר מהנייד. מהמחשב אפשר לשלוח במייל.')
    else if (r === 'error') alert('השיתוף נכשל, נסי שוב')
    else if (r === 'shared') setSelected(new Set())
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
  const c = colorFor(member?.color, 0)
  const age = ageFromBirth(member?.birth_date ?? null)
  const sub = [member?.relation, age !== null ? `בן/בת ${age}` : null].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5 pb-28">
        {/* כותרת בן המשפחה */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 text-lg shrink-0">
              →
            </button>
            <div className={`w-11 h-11 rounded-full ${c.dot} text-white flex items-center justify-center text-lg font-semibold shrink-0`}>
              {member?.name?.trim().charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{member?.name ?? '...'}</h1>
              {sub && <p className="text-xs text-gray-500">{sub}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setShowEdit(true)} className="text-gray-400 hover:text-gray-600 p-2" aria-label="עריכה">✎</button>
            <button onClick={deleteMember} className="text-gray-400 hover:text-red-500 p-2" aria-label="מחיקה">🗑</button>
          </div>
        </div>

        <Link href={`/upload?member=${memberId}`}
          className="block bg-blue-600 text-white text-center px-4 py-3 rounded-xl text-sm font-medium shadow-sm active:scale-95 transition-transform">
          + העלה מסמך
        </Link>

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
                  <input type="checkbox" checked={selected.has(doc.id)}
                    onChange={() => toggleSelect(doc.id)}
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
                <p className="text-gray-400">אין מסמכים בתיק עדיין</p>
                <Link href={`/upload?member=${memberId}`} className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium mt-2">
                  העלי מסמך ראשון
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(folders)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([specialty, items]) => (
                    <FolderCard key={specialty} specialty={specialty} count={items.length} memberId={memberId} />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* פס תחתון — בחירה מרובה */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t shadow-xl px-4 py-3 flex items-center gap-2 justify-between">
          <span className="text-sm text-gray-600 font-medium">{selected.size} נבחרו</span>
          <div className="flex gap-2">
            <button onClick={shareSelected}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              שתף
            </button>
            <button onClick={() => setShowEmailModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              שלח במייל
            </button>
            <button onClick={deleteSelected} disabled={deleting}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {deleting ? 'מוחק...' : 'מחק'}
            </button>
            <button onClick={() => setSelected(new Set())}
              className="text-gray-400 text-sm px-2">
              ✕
            </button>
          </div>
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

      {showEdit && member && (
        <AddMemberModal
          existing={member}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); fetchMember() }}
        />
      )}
    </div>
  )
}
