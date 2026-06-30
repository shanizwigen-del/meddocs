'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { DocumentCard } from '@/components/DocumentCard'
import { SearchFilters } from '@/components/SearchFilters'

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

export default function HomePage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [filters, setFilters] = useState({ q: '', specialty: '', year: '' })

  const fetchDocs = useCallback(async () => {
    const params = new URLSearchParams()
    if (filters.q)         params.set('q', filters.q)
    if (filters.specialty) params.set('specialty', filters.specialty)
    if (filters.year)      params.set('year', filters.year)
    const res = await fetch('/api/documents?' + params)
    setDocs(await res.json())
  }, [filters])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  useEffect(() => {
    if (!docs.some(d => d.status === 'processing')) return
    const t = setTimeout(fetchDocs, 3000)
    return () => clearTimeout(t)
  }, [docs, fetchDocs])

  function setFilter(key: string, value: string) {
    setFilters(f => ({ ...f, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">המסמכים שלי</h1>
          <Link href="/upload" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + העלה מסמך
          </Link>
        </div>
        <SearchFilters {...filters} onChange={setFilter} />
        <div className="grid gap-3">
          {docs.length === 0 && (
            <p className="text-center text-gray-400 py-12">אין מסמכים עדיין</p>
          )}
          {docs.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
        </div>
      </div>
    </div>
  )
}
