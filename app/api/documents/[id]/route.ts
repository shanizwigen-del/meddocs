import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sql`SELECT * FROM documents WHERE id = ${id}`
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { page_rotations } = await req.json()

  // הוספת עמודה אם לא קיימת (idempotent)
  await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS page_rotations jsonb DEFAULT '{}'`

  await sql`UPDATE documents SET page_rotations = ${JSON.stringify(page_rotations)} WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
