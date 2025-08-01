import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { withSecurityHeaders } from "./lib/security"

export default withAuth(
  function middleware(req) {
    // Create response with security headers
    const response = NextResponse.next()
    return withSecurityHeaders(response)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow API routes for authenticated users
        if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
          return !!token
        }
        
        // Require authentication for all other protected routes
        return !!token
      }
    },
  }
)

// Protect all routes except auth routes and API auth routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - /auth (authentication pages)
     * - /api/auth (authentication API routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico, /favicon.png (favicon files)
     * - /logo.png, /placeholder* (public image files)
     */
    "/((?!auth|api/auth|_next/static|_next/image|favicon|logo|placeholder|public).*)",
  ]
}
