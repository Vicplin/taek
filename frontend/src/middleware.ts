import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/@vite/client') {
    return new NextResponse('export {};', {
      status: 200,
      headers: { 'content-type': 'application/javascript; charset=utf-8' },
    })
  }

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const v = req.cookies.get(name)
          return v?.value
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; secure?: boolean; httpOnly?: boolean }) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: { path?: string; domain?: string }) {
          res.cookies.delete({
            name,
            ...options,
          } as { name: string; path?: string; domain?: string })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/admin', '/organiser', '/coach', '/player']
  const isProtected = protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    // For staff routes, redirect to staff login
    if (['/admin', '/organiser', '/coach'].some(p => req.nextUrl.pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/auth/staff-login', req.url))
    }
    // For player routes, redirect to home (login modal is there)
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/@vite/client', '/dashboard', '/admin/:path*', '/organiser/:path*', '/coach/:path*', '/player/:path*'],
}
