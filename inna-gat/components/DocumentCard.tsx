import Link from 'next/link'

interface Doc {
  id: string
  filename: string
  doc_date: string | null
  doctor: string | null
  hospital: string | null
  specialty: string | null
  summary: string | null
  status: string
  thumbnail_url?: string | null
}

export function DocumentCard({ doc }: { doc: Doc }) {
  const dateStr = doc.doc_date
    ? new Date(doc.doc_date).toLocaleDateString('he-IL')
    : null

  return (
    <Link href={`/doc/${doc.id}`} className="block">
      <div className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        {/* thumbnail */}
        <div className="w-full h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
          {doc.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.thumbnail_url}
              alt={doc.filename}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span className="text-4xl text-gray-300">📄</span>
          )}
        </div>

        {/* מידע */}
        <div className="p-3 space-y-1">
          <p className="font-medium text-gray-900 text-xs line-clamp-2 leading-tight">{doc.filename}</p>
          <div className="text-xs text-gray-400 space-y-0.5">
            {doc.doctor   && <p>ד&quot;ר {doc.doctor}</p>}
            {doc.hospital && <p className="line-clamp-1">{doc.hospital}</p>}
            {dateStr      && <p>{dateStr}</p>}
          </div>
          {doc.status === 'processing' && (
            <p className="text-xs text-blue-500 animate-pulse">מעבד...</p>
          )}
        </div>
      </div>
    </Link>
  )
}
