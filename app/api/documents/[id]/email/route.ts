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

  const senderName = process.env.SENDER_NAME || 'קרן ברקוביץ\''
  const fromAddress = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
  const from = `${senderName} <${fromAddress}>`

  const bodyText = message || `היי,\n\nמצרפת את המסמכים הרלוונטים.\n\nתודה\n${senderName}`

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <p style="font-size: 16px;">היי,</p>
      <p style="font-size: 16px;">${message ? message.replace(/\n/g, '<br>') : 'מצרפת את המסמכים הרלוונטים.'}</p>
      <br>
      <p style="font-size: 16px;">תודה</p>
      <p style="font-size: 16px; font-weight: bold;">${senderName}</p>
    </div>
  `

  const { error } = await resend.emails.send({
    from,
    to,
    subject: subject || `מסמכים רפואיים`,
    text: bodyText,
    html,
    attachments: [{ filename: doc.filename, content: pdfBuffer }],
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
