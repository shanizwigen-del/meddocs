import { resend } from '@/lib/resend'
import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { to, subject, message } = await req.json()

  const rows = await sql`SELECT * FROM documents WHERE id = ${id}`
  const doc = rows[0]
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const pdfRes = await fetch(doc.blob_url)
  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer())

  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL ?? 'onboarding@resend.dev',
    to,
    subject: subject || `מסמך רפואי: ${doc.specialty} - ${doc.doc_date}`,
    text: message || `מצורף מסמך: ${doc.filename}`,
    attachments: [{ filename: doc.filename, content: pdfBuffer }],
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
