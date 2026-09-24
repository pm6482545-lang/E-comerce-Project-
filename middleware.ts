import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protects /admin with HTTP Basic Auth until full user login is built.
// Set ADMIN_USER and ADMIN_PASSWORD in Vercel > Settings > Environment Variables.
export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER
  const pass = process.env.ADMIN_PASSWORD

  if (!user || !pass) {
    return new NextResponse('Admin is not configured. Set ADMIN_USER and ADMIN_PASSWORD.', { status: 503 })
  }

  const header = req.headers.get('authorization') ?? ''
  const [scheme, encoded] = header.split(' ')
  if (scheme === 'Basic' && encoded) {
    try {
      const [u, ...rest] = atob(encoded).split(':')
      if (u === user && rest.join(':') === pass) return NextResponse.next()
    } catch {}
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Elevate Admin"' },
  })
}

export const config = { matcher: ['/admin/:path*'] }
