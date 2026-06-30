import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(req: NextRequest) {
  const { pageTexts } = await req.json()
  if (!Array.isArray(pageTexts)) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const numPages = pageTexts.length
  const pagesDescription = (pageTexts as string[])
    .map((t, i) => `עמוד ${i + 1}: ${(t || '[ריק]').slice(0, 600)}`)
    .join('\n\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `להלן תוכן טקסטואלי של ${numPages} עמודים מ-PDF שמכיל מספר מסמכים רפואיים.
זהה היכן מתחיל כל מסמך חדש (לפי כותרת, תאריך, מוסד, שינוי בתוכן).
החזר JSON בלבד — מערך של מערכים עם מספרי עמודים (מ-1):
{"groups":[[1,2],[3,4,5],[6]]}
כל עמוד חייב להופיע בדיוק פעם אחת.

${pagesDescription}

החזר JSON בלבד:`,
    }],
    response_format: { type: 'json_object' },
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
