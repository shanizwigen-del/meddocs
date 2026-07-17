import { getSpecialtyColor } from '@/lib/specialties'

export function SpecialtyChip({ name }: { name: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSpecialtyColor(name)}`}>
      {name}
    </span>
  )
}
