// שיתוף מסמכים דרך תפריט השיתוף המובנה של המכשיר (Web Share API).
// המשתמש בוחר בעצמו Gmail / וואטסאפ / כל אפליקציה — בלי תלות בשירות מייל חיצוני.

export interface ShareDoc {
  blob_url: string
  filename: string
}

export type ShareResult = 'shared' | 'unsupported' | 'cancelled' | 'error'

export async function shareDocuments(docs: ShareDoc[], text?: string): Promise<ShareResult> {
  if (docs.length === 0) return 'error'
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unsupported'
  }

  try {
    const files = await Promise.all(
      docs.map(async d => {
        const res = await fetch(d.blob_url)
        const blob = await res.blob()
        return new File([blob], d.filename, {
          type: blob.type || 'application/octet-stream',
        })
      })
    )

    const data: ShareData = {
      files,
      title: docs.length === 1 ? docs[0].filename : `${docs.length} מסמכים`,
      ...(text ? { text } : {}),
    }

    // חלק מהדפדפנים תומכים ב-share אך לא בשיתוף קבצים
    if (typeof navigator.canShare === 'function' && !navigator.canShare(data)) {
      return 'unsupported'
    }

    await navigator.share(data)
    return 'shared'
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    return 'error'
  }
}
