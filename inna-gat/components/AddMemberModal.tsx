'use client'
import { useState } from 'react'
import { MEMBER_COLORS } from '@/lib/memberColors'
import type { Member } from '@/components/MemberCard'

const RELATIONS = ['בן', 'בת', 'בן זוג', 'בת זוג', 'אמא', 'אבא', 'הורה', 'נכד', 'נכדה', 'אח', 'אחות', 'אחר']

interface Props {
  defaultColorIndex?: number
  existing?: Member | null
  onClose: () => void
  onSaved: (member: Member) => void
}

export function AddMemberModal({ defaultColorIndex = 0, existing = null, onClose, onSaved }: Props) {
  const [name, setName] = useState(existing?.name ?? '')
  const [relation, setRelation] = useState(existing?.relation ?? '')
  const [birthDate, setBirthDate] = useState(existing?.birth_date?.slice(0, 10) ?? '')
  const [color, setColor] = useState(
    existing?.color ?? MEMBER_COLORS[defaultColorIndex % MEMBER_COLORS.length].key
  )
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const body = { name: name.trim(), relation, birth_date: birthDate || null, color }
      const res = existing
        ? await fetch(`/api/members/${existing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
      const saved = existing
        ? { ...existing, ...body }
        : await res.json()
      onSaved(saved as Member)
    } catch {
      alert('שמירה נכשלה, נסי שוב')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        dir="rtl"
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {existing ? 'עריכת בן משפחה' : 'הוספת בן משפחה'}
        </h2>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">שם</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="שם מלא"
            className="w-full border rounded-xl px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">קרבה משפחתית</label>
          <input
            list="relations"
            value={relation}
            onChange={e => setRelation(e.target.value)}
            placeholder="בן / בת / הורה..."
            className="w-full border rounded-xl px-4 py-3 text-sm"
          />
          <datalist id="relations">
            {RELATIONS.map(r => <option key={r} value={r} />)}
          </datalist>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-600">תאריך לידה</label>
          <input
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-600">צבע</label>
          <div className="flex gap-2 flex-wrap">
            {MEMBER_COLORS.map(c => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColor(c.key)}
                className={`w-8 h-8 rounded-full ${c.dot} transition-transform ${
                  color === c.key ? 'ring-2 ring-offset-2 ring-gray-500 scale-110' : ''
                }`}
                aria-label={c.key}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'שומר...' : existing ? 'שמור שינויים' : 'הוסף'}
          </button>
          <button onClick={onClose} className="px-5 text-gray-500 text-sm">
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}
