import { sql } from '@/lib/db'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File
  const docId = form.get('docId') as string
  if (!file || !docId) return NextResponse.json({ error: 'missing' }, { status: 400 })

  const blob = await put(`thumb-${docId}.jpg`, file, { access: 'public' })
  await sql`UPDATE documents SET thumbnail_url = ${blob.url} WHERE id = ${docId}`

  return NextResponse.json({ ok: true })
}
