import path from "path"
import fs from "fs"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

/**
 * Resolves the upload root from the environment variable.
 * UPLOAD_DIR can be relative (e.g. "./uploads") or absolute.
 */
export function uploadRoot(): string {
  const dir = process.env.UPLOAD_DIR ?? "./uploads"
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir)
}

/**
 * Validate a File object without touching the filesystem.
 * Returns an error string, or null if valid.
 */
export function validateUpload(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Invalid file type. Only JPEG, PNG and WebP are accepted."
  }
  if (file.size > MAX_BYTES) {
    return "File exceeds the 8 MB size limit."
  }
  return null
}

/**
 * Write a validated File to disk under <uploadRoot>/<animalId>/.
 * Returns the relative path stored on the AnimalPhoto record.
 */
export async function saveUploadedFile(
  file: File,
  animalId: string
): Promise<string> {
  const dir = path.join(uploadRoot(), animalId)
  fs.mkdirSync(dir, { recursive: true })

  // Sanitise the original filename to avoid path traversal
  const safeName = `${Date.now()}-${file.name.replace(/[^a-z0-9._-]/gi, "_")}`
  const fullPath = path.join(dir, safeName)

  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(fullPath, buffer)

  // Stored as a relative path: "<animalId>/<filename>"
  return `${animalId}/${safeName}`
}
