import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole, apiError } from "@/lib/permissions"
import { validateUpload, saveUploadedFile } from "@/lib/upload"
import { z } from "zod"

const CreateSchema = z.object({
  animalName:    z.string().min(1).max(100),
  blurb:         z.string().min(1).max(200),
  adoptionMonth: z.string().min(1).max(20),
  isPublished:   z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// GET /api/success-stories
// Public:       returns only published stories, max 6, newest first.
// Rescue Lead:  returns all stories for dashboard management.
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    const isLead  = session?.user?.role === "RESCUE_LEAD"

    if (isLead) {
      const stories = await prisma.successStory.findMany({
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { name: true } } },
      })
      return NextResponse.json(stories)
    }

    // Public: published only, max 6
    const stories = await prisma.successStory.findMany({
      where:   { isPublished: true },
      orderBy: { createdAt: "desc" },
      take:    6,
      select: {
        id:            true,
        animalName:    true,
        photoUrl:      true,
        blurb:         true,
        adoptionMonth: true,
      },
    })
    return NextResponse.json(stories)
  } catch (err) {
    return apiError(err)
  }
}

// ---------------------------------------------------------------------------
// POST /api/success-stories — Rescue Lead only
// Accepts multipart/form-data so an optional photo can be uploaded in one request.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    requireRole(session, ["RESCUE_LEAD"])

    const formData = await req.formData()

    const raw = {
      animalName:    formData.get("animalName"),
      blurb:         formData.get("blurb"),
      adoptionMonth: formData.get("adoptionMonth"),
      isPublished:   formData.get("isPublished") === "true",
    }

    const body = CreateSchema.parse(raw)

    // Optional photo upload
    let photoUrl: string | undefined
    const photoFile = formData.get("photo")
    if (photoFile instanceof File && photoFile.size > 0) {
      const validationError = validateUpload(photoFile)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }
      // Save to "success-stories" subfolder inside UPLOAD_DIR
      photoUrl = await saveUploadedFile(photoFile, "success-stories")
    }

    const story = await prisma.successStory.create({
      data: {
        ...body,
        photoUrl,
        createdById: session!.user.id,
      },
      include: { createdBy: { select: { name: true } } },
    })
    return NextResponse.json(story, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
