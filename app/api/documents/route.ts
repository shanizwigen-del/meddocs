import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q         = searchParams.get('q') ?? ''
  const specialty = searchParams.get('specialty') ?? ''
  const year      = searchParams.get('year') ?? ''

  const rows = await sql`
    SELECT * FROM documents
    WHERE
      (${specialty} = '' OR specialty = ${specialty})
      AND (${year} = '' OR EXTRACT(YEAR FROM doc_date) = ${year}::int)
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
