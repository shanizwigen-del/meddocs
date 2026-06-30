import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const auth = req.cookies.get('auth')?.value
  const isLogin = req.nextUrl.pathname === '/login'

  if (!auth || auth !== process.env.PASSCODE) {
    if (isLogin) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isLogin) return NextResponse.redirect(new URL('/', req.url))
  return NextResponse.next()
}

export const config = { matcher: ['/((?!api|_next|favicon).*)'] }
