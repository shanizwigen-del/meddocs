'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ code }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (res.ok) router.push('/')
    else setError(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-md w-80 space-y-4">
        <h1 className="text-xl font-semibold text-center">המסמכים שלי</h1>
        <input
          type="password"
          placeholder="קוד כניסה"
          value={code}
          onChange={e => setCode(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 text-center text-lg"
        />
        {error && <p className="text-red-500 text-sm text-center">קוד שגוי</p>}
        <button className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">כניסה</button>
      </form>
    </div>
  )
}
