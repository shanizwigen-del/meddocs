import { sql } from '@/lib/db'
import { savePrivate } from '@/lib/files'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File
  const docId = form.get('docId') as string
  if (!file || !docId) return NextResponse.json({ error: 'missing' }, { status: 400 })

  const thumbnailUrl = await savePrivate(`thumb-${docId}.jpg`, file)
  await sql`UPDATE documents SET thumbnail_url = ${thumbnailUrl} WHERE id = ${docId}`

  return NextResponse.json({ ok: true })
}
