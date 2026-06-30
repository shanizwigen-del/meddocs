import { put } from '@vercel/blob'
import { supabase } from '@/lib/supabase'
import { extractMetadata } from '@/lib/claude'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const blob = await put(file.name, file, { access: 'public' })

  const { data, error } = await supabase
    .from('documents')
    .insert({ blob_url: blob.url, filename: file.name, status: 'processing' })
    .select('id')
    .single()

  if (error || !data) return NextResponse.json({ error }, { status: 500 })

  processDocument(data.id, blob.url).catch(console.error)

  return NextResponse.json({ id: data.id })
}

async function processDocument(id: string, blobUrl: string) {
  try {
    const res = await fetch(blobUrl)
    const buffer = Buffer.from(await res.arrayBuffer())
    const metadata = await extractMetadata(buffer)

    await supabase
      .from('documents')
      .update({ ...metadata, status: 'ready' })
      .eq('id', id)
  } catch {
    await supabase.from('documents').update({ status: 'error' }).eq('id', id)
  }
}
