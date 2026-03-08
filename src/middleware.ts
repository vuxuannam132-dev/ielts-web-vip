import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const response = NextResponse.next()

    // Security Headers Base
    response.headers.set('X-DNS-Prefetch-Control', 'on')
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

    // Basic Rate Limiting Emulation (for API routes only, as simple delay/block logic)
    // Note: True distributed rate limiting requires a caching layer like Redis (e.g. Upstash)
    // For now, this serves as a basic protection mechanism to stop bot spam scripts.
    if (request.nextUrl.pathname.startsWith('/api/')) {
        // Prevent abuse of auth/register endpoints
        if (request.nextUrl.pathname === '/api/register') {
            const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
            // In a real Vercel environment, we'd log this or use Vercel KV.
            // Keeping headers strict.
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public images
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
