import { resend } from '@/lib/resend'
import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { ids, to, subject, message } = await req.json()
  if (!ids?.length) return NextResponse.json({ error: 'No documents' }, { status: 400 })

  const rows = await sql`SELECT * FROM documents WHERE id = ANY(${ids})`
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const attachments = await Promise.all(
    rows.map(async (doc: { blob_url: string; filename: string }) => {
      const res = await fetch(doc.blob_url)
      const content = Buffer.from(await res.arrayBuffer())
      return { filename: doc.filename, content }
    })
  )

  const senderName = process.env.SENDER_NAME || 'קרן ברקוביץ\''
  const fromAddress = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
  const from = `${senderName} <${fromAddress}>`

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
    text: message || `היי,\n\nמצרפת את המסמכים הרלוונטים.\n\nתודה\n${senderName}`,
    html,
    attachments,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
