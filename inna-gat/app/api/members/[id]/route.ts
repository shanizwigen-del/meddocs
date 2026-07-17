import { sql } from '@/lib/db'
import { ensureFamilySchema } from '@/lib/schema'
import { del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureFamilySchema()
  const { id } = await params
  const rows = await sql`SELECT * FROM family_members WHERE id = ${id}`
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureFamilySchema()
  const { id } = await params
  const body = await req.json()

  await sql`UPDATE family_members SET
    name       = CASE WHEN ${body.name       !== undefined} THEN ${body.name?.trim()     ?? null} ELSE name       END,
    relation   = CASE WHEN ${body.relation   !== undefined} THEN ${body.relation?.trim() || null} ELSE relation   END,
    birth_date = CASE WHEN ${body.birth_date !== undefined} THEN ${body.birth_date       || null} ELSE birth_date END,
    color      = CASE WHEN ${body.color      !== undefined} THEN ${body.color            || null} ELSE color      END
  WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureFamilySchema()
  const { id } = await params

  // מחיקת קבצי ה-blob של כל מסמכי בן המשפחה לפני מחיקת הרשומות
  const docs = await sql`SELECT blob_url FROM documents WHERE member_id = ${id}`
  await Promise.all(
    docs.map(d => del(d.blob_url).catch(() => {}))
  )

  // מחיקת בן המשפחה — ON DELETE CASCADE מוחק את רשומות המסמכים
  await sql`DELETE FROM family_members WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
