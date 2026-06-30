export const maxDuration = 60

import { put } from '@vercel/blob'
import { waitUntil } from '@vercel/functions'
import { sql } from '@/lib/db'
import { extractMetadata } from '@/lib/claude'
import { PDFDocument } from 'pdf-lib'
import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI()

// חילוץ טקסט מכל עמוד ב-PDF
async function extractPageTexts(buffer: Buffer): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse')
  const pages: string[] = []

  await pdfParse(buffer, {
    pagerender: (pageData: { getTextContent: () => Promise<{ items: { str: string }[] }> }) =>
      pageData.getTextContent().then((tc: { items: { str: string }[] }) => {
        pages.push(tc.items.map((i: { str: string }) => i.str).join(' ').slice(0, 800))
        return ''
      }),
  })
  return pages
}

async function detectPageGroups(pageTexts: string[]): Promise<number[][]> {
  const numPages = pageTexts.length
  const pagesDescription = pageTexts
    .map((t, i) => `עמוד ${i + 1}: ${t || '[ריק]'}`)
    .join('\n\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `להלן תוכן טקסטואלי של ${numPages} עמודים מ-PDF שמכיל מספר מסמכים רפואיים.
זהה היכן מתחיל כל מסמך חדש (לפי כותרת, תאריך, מוסד, שינוי בתוכן).
החזר JSON בלבד — מערך של מערכים עם מספרי עמודים (מ-1):
[[1,2],[3,4,5],[6]]
כל עמוד חייב להופיע בדיוק פעם אחת.

${pagesDescription}

החזר JSON בלבד:`,
      },
    ],
    response_format: { type: 'json_object' },
  })

  const text = response.choices[0].message.content ?? '{}'
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return Array.from({ length: numPages }, (_, i) => [i + 1])
  }

  // תמיכה בפורמט { groups: [...] } או מערך ישיר
  const groups: number[][] = Array.isArray(parsed) ? parsed : (parsed.groups ?? parsed[Object.keys(parsed)[0]])

  if (!Array.isArray(groups)) return Array.from({ length: numPages }, (_, i) => [i + 1])

  const allPages = groups.flat().sort((a, b) => a - b)
  const expected = Array.from({ length: numPages }, (_, i) => i + 1)
  if (JSON.stringify(allPages) !== JSON.stringify(expected)) {
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

async function processGroups(buffer: Buffer, originalFilename: string, groups: number[][]) {
  for (let i = 0; i < groups.length; i++) {
    try {
      const pageBuffer = await extractPages(new Uint8Array(buffer), groups[i])
      const name = `${Date.now()}-part${i + 1}-${originalFilename}`
      const blob = await put(name, pageBuffer, { access: 'public' })

      const rows = await sql`
        INSERT INTO documents (blob_url, filename, status)
        VALUES (${blob.url}, ${`עמודים ${groups[i].join(',')} — ${originalFilename}`}, 'processing')
        RETURNING id
      `
      const id = rows[0].id

      const metadata = await extractMetadata(pageBuffer)
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
      console.error(`processGroup ${i} error:`, e)
    }
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const pdfDoc = await PDFDocument.load(buffer)
  const numPages = pdfDoc.getPageCount()

  if (numPages === 1) {
    const blob = await put(`${Date.now()}-${file.name}`, buffer, { access: 'public' })
    const rows = await sql`INSERT INTO documents (blob_url, filename, status) VALUES (${blob.url}, ${file.name}, 'processing') RETURNING id`
    waitUntil((async () => {
      const metadata = await extractMetadata(buffer)
      await sql`UPDATE documents SET doc_date=${metadata.doc_date}, doctor=${metadata.doctor}, hospital=${metadata.hospital}, specialty=${metadata.specialty}, summary=${metadata.summary}, keywords=${metadata.keywords}, status='ready' WHERE id=${rows[0].id}`
    })())
    return NextResponse.json({ count: 1, pages: 1 })
  }

  // חילוץ טקסט וזיהוי גבולות
  const pageTexts = await extractPageTexts(buffer)
  const groups = await detectPageGroups(pageTexts)

  waitUntil(processGroups(buffer, file.name, groups))

  return NextResponse.json({ count: groups.length, pages: numPages })
}
