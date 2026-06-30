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

const SPECIALTIES_LIST = 'בריאות הנפש | פסיכיאטריה | פסיכולוגיה | נוירולוגיה | קרדיולוגיה | אורטופדיה | רפואה פנימית | גסטרו | אנדוקרינולוגיה | ראומטולוגיה | אלרגיה | עיניים | אא"ג | עור | גינקולוגיה | אונקולוגיה | בדיקות מעבדה | הדמיה | אחר'

const PROMPT = `חלץ מידע ממסמך רפואי זה והחזר JSON בלבד.

חוקים לחילוץ שם הרופא:
- חפש "ד"ר", "Dr.", "פרופ'", "Prof.", "הרופא המטפל", "רופא מפנה", "חתימה" — השם שאחריהם הוא שם הרופא
- חפש שמות עם תואר רפואי (MD, M.D.) — הם שמות רופאים
- בדוח מרפאה — הרופא הכותב/המאשר הוא הרלוונטי
- אם יש כמה רופאים — העדף את המטפל הראשי/הכותב
- אם אין שם רופא ברור — החזר null

{
  "doc_date": "YYYY-MM-DD או null — תאריך המסמך/הסיכום/הביקור",
  "doctor": "שם הרופא בלבד ללא תואר (לדוגמה: כהן דוד) או null",
  "hospital": "שם בית החולים/מרפאה/קופת חולים או null",
  "specialty": "אחד מ: ${SPECIALTIES_LIST}",
  "summary": "",
  "keywords": []
}
החזר JSON בלבד. אין הסברים.`

export async function extractMetadata(fileBuffer: Buffer, mimeType = 'application/pdf'): Promise<ExtractedMetadata> {
  const base64 = fileBuffer.toString('base64')
  const isImage = mimeType.startsWith('image/')

  const fileContent = isImage
    ? { type: 'input_image' as const, image_url: `data:${mimeType};base64,${base64}`, detail: 'auto' as const }
    : { type: 'input_file' as const, filename: 'document.pdf', file_data: `data:application/pdf;base64,${base64}` }

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    input: [
      {
        role: 'user',
        content: [
          fileContent,
          { type: 'input_text', text: PROMPT },
        ],
      },
    ],
  })

  const text = response.output_text ?? '{}'
  const clean = text.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(clean)
}
