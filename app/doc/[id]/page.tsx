'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SpecialtyChip } from '@/components/SpecialtyChip'
import { EmailModal } from '@/components/EmailModal'
import { PdfViewer } from '@/components/PdfViewer'

interface Doc {
  id: string
  filename: string
  blob_url: string
  doc_date: string | null
  doctor: string | null
  hospital: string | null
  specialty: string | null
  keywords: string[] | null
  page_rotations: Record<string, number> | null
  status: string
}

export default function DocPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [doc, setDoc] = useState<Doc | null>(null)
  const [showEmail, setShowEmail] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(false)
  const [doctorInput, setDoctorInput] = useState('')
  const [editingSpecialty, setEditingSpecialty] = useState(false)
  const [specialtyInput, setSpecialtyInput] = useState('')

  async function saveDoctor() {
    await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctor: doctorInput || null }),
    })
    setDoc(d => d ? { ...d, doctor: doctorInput || null } : d)
    setEditingDoctor(false)
  }

  async function saveSpecialty() {
    await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specialty: specialtyInput || null }),
    })
    setDoc(d => d ? { ...d, specialty: specialtyInput || null } : d)
    setEditingSpecialty(false)
  }

  async function handleDelete() {
    if (!confirm('למחוק את המסמך לצמיתות?')) return
    setDeleting(true)
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    router.push('/')
  }

  useEffect(() => {
    fetch(`/api/documents/${id}`).then(r => r.json()).then(setDoc)
  }, [id])

  if (!doc) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">טוען...</div>
  )

  const dateStr = doc.doc_date ? new Date(doc.doc_date).toLocaleDateString('he-IL') : null

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-700">
            ← חזרה
          </button>
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={deleting} className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm">
              {deleting ? 'מוחק...' : 'מחק'}
            </button>
            <button onClick={() => setShowEmail(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              שלח במייל
            </button>
            <a href={doc.blob_url} download={doc.filename} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              הורד
            </a>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4" style={{ height: 'calc(100vh - 90px)' }}>
          <div className="col-span-3 rounded-xl overflow-hidden border">
            <PdfViewer url={doc.blob_url} docId={id} initialRotations={doc.page_rotations ?? {}} />
          </div>

          <div className="bg-white rounded-xl border p-4 space-y-3 text-sm overflow-y-auto">
            {editingSpecialty ? (
              <span className="flex gap-1">
                <input
                  autoFocus
                  value={specialtyInput}
                  onChange={e => setSpecialtyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveSpecialty()}
                  placeholder="תחום (לדוגמה: פסיכיאטריה)"
                  className="border rounded px-2 py-0.5 text-xs flex-1"
                />
                <button onClick={saveSpecialty} className="text-blue-600 text-xs">שמור</button>
                <button onClick={() => setEditingSpecialty(false)} className="text-gray-400 text-xs">ביטול</button>
              </span>
            ) : (
              <span onClick={() => { setSpecialtyInput(doc.specialty ?? ''); setEditingSpecialty(true) }} className="cursor-pointer" title="לחץ לעריכה">
                {doc.specialty ? <SpecialtyChip name={doc.specialty} /> : <span className="text-gray-300 italic text-xs">לחץ להוספת תחום</span>}
              </span>
            )}
            {dateStr && <div><span className="text-gray-400">תאריך: </span>{dateStr}</div>}

            <div>
              <span className="text-gray-400">רופא: </span>
              {editingDoctor ? (
                <span className="flex gap-1 mt-1">
                  <input
                    autoFocus
                    value={doctorInput}
                    onChange={e => setDoctorInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveDoctor()}
                    placeholder="שם הרופא"
                    className="border rounded px-2 py-0.5 text-xs flex-1"
                  />
                  <button onClick={saveDoctor} className="text-blue-600 text-xs">שמור</button>
                  <button onClick={() => setEditingDoctor(false)} className="text-gray-400 text-xs">ביטול</button>
                </span>
              ) : (
                <span
                  onClick={() => { setDoctorInput(doc.doctor ?? ''); setEditingDoctor(true) }}
                  className="cursor-pointer hover:underline"
                  title="לחץ לעריכה"
                >
                  {doc.doctor ? `ד"ר ${doc.doctor}` : <span className="text-gray-300 italic">לא זוהה — לחץ להוספה</span>}
                </span>
              )}
            </div>

            {doc.hospital && <div><span className="text-gray-400">מוסד: </span>{doc.hospital}</div>}
            {doc.keywords && doc.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {doc.keywords.map((k: string) => (
                  <span key={k} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{k}</span>
                ))}
              </div>
            )}
            {doc.status === 'processing' && (
              <p className="text-blue-500 text-xs animate-pulse">מעבד מסמך...</p>
            )}
            <p className="text-gray-400 text-xs pt-2">העבר עכבר על עמוד לסיבובו</p>
          </div>
        </div>
      </div>

      {showEmail && <EmailModal docId={id} onClose={() => setShowEmail(false)} />}
    </div>
  )
}
