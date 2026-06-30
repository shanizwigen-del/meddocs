'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SpecialtyChip } from '@/components/SpecialtyChip'
import { EmailModal } from '@/components/EmailModal'

interface Doc {
  id: string
  filename: string
  blob_url: string
  doc_date: string | null
  doctor: string | null
  hospital: string | null
  specialty: string | null
  summary: string | null
  keywords: string[] | null
  status: string
}

export default function DocPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [doc, setDoc] = useState<Doc | null>(null)
  const [showEmail, setShowEmail] = useState(false)

  useEffect(() => {
    fetch(`/api/documents/${id}`).then(r => r.json()).then(setDoc)
  }, [id])

  if (!doc) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">טוען...</div>
  )

  const dateStr = doc.doc_date ? new Date(doc.doc_date).toLocaleDateString('he-IL') : null

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-700">
            ← חזרה
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEmail(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              שלח במייל
            </button>
            <a
              href={doc.blob_url}
              download={doc.filename}
              className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              הורד
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-xl overflow-hidden border h-[75vh]">
            <iframe src={doc.blob_url} className="w-full h-full" />
          </div>
          <div className="bg-white rounded-xl border p-4 space-y-3 text-sm">
            {doc.specialty && <SpecialtyChip name={doc.specialty} />}
            {dateStr       && <div><span className="text-gray-400">תאריך: </span>{dateStr}</div>}
            {doc.doctor    && <div><span className="text-gray-400">רופא: </span>ד&quot;ר {doc.doctor}</div>}
            {doc.hospital  && <div><span className="text-gray-400">מוסד: </span>{doc.hospital}</div>}
            {doc.summary   && (
              <div>
                <p className="text-gray-400 mb-1">סיכום:</p>
                <p className="text-gray-700 leading-relaxed">{doc.summary}</p>
              </div>
            )}
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
          </div>
        </div>
      </div>

      {showEmail && <EmailModal docId={id} onClose={() => setShowEmail(false)} />}
    </div>
  )
}
