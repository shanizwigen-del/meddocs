import { sql } from '@/lib/db'
import { ensureFamilySchema } from '@/lib/schema'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  await ensureFamilySchema()
  const rows = await sql`
    SELECT
      m.id, m.name, m.relation, m.birth_date, m.color, m.created_at,
      COUNT(d.id)::int AS doc_count
    FROM family_members m
    LEFT JOIN documents d ON d.member_id = m.id
    GROUP BY m.id
    ORDER BY m.created_at ASC
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  await ensureFamilySchema()
  const body = await req.json()
  const name = (body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'שם חסר' }, { status: 400 })

  const rows = await sql`
    INSERT INTO family_members (name, relation, birth_date, color)
    VALUES (
      ${name},
      ${body.relation?.trim() || null},
      ${body.birth_date || null},
      ${body.color || null}
    )
    RETURNING id, name, relation, birth_date, color, created_at
  `
  return NextResponse.json(rows[0])
}
