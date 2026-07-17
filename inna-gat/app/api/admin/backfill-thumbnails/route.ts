import { sql } from '@/lib/db'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST() {
  // מסמכים ללא thumbnail
  const docs = await sql`
    SELECT id, blob_url, filename FROM documents
    WHERE thumbnail_url IS NULL AND status = 'ready'
    ORDER BY created_at DESC
    LIMIT 50
  `

  let updated = 0
  let skipped = 0

  for (const doc of docs) {
    try {
      const isImage = /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i.test(doc.filename) ||
        /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i.test(doc.blob_url)

      if (isImage) {
        // תמונה — ה-blob_url עצמה היא ה-thumbnail
        await sql`UPDATE documents SET thumbnail_url = ${doc.blob_url} WHERE id = ${doc.id}`
        updated++
      } else {
        // PDF — נוריד ונחלץ עמוד ראשון בצד השרת (לא זמין בסביבת Vercel Edge)
        // מסמנים כ-skip — יש לטפל בצד הלקוח בעתיד
        skipped++
      }
    } catch (e) {
      console.error('backfill error for', doc.id, e)
      skipped++
    }
  }

  return NextResponse.json({ updated, skipped, total: docs.length })
}
