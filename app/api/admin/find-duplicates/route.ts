export const maxDuration = 300

import { list } from '@vercel/blob'
import { sql } from '@/lib/db'
import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

// מאתר כפילויות בין המסמכים:
// 1. זהים לחלוטין — אותו תוכן בדיוק (משווה גודל, ואז טביעת אצבע לקבצים באותו גודל).
// 2. שם דומה — למשל גרסאות "Copy" / "_Enhanced" של אותו מסמך.

interface DocRow {
  id: string
  filename: string
  blob_url: string
}

function normalizeName(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')            // סיומת
    .replace(/\s*-?\s*copy\b/gi, '')          // "copy" / " - copy"
    .replace(/_?enhanced\b/gi, '')            // "_enhanced"
    .replace(/\s*\(\d+\)\s*$/,'')             // "(1)"
    .replace(/[_\-\s]+/g, ' ')
    .trim()
}

export async function GET() {
  const rows = (await sql`SELECT id, filename, blob_url FROM documents WHERE blob_url IS NOT NULL`) as unknown as DocRow[]

  // גודל כל קובץ מהאחסון (בלי להוריד)
  const sizeByUrl = new Map<string, number>()
  let cursor: string | undefined
  do {
    const res = await list(cursor ? { cursor, limit: 1000 } : { limit: 1000 })
    for (const b of res.blobs) sizeByUrl.set(b.url, b.size)
    cursor = res.hasMore ? res.cursor : undefined
  } while (cursor)

  // --- כפילויות תוכן: קבצים באותו גודל → מוודאים בטביעת אצבע ---
  const bySize = new Map<number, DocRow[]>()
  for (const r of rows) {
    const size = sizeByUrl.get(r.blob_url)
    if (size === undefined) continue
    const arr = bySize.get(size) ?? []
    arr.push(r)
    bySize.set(size, arr)
  }

  const hashByUrl = new Map<string, string>()
  for (const [, group] of bySize) {
    if (group.length < 2) continue // גודל ייחודי — לא ייתכן זהה
    for (const doc of group) {
      try {
        const res = await fetch(doc.blob_url)
        const buf = Buffer.from(await res.arrayBuffer())
        hashByUrl.set(doc.blob_url, createHash('sha256').update(buf).digest('hex'))
      } catch { /* דלג */ }
    }
  }

  const byHash = new Map<string, DocRow[]>()
  for (const r of rows) {
    const h = hashByUrl.get(r.blob_url)
    if (!h) continue
    const arr = byHash.get(h) ?? []
    arr.push(r)
    byHash.set(h, arr)
  }
  const exactGroups = [...byHash.values()]
    .filter(g => g.length > 1)
    .map(g => g.map(d => ({ id: d.id, filename: d.filename })))

  // --- כפילויות שם ---
  const idsInExact = new Set(exactGroups.flat().map(d => d.id))
  const byName = new Map<string, DocRow[]>()
  for (const r of rows) {
    const key = normalizeName(r.filename)
    if (!key) continue
    const arr = byName.get(key) ?? []
    arr.push(r)
    byName.set(key, arr)
  }
  const nameGroups = [...byName.values()]
    .filter(g => g.length > 1)
    // אל תחזור על קבוצות שכבר זוהו כזהות לחלוטין
    .filter(g => !g.every(d => idsInExact.has(d.id)))
    .map(g => g.map(d => ({ id: d.id, filename: d.filename })))

  return NextResponse.json({
    exactCount: exactGroups.reduce((s, g) => s + g.length, 0),
    nameCount: nameGroups.reduce((s, g) => s + g.length, 0),
    exactGroups,
    nameGroups,
  })
}
