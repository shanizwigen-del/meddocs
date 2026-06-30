import { resend } from '@/lib/resend'
import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { to, subject, message } = await req.json()

  const { data: doc } = await supabase.from('documents').select('*').eq('id', id).single()
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const pdfRes = await fetch(doc.blob_url)
  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer())

  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to,
    subject: subject || `מסמך רפואי: ${doc.specialty} - ${doc.doc_date}`,
    text: message || `מצורף מסמך: ${doc.filename}`,
    attachments: [{ filename: doc.filename, content: pdfBuffer }],
  })

  return NextResponse.json({ ok: true })
}
