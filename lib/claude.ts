import OpenAI from 'openai'
import { extractTextWithVision } from './ocr'

const client = new OpenAI()

export interface ExtractedMetadata {
  doc_date: string | null
  doctor: string | null
  hospital: string | null
  specialty: string
  summary: string
  keywords: string[]
}

const SPECIALTIES_LIST = 'בריאות הנפש | פסיכיאטריה | פסיכולוגיה | נוירולוגיה | קרדיולוגיה | אורטופדיה | רפואה פנימית | רפואת משפחה | גסטרו | אנדוקרינולוגיה | ראומטולוגיה | אלרגיה | עיניים | אא"ג | עור | גינקולוגיה | אונקולוגיה | בדיקות מעבדה | הדמיה | אחר'

function buildPrompt(ocrText?: string) {
  const ocrSection = ocrText
    ? `\n\nטקסט שחולץ מהמסמך (OCR):\n"""\n${ocrText.slice(0, 3000)}\n"""\n`
    : ''

  return `אתה מנתח מסמכים רפואיים. חלץ מידע מהמסמך המצורף.${ocrSection}
חוקים:
- שם רופא: חפש "ד"ר", "Dr.", "פרופ'", חתימה — שם בלי תואר. אם אין — null
- תחום רפואי: בחר מהרשימה המדויקת בהתאם לתוכן
- תאריך: YYYY-MM-DD או null

החזר JSON בלבד, ללא הסברים:
{
  "doc_date": "YYYY-MM-DD או null",
  "doctor": "שם בלבד או null",
  "hospital": "שם מוסד או null",
  "specialty": "בחר אחד מ: ${SPECIALTIES_LIST}",
  "summary": "",
  "keywords": []
}`
}

export async function extractMetadata(fileBuffer: Buffer, mimeType = 'application/pdf'): Promise<ExtractedMetadata> {
  const fallback: ExtractedMetadata = {
    doc_date: null, doctor: null, hospital: null,
    specialty: 'אחר', summary: '', keywords: [],
  }

  try {
    const base64 = fileBuffer.toString('base64')
    const isImage = mimeType.startsWith('image/')

    // OCR עם Google Vision לתמונות — משפר דרמטית את הדיוק
    let ocrText: string | undefined
    if (isImage) {
      ocrText = await extractTextWithVision(base64, mimeType)
    }

    const fileContent = isImage
      ? { type: 'input_image' as const, image_url: `data:${mimeType};base64,${base64}`, detail: 'auto' as const }
      : { type: 'input_file' as const, filename: 'document.pdf', file_data: `data:application/pdf;base64,${base64}` }

    const response = await client.responses.create({
      model: 'gpt-4o',
      input: [{
        role: 'user',
        content: [
          fileContent,
          { type: 'input_text', text: buildPrompt(ocrText) },
        ],
      }],
    })

    const text = response.output_text ?? ''
    const clean = text.replace(/```json\n?|\n?```/g, '').trim()
    if (!clean) return fallback

    const parsed = JSON.parse(clean)
    return {
      doc_date: parsed.doc_date ?? null,
      doctor: parsed.doctor ?? null,
      hospital: parsed.hospital ?? null,
      specialty: parsed.specialty ?? 'אחר',
      summary: parsed.summary ?? '',
      keywords: parsed.keywords ?? [],
    }
  } catch (e) {
    console.error('extractMetadata error:', e)
    return fallback
  }
}
