import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (code !== process.env.PASSCODE)
    return NextResponse.json({ error: 'wrong' }, { status: 401 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('auth', code, { httpOnly: true, maxAge: 60 * 60 * 24 * 30 })
  return res
}
