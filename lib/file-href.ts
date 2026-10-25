// כתובת הקובץ של מסמך בדפדפן. הקובץ עצמו במאגר פרטי ומוגש דרך /api/file/[id].
export function fileHref(id: string, opts: { thumb?: boolean; download?: boolean } = {}): string {
  const params = new URLSearchParams()
  if (opts.thumb) params.set('kind', 'thumb')
  if (opts.download) params.set('download', '1')
  const qs = params.toString()
  return `/api/file/${id}${qs ? `?${qs}` : ''}`
}
