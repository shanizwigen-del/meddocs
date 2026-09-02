export const maxDuration = 60

import { list } from '@vercel/blob'
import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

// בדיקה קריאה-בלבד: משווה בין כל הקבצים ששמורים באחסון (Blob)
// לבין המסמכים שמקושרים בבסיס הנתונים, ומזהה קבצים "יתומים" —
// כאלה שנשמרו באחסון אך אינם מופיעים באפליקציה (מועמדים לשחזור).
export async function GET() {
  // 1. איסוף כל הקבצים מהאחסון (עם עימוד)
  const blobs: { url: string; pathname: string; size: number; uploadedAt: string }[] = []
  let cursor: string | undefined
  do {
    const res = await list(cursor ? { cursor, limit: 1000 } : { limit: 1000 })
    for (const b of res.blobs) {
      blobs.push({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: String(b.uploadedAt) })
    }
    cursor = res.hasMore ? res.cursor : undefined
  } while (cursor)

  // 2. כל הקישורים שכבר מקושרים במסמכים
  const rows = await sql`SELECT blob_url, thumbnail_url FROM documents`
  const linked = new Set<string>()
  for (const r of rows) {
    if (r.blob_url) linked.add(r.blob_url)
    if (r.thumbnail_url) linked.add(r.thumbnail_url)
  }

  // 3. סינון תמונות ממוזערות (thumb-) — הן לא מסמכים
  const isThumb = (p: string) => p.split('/').pop()!.startsWith('thumb-')
  const documentBlobs = blobs.filter(b => !isThumb(b.pathname))

  // 4. יתומים: קובץ מסמך באחסון שאינו מקושר לאף שורה
  const orphans = documentBlobs
    .filter(b => !linked.has(b.url))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))

  return NextResponse.json({
    totalBlobs: blobs.length,
    thumbnails: blobs.length - documentBlobs.length,
    documentBlobs: documentBlobs.length,
    documentsInDb: rows.length,
    orphanCount: orphans.length,
    orphans: orphans.slice(0, 1000),
  })
}
