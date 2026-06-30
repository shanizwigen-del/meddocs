'use client'
import { SPECIALTIES } from '@/lib/specialties'

interface Props {
  q: string
  specialty: string
  year: string
  onChange: (key: string, value: string) => void
}

export function SearchFilters({ q, specialty, year, onChange }: Props) {
  const years = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i))

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        type="text"
        placeholder="חיפוש חופשי..."
        value={q}
        onChange={e => onChange('q', e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
      />
      <select
        value={specialty}
        onChange={e => onChange('specialty', e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm"
      >
        <option value="">כל התחומים</option>
        {SPECIALTIES.map(s => (
          <option key={s.name} value={s.name}>{s.name}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={e => onChange('year', e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm"
      >
        <option value="">כל השנים</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}
