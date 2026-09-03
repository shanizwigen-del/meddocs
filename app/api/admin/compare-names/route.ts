export const maxDuration = 60

import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// משווה רשימת שמות קבצים מקוריים מול המסמכים באפליקציה.
// ההעלאה מפצלת ומשנה שמות, אבל שומרת את השם המקורי בתוך שם המסמך:
//   פיצול (בצד לקוח):  "מסמך-1__2.pdf"      → מקור: 2.pdf
//   פיצול (בשרת):      "עמודים 1,2 — 2.pdf" → מקור: 2.pdf
//   העלאה רגילה:       "2.pdf"              → מקור: 2.pdf
// לכן משווים לפי השם המקורי המדויק (בלי סיומת), לא לפי הכלה כללית.

function stripExt(s: string): string {
  return s.replace(/\.[a-z0-9]+$/i, '')
}

function sourceKey(line: string): string {
  let n = line.trim().replace(/^["']+|["']+$/g, '') // מרכאות (Copy as path)
  n = n.split(/[\\/]/).pop() ?? n                    // רק שם הקובץ
  return stripExt(n.trim().toLowerCase())
}

function embeddedKey(docName: string): string {
  let n = docName.trim().toLowerCase()
  const u = n.lastIndexOf('__')
  if (u >= 0) n = n.slice(u + 2)
  const d = n.lastIndexOf(' — ')
  if (d >= 0) n = n.slice(d + 3)
  return stripExt(n.trim())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const names: string[] = Array.isArray(body.names) ? body.names : []
  const sources = names.map(n => n.trim()).filter(Boolean)

  const rows = await sql`SELECT filename FROM documents WHERE filename IS NOT NULL`
  const keys = new Set<string>()
  for (const r of rows) {
    const f = r.filename as string
    keys.add(stripExt(f.trim().toLowerCase())) // שם מלא
    keys.add(embeddedKey(f))                    // שם מקורי מוטמע
  }

  const found: string[] = []
  const missing: string[] = []
  for (const src of sources) {
    const k = sourceKey(src)
    if (k && keys.has(k)) found.push(src)
    else missing.push(src)
  }

  return NextResponse.json({
    total: sources.length,
    foundCount: found.length,
    missingCount: missing.length,
    missing,
    found,
  })
}
