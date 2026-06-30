'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export function PdfViewer({ url, docId, initialRotations }: {
  url: string
  docId: string
  initialRotations?: Record<string, number>
}) {
  const [numPages, setNumPages] = useState(0)
  const [rotations, setRotations] = useState<Record<number, number>>(
    initialRotations ? Object.fromEntries(Object.entries(initialRotations).map(([k, v]) => [Number(k), v])) : {}
  )
  const [containerWidth, setContainerWidth] = useState(800)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setContainerWidth(node.clientWidth - 32)
  }, [])

  function rotate(page: number) {
    setRotations(r => {
      const next = { ...r, [page]: ((r[page] ?? 0) + 90) % 360 }
      scheduleSave(next)
      return next
    })
  }

  function scheduleSave(rots: Record<number, number>) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_rotations: rots }),
      })
    }, 800)
  }

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto bg-gray-200 p-4 space-y-4">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<p className="text-center text-gray-400 py-8">טוען...</p>}
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => {
          const rot = rotations[pageNum] ?? 0
          return (
            <div key={pageNum} className="relative group">
              <button
                onClick={() => rotate(pageNum)}
                className="absolute top-2 left-2 z-10 bg-white/80 hover:bg-white border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                ↻ סובב עמוד {pageNum}
              </button>
              <div className="flex justify-center">
                <Page
                  pageNumber={pageNum}
                  rotate={rot}
                  width={containerWidth}
                  className="shadow-md"
                />
              </div>
            </div>
          )
        })}
      </Document>
    </div>
  )
}
