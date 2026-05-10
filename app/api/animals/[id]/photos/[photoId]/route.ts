import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError, NotFoundError } from "@/lib/permissions"
import { uploadRoot } from "@/lib/upload"
import path from "path"
import fs from "fs"

// ---------------------------------------------------------------------------
// DELETE /api/animals/[id]/photos/[photoId]
// Intake Specialist + Rescue Lead only.
// Steps:
//   1. Fetch AnimalPhoto record (verify it belongs to the animal)
//   2. Delete file from disk (log error if missing — do not fail)
//   3. Delete DB record
//   4. If animal.primaryPhoto === photo.filePath, update to next photo or null
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  try {
    const session = await auth()
    requireRole(session, ["INTAKE_SPECIALIST", "RESCUE_LEAD"])

    const { id: animalId, photoId } = await params

    const photo = await prisma.animalPhoto.findUnique({
      where: { id: photoId },
    })
    if (!photo || photo.animalId !== animalId) throw new NotFoundError("Photo")

    // 1. Attempt to delete file from disk
    try {
      const fullPath = path.join(uploadRoot(), photo.filePath)
      fs.unlinkSync(fullPath)
    } catch (fsErr) {
      console.error("[upload] Could not delete file from disk:", fsErr)
      // Continue — DB record must still be removed
    }

    // 2. Delete DB record
    await prisma.animalPhoto.delete({ where: { id: photoId } })

    // 3. If this was the primary photo, update animal.primaryPhoto
    const animal = await prisma.animal.findUnique({
      where:  { id: animalId },
      select: { primaryPhoto: true },
    })

    if (animal?.primaryPhoto === photo.filePath) {
      const nextPhoto = await prisma.animalPhoto.findFirst({
        where:   { animalId },
        orderBy: { uploadedAt: "desc" },
        select:  { filePath: true },
      })
      await prisma.animal.update({
        where: { id: animalId },
        data:  { primaryPhoto: nextPhoto?.filePath ?? null },
      })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiError(err)
  }
}
