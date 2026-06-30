import Link from 'next/link'
import { SpecialtyChip } from './SpecialtyChip'

interface Doc {
  id: string
  filename: string
  doc_date: string | null
  doctor: string | null
  hospital: string | null
  specialty: string | null
  summary: string | null
  status: string
}

export function DocumentCard({ doc }: { doc: Doc }) {
  const dateStr = doc.doc_date
    ? new Date(doc.doc_date).toLocaleDateString('he-IL')
    : null

  return (
    <Link href={`/doc/${doc.id}`}>
      <div className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-gray-900 text-sm line-clamp-1">{doc.filename}</p>
          {doc.specialty && <SpecialtyChip name={doc.specialty} />}
        </div>
        <div className="text-xs text-gray-500 space-y-0.5">
          {doc.doctor   && <p>ד&quot;ר {doc.doctor}</p>}
          {doc.hospital && <p>{doc.hospital}</p>}
          {dateStr      && <p>{dateStr}</p>}
        </div>
        {doc.status === 'processing' && (
          <p className="text-xs text-blue-500 animate-pulse">מעבד...</p>
        )}
      </div>
    </Link>
  )
}
