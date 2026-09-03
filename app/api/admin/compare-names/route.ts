export const maxDuration = 60

import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// משווה רשימת שמות קבצים מקוריים (שהמשתמשת מדביקה) מול שמות המסמכים
// שבאפליקציה. מכיוון שהמערכת מפצלת ומשנה שמות בהעלאה, ההשוואה היא לפי
// הכלה: קובץ מקורי נחשב "נמצא" אם שמו (ללא סיומת) מופיע בתוך שם של מסמך כלשהו.

function baseName(name: string): string {
  let n = name.trim().replace(/^["']+|["']+$/g, '') // הסרת מרכאות (מ-"Copy as path")
  n = n.split(/[\\/]/).pop() ?? n                    // רק שם הקובץ, בלי נתיב תיקייה
  n = n.replace(/\.[a-z0-9]+$/i, '')                 // הסרת סיומת
  return n.trim().toLowerCase()
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const names: string[] = Array.isArray(body.names) ? body.names : []
  const sources = names.map(n => n.trim()).filter(Boolean)

  const rows = await sql`SELECT filename FROM documents WHERE filename IS NOT NULL`
  const docNames = rows.map(r => (r.filename as string).toLowerCase())

  const found: string[] = []
  const missing: string[] = []
  for (const src of sources) {
    const base = baseName(src)
    if (base && docNames.some(d => d.includes(base))) found.push(src)
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
