// Google Vision OCR — חילוץ טקסט עברי מתמונות וPDFs סרוקים

export async function extractTextWithVision(imageBase64: string, mimeType: string): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY
  if (!apiKey) return ''

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
          imageContext: { languageHints: ['he', 'en'] },
        }],
      }),
    }
  )

  if (!res.ok) return ''
  const data = await res.json()
  return data.responses?.[0]?.fullTextAnnotation?.text ?? ''
}
