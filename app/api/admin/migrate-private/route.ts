export const maxDuration = 300

import { sql } from '@/lib/db'
import { isPrivateUrl, savePrivate } from '@/lib/files'
import { NextRequest, NextResponse } from 'next/server'

// העברה חד-פעמית של קבצי המסמכים מהמאגר הציבורי הישן למאגר הפרטי.
// כל קריאה מעבירה עד BATCH מסמכים, ודף הניהול קורא שוב ושוב עד שלא נשאר מה להעביר.
// בטוח להריץ שוב: מסמך שכבר הועבר מדולג, וקובץ שהועתק בלי שהמסד עודכן פשוט נדרס.
// המאגר הישן לא נמחק כאן — רק אחרי שבודקים שהמסמכים נפתחים.

const BATCH = 15
const PRIVATE_LIKE = '%.private.blob.vercel-storage.com/%'

async function countRemaining(): Promise<number> {
  const rows = await sql`
    SELECT count(*)::int AS n FROM documents
    WHERE blob_url NOT LIKE ${PRIVATE_LIKE}
       OR (thumbnail_url IS NOT NULL AND thumbnail_url NOT LIKE ${PRIVATE_LIKE})
  `
  return rows[0].n
}

async function copyToPrivate(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const pathname = decodeURIComponent(new URL(url).pathname.slice(1))
  return savePrivate(pathname, Buffer.from(await res.arrayBuffer()), {
    contentType: res.headers.get('content-type') ?? undefined,
    allowOverwrite: true,
  })
}

export async function GET() {
  const rows = await sql`SELECT count(*)::int AS n FROM documents`
  return NextResponse.json({ total: rows[0].n, remaining: await countRemaining() })
}

export async function POST(req: NextRequest) {
  // skip: מסמכים שנכשלו בקריאה קודמת, כדי שהלולאה תתקדם ולא תיתקע עליהם
  const { skip = [] } = (await req.json().catch(() => ({}))) as { skip?: string[] }

  const rows = await sql`
    SELECT id, blob_url, thumbnail_url FROM documents
    WHERE (blob_url NOT LIKE ${PRIVATE_LIKE}
           OR (thumbnail_url IS NOT NULL AND thumbnail_url NOT LIKE ${PRIVATE_LIKE}))
      AND NOT (id = ANY(${skip}::uuid[]))
    ORDER BY created_at
    LIMIT ${BATCH}
  `

  let migrated = 0
  const failed: { id: string; error: string }[] = []
  for (const row of rows) {
    try {
      // בתמונה, התמונה הממוזערת היא אותו קובץ — מעתיקים פעם אחת
      const copies = new Map<string, string>()
      const move = async (url: string | null): Promise<string | null> => {
        if (!url || isPrivateUrl(url)) return url
        if (!copies.has(url)) copies.set(url, await copyToPrivate(url))
        return copies.get(url)!
      }
      const blobUrl = await move(row.blob_url)
      const thumbnailUrl = await move(row.thumbnail_url)
      await sql`UPDATE documents SET blob_url = ${blobUrl}, thumbnail_url = ${thumbnailUrl} WHERE id = ${row.id}`
      migrated++
    } catch (e) {
      failed.push({ id: row.id, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return NextResponse.json({ migrated, failed, remaining: await countRemaining() })
}
