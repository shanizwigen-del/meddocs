import { sql } from '@/lib/db'
import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sql`SELECT * FROM documents WHERE id = ${id}`
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sql`SELECT blob_url FROM documents WHERE id = ${id}`
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await del(rows[0].blob_url)
  await sql`DELETE FROM documents WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  if (body.page_rotations !== undefined) {
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS page_rotations jsonb DEFAULT '{}'`
    await sql`UPDATE documents SET page_rotations = ${JSON.stringify(body.page_rotations)} WHERE id = ${id}`
  }

  if (body.doctor !== undefined || body.hospital !== undefined) {
    await sql`UPDATE documents SET
      doctor   = COALESCE(${body.doctor   ?? null}, doctor),
      hospital = COALESCE(${body.hospital ?? null}, hospital)
    WHERE id = ${id}`
  }
  return NextResponse.json({ ok: true })
}
