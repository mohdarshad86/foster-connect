import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"
import type { Role } from "@prisma/client"

// ---------------------------------------------------------------------------
// Edge-safe NextAuth instance — JWT verification only, no bcryptjs / Prisma.
// The full config (Credentials provider + database) is in lib/auth.ts.
// ---------------------------------------------------------------------------

const { auth } = NextAuth(authConfig)

// ---------------------------------------------------------------------------
// Route-level role protection (Layer 1 of 2)
// Layer 2 is requireRole() inside each API route handler.
// ---------------------------------------------------------------------------

const ROLE_ROUTES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/animals/new",      roles: ["INTAKE_SPECIALIST", "RESCUE_LEAD"] },
  { prefix: "/users",            roles: ["RESCUE_LEAD"] },
  { prefix: "/vet-partners",     roles: ["RESCUE_LEAD"] },
  { prefix: "/applications",     roles: ["ADOPTION_COUNSELOR", "RESCUE_LEAD"] },
  // API mirrors
  { prefix: "/api/users",            roles: ["RESCUE_LEAD"] },
  { prefix: "/api/vet-partners",     roles: ["RESCUE_LEAD"] },
  { prefix: "/api/applications",     roles: ["ADOPTION_COUNSELOR", "RESCUE_LEAD"] },
  { prefix: "/success-stories",      roles: ["RESCUE_LEAD"] },
]

// ObjectId pattern — 24 hex chars (MongoDB)
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i

// Routes that bypass authentication entirely
function isPublicRoute(pathname: string, method: string): boolean {
  if (pathname === "/")                                      return true
  if (pathname.startsWith("/login"))                         return true
  if (pathname.startsWith("/apply"))                         return true
  if (pathname.startsWith("/application-status"))            return true
  if (pathname.startsWith("/faq"))                           return true
  // Public animal profile pages at /animals/[id] — allow only exact objectId segments
  // so /animals and /animals/new remain auth-protected dashboard routes.
  const animalSegment = pathname.match(/^\/animals\/([^/]+)$/)?.[1]
  if (animalSegment && OBJECT_ID_RE.test(animalSegment))     return true
  // Legacy /public-animals/[id] redirect shim — allow through so redirect fires
  if (pathname.startsWith("/public-animals/"))               return true
  if (pathname === "/api/success-stories" && method === "GET") return true
  if (pathname.startsWith("/api/auth"))                      return true
  if (pathname.startsWith("/api/uploads"))                   return true
  if (pathname.startsWith("/api/application-status"))        return true
  if (pathname === "/api/applications" && method === "POST") return true
  return false
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const method = req.method
  const session = req.auth

  // 1. Allow public routes through unconditionally
  if (isPublicRoute(pathname, method)) {
    return NextResponse.next()
  }

  // 2. No session → redirect to login (UI) or 401 (API)
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // 3. Force password change — redirect to /change-password for every page
  if (session.user.mustChangePassword && pathname !== "/change-password") {
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/change-password", req.url))
    }
  }

  // 4. Role-based route guard
  for (const { prefix, roles } of ROLE_ROUTES) {
    if (pathname.startsWith(prefix)) {
      if (!roles.includes(session.user.role as Role)) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
      break
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
