import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabase.from('documents').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error }, { status: 404 })
  return NextResponse.json(data)
}
