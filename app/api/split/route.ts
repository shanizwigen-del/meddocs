export const maxDuration = 60

import { put, del } from '@vercel/blob'
import { waitUntil } from '@vercel/functions'
import { sql } from '@/lib/db'
import { extractMetadata } from '@/lib/claude'
import { PDFDocument } from 'pdf-lib'
import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI()

async function extractPageTexts(buffer: Buffer): Promise<string[]> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const tc = await page.getTextContent()
    const text = (tc.items as { str: string }[]).map(item => item.str).join(' ').slice(0, 800)
    pages.push(text)
  }
  return pages
}

async function detectPageGroups(pageTexts: string[]): Promise<number[][]> {
  const numPages = pageTexts.length
  const pagesDescription = pageTexts
    .map((t, i) => `עמוד ${i + 1}: ${t || '[ריק]'}`)
    .join('\n\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `להלן תוכן טקסטואלי של ${numPages} עמודים מ-PDF שמכיל מספר מסמכים רפואיים.
זהה היכן מתחיל כל מסמך חדש (לפי כותרת, תאריך, מוסד, שינוי בתוכן).
החזר JSON בלבד — מערך של מערכים עם מספרי עמודים (מ-1):
[[1,2],[3,4,5],[6]]
כל עמוד חייב להופיע בדיוק פעם אחת.

${pagesDescription}

החזר JSON בלבד:`,
    }],
    response_format: { type: 'json_object' },
  })

  const text = response.choices[0].message.content ?? '{}'
  let parsed
  try { parsed = JSON.parse(text) } catch {
    return Array.from({ length: numPages }, (_, i) => [i + 1])
  }

  const groups: number[][] = Array.isArray(parsed) ? parsed : (parsed.groups ?? parsed[Object.keys(parsed)[0]])
  if (!Array.isArray(groups)) return Array.from({ length: numPages }, (_, i) => [i + 1])

  const allPages = groups.flat().sort((a, b) => a - b)
  const expected = Array.from({ length: numPages }, (_, i) => i + 1)
  if (JSON.stringify(allPages) !== JSON.stringify(expected)) return expected.map(p => [p])
  return groups
}

async function extractPages(pdfBytes: Uint8Array, pages: number[]): Promise<Buffer> {
  const srcDoc = await PDFDocument.load(pdfBytes)
  const newDoc = await PDFDocument.create()
  const copied = await newDoc.copyPages(srcDoc, pages.map(p => p - 1))
  copied.forEach(p => newDoc.addPage(p))
  return Buffer.from(await newDoc.save())
}

async function processGroups(buffer: Buffer, originalFilename: string, groups: number[][], tempUrl: string) {
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
          doc_date=${metadata.doc_date}, doctor=${metadata.doctor},
          hospital=${metadata.hospital}, specialty=${metadata.specialty},
          summary=${metadata.summary}, keywords=${metadata.keywords}, status='ready'
        WHERE id=${id}
      `
    } catch (e) {
      console.error(`processGroup ${i} error:`, e)
    }
  }
  // מחיקת הקובץ הזמני
  try { await del(tempUrl) } catch {}
}

export async function POST(req: NextRequest) {
  const { blobUrl, filename } = await req.json()
  if (!blobUrl) return NextResponse.json({ error: 'No blobUrl' }, { status: 400 })

  const res = await fetch(blobUrl)
  const buffer = Buffer.from(await res.arrayBuffer())

  const pdfDoc = await PDFDocument.load(buffer)
  const numPages = pdfDoc.getPageCount()
  const originalFilename = filename || 'document.pdf'

  if (numPages === 1) {
    const rows = await sql`INSERT INTO documents (blob_url, filename, status) VALUES (${blobUrl}, ${originalFilename}, 'processing') RETURNING id`
    waitUntil((async () => {
      const metadata = await extractMetadata(buffer)
      await sql`UPDATE documents SET doc_date=${metadata.doc_date}, doctor=${metadata.doctor}, hospital=${metadata.hospital}, specialty=${metadata.specialty}, summary=${metadata.summary}, keywords=${metadata.keywords}, status='ready' WHERE id=${rows[0].id}`
    })())
    return NextResponse.json({ count: 1, pages: 1 })
  }

  const pageTexts = await extractPageTexts(buffer)
  const groups = await detectPageGroups(pageTexts)

  waitUntil(processGroups(buffer, originalFilename, groups, blobUrl))

  return NextResponse.json({ count: groups.length, pages: numPages })
}
