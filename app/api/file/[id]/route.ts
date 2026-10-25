import { sql } from '@/lib/db'
import { readFile } from '@/lib/files'
import { NextRequest, NextResponse } from 'next/server'

// הגשת קובץ של מסמך מהמאגר הפרטי. ה-middleware כבר בדק את קוד הכניסה.
// סוגים שלא ברשימה (למשל SVG, שיכול להריץ סקריפט) יורדים כקובץ ולא נפתחים בדף.
const INLINE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const thumb = req.nextUrl.searchParams.get('kind') === 'thumb'

  const rows = await sql`SELECT blob_url, thumbnail_url, filename FROM documents WHERE id = ${id}`.catch(() => [])
  const doc = rows[0]
  const url = thumb ? doc?.thumbnail_url : doc?.blob_url
  if (!url) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let file
  try {
    file = await readFile(url)
  } catch (e) {
    console.error('file route:', e)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const type = (file.contentType ?? 'application/octet-stream').split(';')[0].trim()
  const download = req.nextUrl.searchParams.has('download') || !INLINE_TYPES.includes(type)
  return new Response(file.body, {
    headers: {
      'Content-Type': type,
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(doc.filename)}`,
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
