import { resend } from '@/lib/resend'
import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const SENDER_NAME   = process.env.SENDER_NAME    || 'קרן ברקוביץ\''
const REPLY_TO      = process.env.REPLY_TO_EMAIL  || 'Kandob11@gmail.com'
const PHONE         = process.env.SENDER_PHONE    || '050-9669110'

function buildHtml(message: string, senderName: string) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.7;">
      <p style="font-size: 16px;">היי,</p>
      <p style="font-size: 16px;">${message.replace(/\n/g, '<br>')}</p>
      <br>
      <p style="font-size: 16px;">תודה,<br><strong>${senderName}</strong></p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 13px; color: #888;">
        נייד: ${PHONE}<br>
        מייל: <a href="mailto:${REPLY_TO}" style="color: #888;">${REPLY_TO}</a>
      </p>
    </div>
  `
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { to, subject, message } = await req.json()

  const rows = await sql`SELECT * FROM documents WHERE id = ${id}`
  const doc = rows[0]
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const pdfRes = await fetch(doc.blob_url)
  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer())

  const fromAddress = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
  const body = message || 'מצרפת את המסמכים הרלוונטים.'

  const { error } = await resend.emails.send({
    from: `${SENDER_NAME} <${fromAddress}>`,
    to,
    reply_to: REPLY_TO,
    subject: subject || 'מסמכים רפואיים',
    text: `היי,\n\n${body}\n\nתודה,\n${SENDER_NAME}\nנייד: ${PHONE}\nמייל: ${REPLY_TO}`,
    html: buildHtml(body, SENDER_NAME),
    attachments: [{ filename: doc.filename, content: pdfBuffer }],
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
