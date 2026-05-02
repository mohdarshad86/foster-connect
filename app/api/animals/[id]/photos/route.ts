import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError } from "@/lib/permissions"
import { validateUpload, saveUploadedFile } from "@/lib/upload"
import type { Role } from "@prisma/client"

const ALLOWED_ROLES: Role[] = ["INTAKE_SPECIALIST", "FOSTER_PARENT", "RESCUE_LEAD"]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    requireRole(session, ALLOWED_ROLES)

    const { id: animalId } = await params

    // Verify the animal exists
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      select: { id: true, fosterParentId: true },
    })
    if (!animal) {
      return NextResponse.json({ error: "Animal not found" }, { status: 404 })
    }

    // Foster Parents may only upload for their own assigned animal
    if (
      session.user.role === "FOSTER_PARENT" &&
      animal.fosterParentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get("photo")
    const setPrimary = formData.get("setPrimary") === "true"

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No photo file provided" }, { status: 400 })
    }

    // Client-replicable validation (also enforced here server-side)
    const validationError = validateUpload(file)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Save to disk
    const relativePath = await saveUploadedFile(file, animalId)

    // Persist to DB
    const photo = await prisma.animalPhoto.create({
      data: {
        animalId,
        filePath: relativePath,
        uploadedBy: session.user.id,
      },
    })

    // Set primaryPhoto: always on the first upload, otherwise only when requested
    const photoCount = await prisma.animalPhoto.count({ where: { animalId } })
    if (photoCount === 1 || setPrimary) {
      await prisma.animal.update({
        where: { id: animalId },
        data: { primaryPhoto: relativePath },
      })
    }

    return NextResponse.json(photo, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
