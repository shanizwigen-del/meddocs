import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export interface ExtractedMetadata {
  doc_date: string | null
  doctor: string | null
  hospital: string | null
  specialty: string
  summary: string
  keywords: string[]
}

const SPECIALTIES_LIST = 'פסיכיאטריה | נוירולוגיה | קרדיולוגיה | אורטופדיה | רפואה פנימית | גסטרו | אנדוקרינולוגיה | ראומטולוגיה | אלרגיה | עיניים | אא"ג | עור | גינקולוגיה | אונקולוגיה | בדיקות מעבדה | הדמיה | אחר'

export async function extractMetadata(pdfBuffer: Buffer): Promise<ExtractedMetadata> {
  const base64 = pdfBuffer.toString('base64')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 }
        },
        {
          type: 'text',
          text: `חלץ מידע ממסמך רפואי זה והחזר JSON בלבד:
{
  "doc_date": "YYYY-MM-DD או null",
  "doctor": "שם הרופא המלא או null",
  "hospital": "שם בית החולים/מרפאה או null",
  "specialty": "אחד מ: ${SPECIALTIES_LIST}",
  "summary": "תיאור קצר 1-2 משפטים בעברית",
  "keywords": ["מילות", "מפתח"]
}
החזר JSON בלבד.`
        }
      ]
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const clean = text.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(clean)
}
