'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { DocumentCard } from '@/components/DocumentCard'
import { getSpecialtyColor } from '@/lib/specialties'

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

const FOLDER_ICONS: Record<string, string> = {
  'פסיכיאטריה': '🧠',
  'נוירולוגיה': '🧬',
  'קרדיולוגיה': '❤️',
  'אורטופדיה': '🦴',
  'רפואה פנימית': '🩺',
  'גסטרו': '🫁',
  'אנדוקרינולוגיה': '⚗️',
  'ראומטולוגיה': '🔬',
  'אלרגיה': '🌿',
  'עיניים': '👁️',
  'אא"ג': '👂',
  'עור': '🩹',
  'גינקולוגיה': '🌸',
  'אונקולוגיה': '🎗️',
  'בדיקות מעבדה': '🧪',
  'הדמיה': '📷',
  'אחר': '📁',
}

export default function HomePage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [openFolder, setOpenFolder] = useState<string | null>(null)
  const [q, setQ] = useState('')

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

  // קיבוץ לפי תחום
  const folders = docs.reduce<Record<string, Doc[]>>((acc, doc) => {
    const key = doc.specialty ?? 'אחר'
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {})

  // חיפוש חופשי - מציג את כל המסמכים המתאימים
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
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">המסמכים שלי</h1>
          <Link href="/upload" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + העלה מסמך
          </Link>
        </div>

        {/* חיפוש */}
        <input
          type="text"
          placeholder="חיפוש לפי רופא, מוסד, תחום..."
          value={q}
          onChange={e => { setQ(e.target.value); setOpenFolder(null) }}
          className="w-full border rounded-lg px-4 py-2 text-sm bg-white"
        />

        {/* תוצאות חיפוש */}
        {q && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">{searchResults.length} תוצאות</p>
            {searchResults.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
          </div>
        )}

        {/* תיקיות */}
        {!q && (
          <div className="space-y-3">
            {Object.keys(folders).length === 0 && (
              <p className="text-center text-gray-400 py-12">אין מסמכים עדיין</p>
            )}
            {Object.entries(folders)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([specialty, items]) => {
                const isOpen = openFolder === specialty
                const colorClass = getSpecialtyColor(specialty)
                const icon = FOLDER_ICONS[specialty] ?? '📁'
                return (
                  <div key={specialty} className="bg-white rounded-xl border overflow-hidden">
                    <button
                      onClick={() => setOpenFolder(isOpen ? null : specialty)}
                      className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <span className="font-medium text-gray-900">{specialty}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                          {items.length} מסמכים
                        </span>
                      </div>
                      <span className="text-gray-400 text-lg">{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOpen && (
                      <div className="border-t divide-y">
                        {items
                          .sort((a, b) => (b.doc_date ?? '').localeCompare(a.doc_date ?? ''))
                          .map(doc => (
                            <div key={doc.id} className="px-4 py-1">
                              <DocumentCard doc={doc} />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
