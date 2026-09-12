import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // If request comes from pagol.* subdomain (e.g. pagol.glowgoodly.com or pagol.glowgoogly.com)
  if (hostname.startsWith('pagol.')) {
    const url = request.nextUrl.clone();
    
    // Route homepage of subdomain directly to /valobasa (Admin panel)
    if (url.pathname === '/') {
      url.pathname = '/valobasa';
      const response = NextResponse.rewrite(url);
      response.headers.set('X-Frame-Options', 'SAMEORIGIN');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      return response;
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
