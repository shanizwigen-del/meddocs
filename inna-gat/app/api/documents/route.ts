import { sql } from '@/lib/db'
import { ensureFamilySchema } from '@/lib/schema'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  await ensureFamilySchema()
  const { searchParams } = new URL(req.url)
  const q         = searchParams.get('q') ?? ''
  const specialty = searchParams.get('specialty') ?? ''
  const year      = searchParams.get('year') ?? ''
  const member    = searchParams.get('member') ?? ''

  const rows = await sql`
    SELECT * FROM documents
    WHERE
      (${member} = '' OR member_id = ${member === '' ? null : member})
      AND (${specialty} = '' OR specialty = ${specialty})
      AND (${year} = '' OR EXTRACT(YEAR FROM doc_date) = ${year === '' ? null : parseInt(year)})
      AND (
        ${q} = ''
        OR doctor   ILIKE ${'%' + q + '%'}
        OR hospital ILIKE ${'%' + q + '%'}
        OR summary  ILIKE ${'%' + q + '%'}
        OR ${q} = ANY(keywords)
      )
    ORDER BY doc_date DESC NULLS LAST, created_at DESC
  `

  return NextResponse.json(rows)
}
