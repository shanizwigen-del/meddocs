import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(req: NextRequest) {
  const { thumbnails, numPages } = await req.json() as { thumbnails: string[], numPages: number }
  if (!thumbnails?.length) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  // בניית הודעה עם thumbnails לכל עמוד
  const content: OpenAI.Chat.ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `להלן תמונות ממוזערות של ${numPages} עמודים מ-PDF שמכיל מספר מסמכים רפואיים שונים.
זהה היכן מתחיל כל מסמך חדש (כותרת חדשה, בית חולים שונה, סוג מסמך שונה, תאריך חדש בראש הדף).
החזר JSON בלבד:
{"groups":[[1,2],[3,4,5],[6]]}
כל עמוד חייב להופיע בדיוק פעם אחת. עמודים ${numPages}:`,
    },
  ]

  thumbnails.forEach((b64, i) => {
    content.push({ type: 'text', text: `עמוד ${i + 1}:` })
    content.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' },
    })
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    max_tokens: 500,
  })

  const text = response.choices[0].message.content ?? '{}'
  let parsed: { groups?: number[][] }
  try { parsed = JSON.parse(text) } catch { parsed = {} }

  let groups: number[][] = parsed.groups ?? []
  if (!groups.length) groups = Array.from({ length: numPages }, (_, i) => [i + 1])

  const allPages = groups.flat().sort((a, b) => a - b)
  const expected = Array.from({ length: numPages }, (_, i) => i + 1)
  if (JSON.stringify(allPages) !== JSON.stringify(expected)) {
    groups = expected.map(p => [p])
  }

  return NextResponse.json({ groups })
}
