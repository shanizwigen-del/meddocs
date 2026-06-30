import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q         = searchParams.get('q')
  const specialty = searchParams.get('specialty')
  const doctor    = searchParams.get('doctor')
  const year      = searchParams.get('year')

  let query = supabase
    .from('documents')
    .select('*')
    .order('doc_date', { ascending: false, nullsFirst: false })

  if (specialty) query = query.eq('specialty', specialty)
  if (doctor)    query = query.ilike('doctor', `%${doctor}%`)
  if (year)      query = query.gte('doc_date', `${year}-01-01`).lte('doc_date', `${year}-12-31`)
  if (q)         query = query.or(`doctor.ilike.%${q}%,hospital.ilike.%${q}%,summary.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}
