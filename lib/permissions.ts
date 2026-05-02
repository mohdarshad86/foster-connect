import { NextResponse } from "next/server"
import type { Session } from "next-auth"
import type { Role } from "@prisma/client"

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class PermissionError extends Error {
  readonly status = 403
  constructor(message = "Forbidden") {
    super(message)
    this.name = "PermissionError"
  }
}

export class NotFoundError extends Error {
  readonly status = 404
  constructor(resource = "Resource") {
    super(`${resource} not found`)
    this.name = "NotFoundError"
  }
}

export class ValidationError extends Error {
  readonly status = 400
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

// ---------------------------------------------------------------------------
// Guard — throws PermissionError if role is not in the allowed list
// Call this at the top of every API route handler before any DB access.
// ---------------------------------------------------------------------------

export function requireRole(
  session: Session | null,
  allowedRoles: Role[]
): asserts session is Session {
  if (!session?.user) {
    throw new PermissionError("Unauthorized")
  }
  if (!allowedRoles.includes(session.user.role as Role)) {
    throw new PermissionError()
  }
}

// ---------------------------------------------------------------------------
// Response helpers — keep API route catch blocks DRY
// ---------------------------------------------------------------------------

export function apiError(err: unknown): NextResponse {
  if (err instanceof PermissionError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 })
  }
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
  console.error("[API Error]", err)
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}

// Convenience one-liners for inline use
export const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 })

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 })

export const notFound = (resource = "Resource") =>
  NextResponse.json({ error: `${resource} not found` }, { status: 404 })
