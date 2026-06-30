export const maxDuration = 60

export const config = {
  api: { bodyParser: { sizeLimit: '50mb' } },
}

import { put } from '@vercel/blob'
import { waitUntil } from '@vercel/functions'
import { sql } from '@/lib/db'
import { extractMetadata } from '@/lib/claude'
import { PDFDocument } from 'pdf-lib'
import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI()

async function detectPageGroups(pdfBase64: string, numPages: number): Promise<number[][]> {
  const response = await openai.responses.create({
    model: 'gpt-4o',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_file',
            filename: 'document.pdf',
            file_data: `data:application/pdf;base64,${pdfBase64}`,
          },
          {
            type: 'input_text',
            text: `PDF זה מכיל ${numPages} עמודים — מספר מסמכים רפואיים סרוקים אחד אחרי השני.
זהה היכן מתחיל כל מסמך חדש (לפי כותרת חדשה, תאריך חדש, מוסד חדש, שינוי בפורמט).
החזר JSON בלבד — מערך של מערכים עם מספרי עמודים (מ-1):
[[1,2,3],[4],[5,6],[7,8,9,10]]
חשוב: כל עמוד חייב להופיע בדיוק פעם אחת. החזר JSON בלבד ללא הסברים.`,
          },
        ],
      },
    ],
  })

  const text = (response.output_text ?? '').replace(/```json\n?|\n?```/g, '').trim()
  const groups: number[][] = JSON.parse(text)

  // וידוא שכל העמודים נכללו
  const allPages = groups.flat().sort((a, b) => a - b)
  const expected = Array.from({ length: numPages }, (_, i) => i + 1)
  if (JSON.stringify(allPages) !== JSON.stringify(expected)) {
    // fallback: כל עמוד בנפרד
    return expected.map(p => [p])
  }
  return groups
}

async function extractPages(pdfBytes: Uint8Array, pages: number[]): Promise<Buffer> {
  const srcDoc = await PDFDocument.load(pdfBytes)
  const newDoc = await PDFDocument.create()
  const copied = await newDoc.copyPages(srcDoc, pages.map(p => p - 1))
  copied.forEach(p => newDoc.addPage(p))
  const bytes = await newDoc.save()
  return Buffer.from(bytes)
}

async function processGroup(buffer: Buffer, originalFilename: string, groupIndex: number, totalGroups: number) {
  try {
    const name = `${Date.now()}-part${groupIndex + 1}-${originalFilename}`
    const blob = await put(name, buffer, { access: 'public' })

    const rows = await sql`
      INSERT INTO documents (blob_url, filename, status)
      VALUES (${blob.url}, ${`חלק ${groupIndex + 1}/${totalGroups} — ${originalFilename}`}, 'processing')
      RETURNING id
    `
    const id = rows[0].id

    const metadata = await extractMetadata(buffer)
    await sql`
      UPDATE documents SET
        doc_date  = ${metadata.doc_date},
        doctor    = ${metadata.doctor},
        hospital  = ${metadata.hospital},
        specialty = ${metadata.specialty},
        summary   = ${metadata.summary},
        keywords  = ${metadata.keywords},
        status    = 'ready'
      WHERE id = ${id}
    `
  } catch (e) {
    console.error(`processGroup ${groupIndex} error:`, e)
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const pdfDoc = await PDFDocument.load(buffer)
  const numPages = pdfDoc.getPageCount()

  // PDF עם עמוד אחד — עיבוד רגיל
  if (numPages === 1) {
    const blob = await put(`${Date.now()}-${file.name}`, buffer, { access: 'public' })
    const rows = await sql`INSERT INTO documents (blob_url, filename, status) VALUES (${blob.url}, ${file.name}, 'processing') RETURNING id`
    waitUntil((async () => {
      const metadata = await extractMetadata(buffer)
      await sql`UPDATE documents SET doc_date=${metadata.doc_date}, doctor=${metadata.doctor}, hospital=${metadata.hospital}, specialty=${metadata.specialty}, summary=${metadata.summary}, keywords=${metadata.keywords}, status='ready' WHERE id=${rows[0].id}`
    })())
    return NextResponse.json({ count: 1 })
  }

  // PDF מרובה עמודים — זיהוי גבולות וחלוקה
  const base64 = buffer.toString('base64')
  const groups = await detectPageGroups(base64, numPages)

  waitUntil((async () => {
    for (let i = 0; i < groups.length; i++) {
      const pageBuffer = await extractPages(new Uint8Array(buffer), groups[i])
      await processGroup(pageBuffer, file.name, i, groups.length)
    }
  })())

  return NextResponse.json({ count: groups.length, pages: numPages })
}
