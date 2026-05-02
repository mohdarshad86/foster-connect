import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError } from "@/lib/permissions"
import { UserCreateSchema } from "@/lib/validators/user"

// ---------------------------------------------------------------------------
// GET /api/users — Rescue Lead only
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    requireRole(session, ["RESCUE_LEAD"])

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        isActive:  true,
        createdAt: true,
      },
    })

    return NextResponse.json(users)
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// POST /api/users — Rescue Lead only
// Generates a temporary password, hashes it, and returns the plaintext
// exactly once in the response body — it is never stored.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    requireRole(session, ["RESCUE_LEAD"])

    const body = await req.json()
    const parsed = UserCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { name, email, role } = parsed.data

    // Uniqueness check
    const existing = await prisma.user.findUnique({
      where:  { email: email.toLowerCase() },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists." },
        { status: 409 },
      )
    }

    // Generate + hash temporary password
    const tempPassword = crypto.randomBytes(10).toString("base64url") // ~13 URL-safe chars
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role,
        passwordHash,
        isActive:           true,
        mustChangePassword: true,
      },
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        isActive:  true,
        createdAt: true,
      },
    })

    // Return plaintext temp password — only time it ever leaves the server
    return NextResponse.json({ ...user, tempPassword }, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
