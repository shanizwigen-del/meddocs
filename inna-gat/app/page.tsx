'use client'
import { useState, useEffect, useCallback } from 'react'
import { MemberCard, type Member } from '@/components/MemberCard'
import { AddMemberModal } from '@/components/AddMemberModal'
import { InstallBanner } from '@/components/InstallBanner'

export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const fetchMembers = useCallback(async () => {
    const res = await fetch('/api/members')
    setMembers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <InstallBanner />

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5 pb-28">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">התיקים שלנו</h1>
            <p className="text-sm text-gray-400">תיק רפואי אישי לכל בן משפחה</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm active:scale-95 transition-transform"
          >
            + בן משפחה
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-16">טוען...</p>
        ) : members.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">👨‍👩‍👧‍👦</p>
            <p className="text-gray-400">עדיין אין בני משפחה</p>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium mt-2"
            >
              הוסיפי בן משפחה ראשון
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {members.map((m, i) => (
              <MemberCard key={m.id} member={m} index={i} />
            ))}
            <button
              onClick={() => setShowAdd(true)}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-all"
            >
              <span className="text-3xl leading-none">+</span>
              <span className="text-sm font-medium">בן משפחה</span>
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <AddMemberModal
          defaultColorIndex={members.length}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchMembers() }}
        />
      )}
    </div>
  )
}
