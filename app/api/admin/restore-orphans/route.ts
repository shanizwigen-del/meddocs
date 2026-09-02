export const maxDuration = 300

import { list } from '@vercel/blob'
import { sql } from '@/lib/db'
import { extractMetadata } from '@/lib/claude'
import { NextResponse } from 'next/server'

// שחזור קבצים "יתומים": קבצים ששמורים באחסון אך אינם מקושרים לאף מסמך.
// יוצר עבורם שורת מסמך חדשה (כך שיופיעו באפליקציה) ומנסה לחלץ מטא-דאטה.

const isImage = (name: string) => /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i.test(name)
const isThumb = (p: string) => p.split('/').pop()!.startsWith('thumb-')

function cleanName(pathname: string): string {
  const base = pathname.split('/').pop()!
  return base.replace(/^\d{10,}-/, '') // הסרת קידומת חותמת-זמן שנוספה בהעלאה
}

export async function POST() {
  // 1. איתור היתומים הנוכחיים (זהה ללוגיקת הבדיקה)
  const blobs: { url: string; pathname: string }[] = []
  let cursor: string | undefined
  do {
    const res = await list(cursor ? { cursor, limit: 1000 } : { limit: 1000 })
    for (const b of res.blobs) blobs.push({ url: b.url, pathname: b.pathname })
    cursor = res.hasMore ? res.cursor : undefined
  } while (cursor)

  const rows = await sql`SELECT blob_url, thumbnail_url FROM documents`
  const linked = new Set<string>()
  for (const r of rows) {
    if (r.blob_url) linked.add(r.blob_url)
    if (r.thumbnail_url) linked.add(r.thumbnail_url)
  }

  const orphans = blobs.filter(b => !isThumb(b.pathname) && !linked.has(b.url))

  // 2. שחזור כל יתום: יצירת שורת מסמך + ניסיון לחלץ מטא-דאטה
  const results: { filename: string; status: string }[] = []
  for (const o of orphans) {
    const filename = cleanName(o.pathname)
    const thumbnailUrl = isImage(filename) ? o.url : null
    const ins = await sql`
      INSERT INTO documents (blob_url, filename, status, thumbnail_url)
      VALUES (${o.url}, ${filename}, 'processing', ${thumbnailUrl})
      RETURNING id
    `
    const id = ins[0].id
    try {
      const res = await fetch(o.url)
      const buffer = Buffer.from(await res.arrayBuffer())
      const mime = isImage(filename) ? 'image/jpeg' : 'application/pdf'
      const metadata = await extractMetadata(buffer, mime)
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
      results.push({ filename, status: 'ready' })
    } catch {
      // הקובץ שוחזר ומופיע, רק חילוץ המטא-דאטה נכשל — ניתן לערוך ידנית
      await sql`UPDATE documents SET status = 'ready' WHERE id = ${id}`
      results.push({ filename, status: 'ready (ללא מטא-דאטה)' })
    }
  }

  return NextResponse.json({ restoredCount: results.length, results })
}
