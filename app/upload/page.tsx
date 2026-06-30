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
  const [splitFile, setSplitFile] = useState<File | null>(null)
  const [splitting, setSplitting] = useState(false)
  const [splitResult, setSplitResult] = useState<string | null>(null)
  const [splitProgress, setSplitProgress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const splitRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const valid = Array.from(newFiles).filter(f =>
      f.type.includes('pdf') || f.type.startsWith('image/')
    )
    if (valid.length === 0) return alert('PDF או תמונה בלבד')
    setFiles(prev => [...prev, ...valid.map(f => ({ file: f, status: 'waiting' as const }))])
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

  async function splitAndUpload() {
    if (!splitFile) return
    setSplitting(true)
    setSplitResult(null)
    setSplitProgress('טוען...')

    try {
      const arrayBuffer = await splitFile.arrayBuffer()

      // שלב 1: ספירת עמודים עם pdf-lib
      const { PDFDocument } = await import('pdf-lib')
      const srcDoc = await PDFDocument.load(arrayBuffer.slice(0))
      const numPages = srcDoc.getPageCount()

      // שלב 2: רינדור כל עמוד ל-JPEG עם pdfjs-dist
      setSplitProgress('טוען מנוע PDF...')
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const pdfData = new Uint8Array(arrayBuffer.slice(0))
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      for (let i = 0; i < numPages; i++) {
        setSplitProgress(`מעבד עמוד ${i + 1}/${numPages}...`)

        // רינדור ל-JPEG
        const page = await pdfDoc.getPage(i + 1)
        const viewport = page.getViewport({ scale: 2.0 }) // רזולוציה גבוהה לקריאות AI
        canvas.width = viewport.width
        canvas.height = viewport.height
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({ canvasContext: ctx as any, viewport, canvas }).promise
        const jpegBlob = await new Promise<Blob>(resolve =>
          canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.85)
        )

        // העלאת ה-JPEG לשרת
        const form = new FormData()
        form.append('file', new File([jpegBlob], `עמ-${i + 1}.jpg`, { type: 'image/jpeg' }))
        await fetch('/api/upload', { method: 'POST', body: form })
      }

      setSplitResult(`הועלו ${numPages} מסמכים — AI מחלץ פרטים ברקע`)
    } catch (e) {
      setSplitResult(`שגיאה: ${e instanceof Error ? e.message : 'נסי שוב'}`)
    }
    setSplitProgress('')
    setSplitting(false)
  }

  const allDone = files.length > 0 && files.every(f => f.status === 'done')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="max-w-lg w-full px-4 space-y-4">
        <h1 className="text-2xl font-semibold text-center">העלאת מסמכים</h1>

        {/* פיצול PDF גדול */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 space-y-3">
          <p className="font-medium text-amber-800">📦 PDF עם מספר מסמכים</p>
          <p className="text-sm text-amber-700">העלי PDF שלם מהסורק — המערכת תפרק אוטומטית לעמודים</p>
          {splitFile ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 truncate">📄 {splitFile.name}</p>
              {splitResult ? (
                <p className={`text-sm font-medium ${splitResult.startsWith('שגיאה') ? 'text-red-600' : 'text-green-700'}`}>
                  {splitResult}
                </p>
              ) : splitting ? (
                <p className="text-sm text-amber-700 animate-pulse">{splitProgress || 'מעבד...'}</p>
              ) : (
                <button
                  onClick={splitAndUpload}
                  className="w-full bg-amber-500 text-white rounded-lg py-2 text-sm font-medium"
                >
                  פרק וזהה מסמכים
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => splitRef.current?.click()}
              className="w-full border border-amber-300 bg-white rounded-lg py-2 text-sm text-amber-700 hover:bg-amber-50"
            >
              בחרי PDF לפיצול
            </button>
          )}
          <input ref={splitRef} type="file" accept=".pdf" className="hidden"
            onChange={e => { if (e.target.files?.[0]) { setSplitFile(e.target.files[0]); setSplitResult(null) } }} />
        </div>

        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="flex-1 border-t" /><span>או</span><div className="flex-1 border-t" />
        </div>

        {/* העלאה רגילה */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
            dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <p className="text-gray-500">קבצים בודדים — PDF או תמונה</p>
          <p className="text-sm text-gray-400 mt-1">גרור או לחץ לבחירה</p>
        </div>

        <button
          onClick={() => cameraRef.current?.click()}
          className="w-full border-2 border-dashed border-blue-200 rounded-2xl p-5 text-center bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <p className="text-blue-600 font-medium">📷 צלם מסמך</p>
          <p className="text-xs text-blue-400 mt-1">פתח מצלמה וצלם ישירות</p>
        </button>

        <input ref={fileRef} type="file" accept=".pdf,image/*" multiple className="hidden"
          onChange={e => addFiles(e.target.files)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => addFiles(e.target.files)} />

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
          <button onClick={uploadAll} disabled={running}
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:opacity-50">
            {running ? 'מעלה...' : `העלה ${files.length} קבצים`}
          </button>
        )}

        {(allDone || splitResult?.includes('הועלו')) && (
          <button onClick={() => router.push('/')}
            className="w-full bg-green-600 text-white rounded-lg py-2 font-medium">
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
