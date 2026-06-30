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

  // שם השולח — שם הרופא אם קיים, אחרת שם כללי
  const senderName = doc.doctor ? `ד"ר ${doc.doctor}` : 'מערכת מסמכים רפואית'
  const fromAddress = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
  const from = `${senderName} <${fromAddress}>`

  const { error } = await resend.emails.send({
    from,
    to,
    subject: subject || `מסמך רפואי: ${doc.specialty ?? ''} - ${doc.doc_date ?? ''}`,
    text: message || `שלום,\n\nמצורף מסמך רפואי: ${doc.filename}\n\n${senderName}`,
    attachments: [{ filename: doc.filename, content: pdfBuffer }],
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
