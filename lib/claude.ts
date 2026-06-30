import OpenAI from 'openai'

const client = new OpenAI()

export interface ExtractedMetadata {
  doc_date: string | null
  doctor: string | null
  hospital: string | null
  specialty: string
  summary: string
  keywords: string[]
}

const SPECIALTIES_LIST = 'פסיכיאטריה | נוירולוגיה | קרדיולוגיה | אורטופדיה | רפואה פנימית | גסטרו | אנדוקרינולוגיה | ראומטולוגיה | אלרגיה | עיניים | אא"ג | עור | גינקולוגיה | אונקולוגיה | בדיקות מעבדה | הדמיה | אחר'

const PROMPT = `חלץ מידע ממסמך רפואי זה והחזר JSON בלבד:
{
  "doc_date": "YYYY-MM-DD או null — תאריך המסמך/הסיכום",
  "doctor": "שם הרופא המלא או null",
  "hospital": "שם בית החולים/מרפאה או null",
  "specialty": "אחד מ: ${SPECIALTIES_LIST}",
  "summary": "",
  "keywords": []
}
החזר JSON בלבד.`

export async function extractMetadata(pdfBuffer: Buffer): Promise<ExtractedMetadata> {
  const base64 = pdfBuffer.toString('base64')

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_file',
            filename: 'document.pdf',
            file_data: `data:application/pdf;base64,${base64}`,
          },
          {
            type: 'input_text',
            text: PROMPT,
          },
        ],
      },
    ],
  })

  const text = response.output_text ?? '{}'
  const clean = text.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(clean)
}
