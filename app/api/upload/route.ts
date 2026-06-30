import { put } from '@vercel/blob'
import { sql } from '@/lib/db'
import { extractMetadata } from '@/lib/claude'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const blob = await put(file.name, file, { access: 'public' })

  const rows = await sql`
    INSERT INTO documents (blob_url, filename, status)
    VALUES (${blob.url}, ${file.name}, 'processing')
    RETURNING id
  `
  const id = rows[0].id

  processDocument(id, blob.url).catch(console.error)

  return NextResponse.json({ id })
}

async function processDocument(id: string, blobUrl: string) {
  try {
    const res = await fetch(blobUrl)
    const buffer = Buffer.from(await res.arrayBuffer())
    const metadata = await extractMetadata(buffer)

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
  } catch {
    await sql`UPDATE documents SET status = 'error' WHERE id = ${id}`
  }
}
