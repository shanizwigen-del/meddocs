export const maxDuration = 300

import { sql } from '@/lib/db'
import { PDFDocument } from 'pdf-lib'
import { NextResponse } from 'next/server'

// סופר את סך כל העמודים בכל המסמכים שבאפליקציה (פותח כל PDF וסופר עמודים).
// קובצי תמונה נחשבים עמוד אחד. קבצים שנכשלו בפתיחה מדווחים בנפרד.

const isImage = (name: string) => /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i.test(name)

async function pagesFor(blobUrl: string, filename: string): Promise<number | null> {
  if (isImage(filename) || isImage(blobUrl)) return 1
  try {
    const res = await fetch(blobUrl)
    const buf = await res.arrayBuffer()
    const pdf = await PDFDocument.load(buf, { ignoreEncryption: true })
    return pdf.getPageCount()
  } catch {
    return null // נכשל בפתיחה
  }
}

export async function GET() {
  const rows = await sql`SELECT blob_url, filename FROM documents WHERE blob_url IS NOT NULL`

  let totalPages = 0
  let failed = 0
  const documents: { filename: string; pages: number | null }[] = []

  const CONCURRENCY = 5
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY)
    const counts = await Promise.all(
      chunk.map(async (r) => ({
        filename: r.filename as string,
        pages: await pagesFor(r.blob_url as string, r.filename as string),
      }))
    )
    for (const c of counts) {
      if (c.pages === null) failed++
      else totalPages += c.pages
      documents.push(c)
    }
  }

  return NextResponse.json({
    totalDocuments: rows.length,
    totalPages,
    failed,
    documents: documents.sort((a, b) => (b.pages ?? -1) - (a.pages ?? -1)).slice(0, 1000),
  })
}
