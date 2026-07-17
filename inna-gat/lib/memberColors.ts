// פלטת צבעים לכרטיסי בני המשפחה
export interface MemberColor {
  key: string
  bg: string
  text: string
  border: string
  ring: string
  dot: string
}

export const MEMBER_COLORS: MemberColor[] = [
  { key: 'blue',   bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',   ring: 'ring-blue-400',   dot: 'bg-blue-500' },
  { key: 'emerald',bg: 'bg-emerald-50',text: 'text-emerald-600',border: 'border-emerald-200',ring: 'ring-emerald-400',dot: 'bg-emerald-500' },
  { key: 'violet', bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', ring: 'ring-violet-400', dot: 'bg-violet-500' },
  { key: 'rose',   bg: 'bg-rose-50',   text: 'text-rose-600',   border: 'border-rose-200',   ring: 'ring-rose-400',   dot: 'bg-rose-500' },
  { key: 'amber',  bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200',  ring: 'ring-amber-400',  dot: 'bg-amber-500' },
  { key: 'cyan',   bg: 'bg-cyan-50',   text: 'text-cyan-600',   border: 'border-cyan-200',   ring: 'ring-cyan-400',   dot: 'bg-cyan-500' },
  { key: 'pink',   bg: 'bg-pink-50',   text: 'text-pink-600',   border: 'border-pink-200',   ring: 'ring-pink-400',   dot: 'bg-pink-500' },
  { key: 'teal',   bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-200',   ring: 'ring-teal-400',   dot: 'bg-teal-500' },
]

export function colorFor(key: string | null | undefined, fallbackIndex = 0): MemberColor {
  return MEMBER_COLORS.find(c => c.key === key) ?? MEMBER_COLORS[fallbackIndex % MEMBER_COLORS.length]
}
