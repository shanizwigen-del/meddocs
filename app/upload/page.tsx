'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface FileStatus {
  file: File
  status: 'waiting' | 'uploading' | 'done' | 'error'
}

export default function UploadPage() {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<FileStatus[]>([])
  const [running, setRunning] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const pdfs = Array.from(newFiles).filter(f => f.type.includes('pdf'))
    if (pdfs.length === 0) return alert('רק קבצי PDF')
    setFiles(prev => [...prev, ...pdfs.map(f => ({ file: f, status: 'waiting' as const }))])
  }

  async function uploadAll() {
    setRunning(true)
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'done') continue
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))
      try {
        const form = new FormData()
        form.append('file', files[i].file)
        await fetch('/api/upload', { method: 'POST', body: form })
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f))
      } catch {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f))
      }
    }
    setRunning(false)
  }

  const allDone = files.length > 0 && files.every(f => f.status === 'done')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="max-w-lg w-full px-4 space-y-4">
        <h1 className="text-2xl font-semibold text-center">העלאת מסמכים</h1>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
            dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <p className="text-gray-500">גרור קבצי PDF לכאן</p>
          <p className="text-sm text-gray-400 mt-1">אפשר כמה קבצים בבת אחת</p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />

        {files.length > 0 && (
          <div className="bg-white border rounded-xl divide-y">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-700 truncate flex-1">{f.file.name}</span>
                <span className="mr-3 shrink-0">
                  {f.status === 'waiting'   && <span className="text-gray-400">ממתין</span>}
                  {f.status === 'uploading' && <span className="text-blue-500 animate-pulse">מעלה...</span>}
                  {f.status === 'done'      && <span className="text-green-600">✓</span>}
                  {f.status === 'error'     && <span className="text-red-500">שגיאה</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && !allDone && (
          <button
            onClick={uploadAll}
            disabled={running}
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
          >
            {running ? 'מעלה...' : `העלה ${files.length} קבצים`}
          </button>
        )}

        {allDone && (
          <button
            onClick={() => router.push('/')}
            className="w-full bg-green-600 text-white rounded-lg py-2 font-medium"
          >
            סיים - חזרה לרשימה
          </button>
        )}

        <button onClick={() => router.push('/')} className="w-full text-gray-500 text-sm">
          ← חזרה
        </button>
      </div>
    </div>
  )
}
