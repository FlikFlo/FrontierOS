import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAuthBypassed } from '@/lib/dev-auth'
import { canAccess, moduleForPath, isRole, DEFAULT_ROLE } from '@/rbac/config'

/**
 * proxy — Next 16's middleware replacement. Refreshes the Supabase session on
 * every request and gates access:
 *   - unauthenticated → redirected to /login (except the auth routes)
 *   - authenticated on /login → redirected to /dashboard
 * If Supabase env is absent, auth is skipped so the app still boots locally.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let response = NextResponse.next({ request })

  // API routes authenticate themselves (e.g. the cron digest uses CRON_SECRET);
  // don't bounce them to /login.
  if (request.nextUrl.pathname.startsWith('/api/')) return response

  // Dev bypass (and the no-env case) skip auth entirely.
  if (isAuthBypassed() || !url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // IMPORTANT: getUser() revalidates the token with Supabase (do not trust
  // getSession() in server code). This also refreshes the cookie via setAll.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/login')

  if (!user && !isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  // Server-side role enforcement: bounce a signed-in user away from a module
  // their role can't access (mirrors the client nav guard, but authoritative).
  if (user && !isAuthRoute) {
    const mod = moduleForPath(pathname)
    if (mod) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const role = isRole(profile?.role) ? profile.role : DEFAULT_ROLE
      if (!canAccess(role, mod)) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        redirectUrl.search = ''
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return response
}

export const config = {
  // Run on everything except static assets + image files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
