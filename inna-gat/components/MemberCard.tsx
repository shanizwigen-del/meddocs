'use client'
import Link from 'next/link'
import { colorFor } from '@/lib/memberColors'

export interface Member {
  id: string
  name: string
  relation: string | null
  birth_date: string | null
  color: string | null
  doc_count?: number
}

export function ageFromBirth(birth: string | null): number | null {
  if (!birth) return null
  const b = new Date(birth)
  if (isNaN(b.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age >= 0 ? age : null
}

export function MemberCard({ member, index }: { member: Member; index: number }) {
  const c = colorFor(member.color, index)
  const age = ageFromBirth(member.birth_date)
  const initial = member.name.trim().charAt(0) || '?'
  const sub = [member.relation, age !== null ? `בן/בת ${age}` : null].filter(Boolean).join(' · ')

  return (
    <Link
      href={`/member/${member.id}`}
      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all
        ${c.bg} ${c.border} hover:shadow-md hover:scale-[1.02]`}
    >
      <div className={`w-16 h-16 rounded-full ${c.dot} text-white flex items-center justify-center text-2xl font-semibold shadow-sm`}>
        {initial}
      </div>
      <div className="text-center space-y-1">
        <p className="font-semibold text-gray-800 text-sm leading-tight">{member.name}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
        <p className="text-xs text-gray-400">{member.doc_count ?? 0} מסמכים</p>
      </div>
    </Link>
  )
}
