import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Force HTTPS redirect if not localhost
  const hostname = request.headers.get('host') || '';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  
  // If not localhost and not HTTPS, redirect
  if (!hostname.includes('localhost') && proto !== 'https') {
    const httpsUrl = request.url.replace('http://', 'https://');
    return NextResponse.redirect(httpsUrl, 308);
  }
  
  // Add security headers to response
  const response = NextResponse.next();
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

// Apply to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
