import { NextResponse, type NextRequest } from 'next/server';
// Relative, not the '@/' alias, and deliberately so. Middleware is compiled
// into an Edge Function by a separate bundler pass, and if the tsconfig alias
// map is not applied there the specifier survives as an unresolved external —
// which fails the build with "referencing unsupported modules". A relative
// path needs no alias map, so this entry point cannot break that way again.
import { SESSION_COOKIE, verifySession } from './lib/auth/session';

/**
 * Gates every /admin route behind a valid session.
 *
 * This runs on the Edge runtime, which is why session verification uses jose
 * (Web Crypto) rather than node:crypto. Password checking never happens here —
 * only signature verification of an already-issued token.
 *
 * Middleware is a convenience, not the security boundary: it makes unauthorised
 * requests bounce early and cheaply. Every route handler and server action that
 * mutates data re-checks the session itself, because a misconfigured matcher
 * must not be the only thing standing between the internet and the database.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  // Already signed in and heading for the login page — send them onward.
  if (pathname === '/admin/login') {
    if (session) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const login = new URL('/admin/login', request.url);
    // Preserve where they were going, so the round trip is not lost. Only a
    // path is carried, never an absolute URL — an open redirect here would let
    // a crafted link bounce someone off this domain after they authenticate.
    if (pathname.startsWith('/admin')) {
      login.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
