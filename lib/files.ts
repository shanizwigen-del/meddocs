import { put, get, del } from '@vercel/blob'

// קבצי המסמכים נשמרים במאגר Blob פרטי: אין להם קישור ציבורי, והדפדפן מקבל
// אותם רק דרך /api/file/[id], אחרי בדיקת קוד הכניסה ב-middleware.
// המאגר הפרטי מחובר לפרויקט עם הקידומת PRIVATE_BLOB. עד שההעברה
// (/api/admin/migrate-private) מסתיימת חלק מהקבצים עדיין במאגר הציבורי הישן,
// ולכן הקריאה כאן מטפלת בשני סוגי הקישורים.

const PRIVATE_HOST = '.private.blob.vercel-storage.com'

export function isPrivateUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(PRIVATE_HOST)
  } catch {
    return false
  }
}

export function privateAuth(): { token: string } | { storeId: string } {
  const token = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN
  if (token) return { token }
  const storeId = process.env.PRIVATE_BLOB_STORE_ID
  if (!storeId) throw new Error('PRIVATE_BLOB_STORE_ID חסר: יש לחבר את המאגר הפרטי לפרויקט עם הקידומת PRIVATE_BLOB')
  return { storeId }
}

// בלי OIDC ה-SDK נופל בשקט לטוקן של המאגר הישן (BLOB_READ_WRITE_TOKEN),
// ולכן מוודאים שהקובץ נשמר בפועל במאגר הפרטי הנכון.
export function assertPrivateStore(url: string): void {
  const host = new URL(url).hostname
  const storeId = process.env.PRIVATE_BLOB_STORE_ID?.replace(/^store_/, '').toLowerCase()
  if (!host.endsWith(PRIVATE_HOST) || (storeId && !host.startsWith(`${storeId}.`))) {
    throw new Error(`הקובץ נשמר מחוץ למאגר הפרטי: ${host}`)
  }
}

export async function savePrivate(
  pathname: string,
  body: Parameters<typeof put>[1],
  options: { contentType?: string; allowOverwrite?: boolean } = {},
): Promise<string> {
  const blob = await put(pathname, body, { access: 'private', ...options, ...privateAuth() })
  assertPrivateStore(blob.url)
  return blob.url
}

export async function readFile(url: string): Promise<{ body: ReadableStream<Uint8Array>; contentType: string | null }> {
  if (isPrivateUrl(url)) {
    const res = await get(url, { access: 'private', ...privateAuth() })
    if (!res || res.statusCode !== 200 || !res.stream) throw new Error(`הקובץ לא נמצא: ${url}`)
    return { body: res.stream, contentType: res.blob.contentType }
  }
  // קובץ שעוד לא הועבר מהמאגר הציבורי
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}: ${url}`)
  return { body: res.body, contentType: res.headers.get('content-type') }
}

export async function readBuffer(url: string): Promise<Buffer> {
  const { body } = await readFile(url)
  return Buffer.from(await new Response(body).arrayBuffer())
}

export async function removeFile(url: string | null | undefined): Promise<void> {
  if (!url) return
  if (isPrivateUrl(url)) return del(url, privateAuth())
  // קובץ במאגר הציבורי הישן, שיימחק כולו בסוף ההעברה
  await del(url).catch(e => console.error('removeFile (legacy):', e))
}
