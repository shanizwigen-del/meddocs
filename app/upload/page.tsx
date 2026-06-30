'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function uploadFile(file: File) {
    if (!file.type.includes('pdf')) return alert('רק קבצי PDF')
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const { id } = await res.json()
    router.push(`/doc/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="max-w-lg w-full px-4 space-y-4">
        <h1 className="text-2xl font-semibold text-center">העלאת מסמך</h1>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); uploadFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
            dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {uploading ? (
            <p className="text-blue-600 animate-pulse">מעלה ומעבד...</p>
          ) : (
            <>
              <p className="text-gray-500">גרור PDF לכאן</p>
              <p className="text-sm text-gray-400 mt-1">או לחץ לבחירה</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".pdf" className="hidden"
          onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
        <button onClick={() => router.push('/')} className="w-full text-gray-500 text-sm">
          ← חזרה
        </button>
      </div>
    </div>
  )
}
