import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const auth = req.cookies.get('auth')?.value
  const { pathname } = req.nextUrl
  const isLogin = pathname === '/login'
  const isApi = pathname.startsWith('/api/')

  if (!auth || auth !== process.env.PASSCODE) {
    // ה-API מחזיר את המסמכים עצמם, ולכן נעול כמו המסכים. פתוח רק מה שצריך כדי להיכנס.
    if (isLogin || pathname === '/api/auth') return NextResponse.next()
    if (isApi) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isLogin) return NextResponse.redirect(new URL('/', req.url))
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next|favicon|manifest.json|sw.js|icon).*)'] }
