export const maxDuration = 30

import { put } from '@vercel/blob'
import { waitUntil } from '@vercel/functions'
import { sql } from '@/lib/db'
import { extractMetadata } from '@/lib/claude'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  // metaImage: JPEG של העמוד הראשון לחילוץ מטא-דטה (אופציונלי)
  const metaImage = formData.get('metaImage') as File | null

  const uniqueName = `${Date.now()}-${file.name}`
  const blob = await put(uniqueName, file, { access: 'public' })

  const rows = await sql`
    INSERT INTO documents (blob_url, filename, status)
    VALUES (${blob.url}, ${file.name}, 'processing')
    RETURNING id
  `
  const id = rows[0].id

  waitUntil(processDocument(id, blob.url, file.type, metaImage))

  return NextResponse.json({ id })
}

async function processDocument(id: string, blobUrl: string, mimeType: string, metaImage: File | null) {
  try {
    let buffer: Buffer
    let extractMime: string

    if (metaImage) {
      // השתמש ב-JPEG לחילוץ — הרבה יותר אמין לסרוקים
      buffer = Buffer.from(await metaImage.arrayBuffer())
      extractMime = metaImage.type
    } else {
      const res = await fetch(blobUrl)
      buffer = Buffer.from(await res.arrayBuffer())
      extractMime = mimeType
    }

    const metadata = await extractMetadata(buffer, extractMime)

    await sql`
      UPDATE documents SET
        doc_date  = ${metadata.doc_date},
        doctor    = ${metadata.doctor},
        hospital  = ${metadata.hospital},
        specialty = ${metadata.specialty},
        summary   = ${metadata.summary},
        keywords  = ${metadata.keywords},
        status    = 'ready'
      WHERE id = ${id}
    `
  } catch (e) {
    console.error('processDocument error:', e)
    await sql`UPDATE documents SET status = 'error' WHERE id = ${id}`
  }
}
