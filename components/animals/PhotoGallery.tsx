"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Star, ImageOff, X } from "lucide-react"
import { Button } from "@/components/ui/Button"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 8 * 1024 * 1024

interface Photo {
  id: string
  filePath: string
  caption: string | null
  uploadedAt: Date
}

interface Props {
  animalId: string
  photos: Photo[]
  primaryPhoto: string | null
  canUpload: boolean
}

export function PhotoGallery({ animalId, photos, primaryPhoto, canUpload }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [setPrimary, setSetPrimary] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null)

  // ── File selection ─────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setClientError(null)
    setServerError(null)
    setSelectedFile(null)

    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setClientError("Only JPEG, PNG and WebP images are accepted.")
      return
    }
    if (file.size > MAX_BYTES) {
      setClientError("File exceeds the 8 MB size limit.")
      return
    }

    setSelectedFile(file)
    setSetPrimary(photos.length === 0) // auto-check for first photo
  }

  function clearSelection() {
    setSelectedFile(null)
    setClientError(null)
    setServerError(null)
    setSetPrimary(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!selectedFile) return
    setServerError(null)
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append("photo", selectedFile)
      fd.append("setPrimary", String(setPrimary))

      const res = await fetch(`/api/animals/${animalId}/photos`, {
        method: "POST",
        body: fd,
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setServerError(json.error ?? "Upload failed. Please try again.")
        return
      }

      clearSelection()
      router.refresh()
    } finally {
      setUploading(false)
    }
  }

  // ── Set primary ────────────────────────────────────────────────────────────
  async function handleSetPrimary(photoId: string, filePath: string) {
    setSettingPrimary(photoId)
    try {
      const res = await fetch(`/api/animals/${animalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryPhoto: filePath }),
      })

      if (res.ok) router.refresh()
    } finally {
      setSettingPrimary(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Gallery grid */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <ImageOff className="w-8 h-8 mb-2 text-slate-300" />
          <p className="text-sm">No photos yet.</p>
          {canUpload && (
            <p className="text-xs mt-1">Upload the first photo below.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo) => {
            const isPrimary = photo.filePath === primaryPhoto
            return (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/uploads/${photo.filePath}`}
                  alt={photo.caption ?? "Animal photo"}
                  className="w-full h-full object-cover"
                />

                {/* Primary badge */}
                {isPrimary && (
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
                    <Star className="w-3 h-3" />
                    Primary
                  </span>
                )}

                {/* Set as primary overlay (canUpload users only) */}
                {canUpload && !isPrimary && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                    <button
                      onClick={() => handleSetPrimary(photo.id, photo.filePath)}
                      disabled={settingPrimary === photo.id}
                      className="flex items-center gap-1.5 text-xs font-medium bg-white text-slate-800 px-3 py-1.5 rounded-lg shadow hover:bg-yellow-50 transition-colors disabled:opacity-60"
                    >
                      <Star className="w-3 h-3" />
                      {settingPrimary === photo.id ? "Updating…" : "Set as primary"}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Upload section */}
      {canUpload && (
        <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Upload a photo</p>

          {/* Error messages */}
          {(clientError || serverError) && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {clientError ?? serverError}
            </p>
          )}

          {selectedFile ? (
            /* Selected file preview row */
            <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
              </div>
              <button onClick={clearSelection} className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* File picker trigger */
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg py-4 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Choose a photo
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* "Set as primary" checkbox — only shown when there are existing photos */}
          {selectedFile && photos.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={setPrimary}
                onChange={(e) => setSetPrimary(e.target.checked)}
                className="rounded border-slate-300"
              />
              Set as primary photo
            </label>
          )}

          {selectedFile && (
            <Button
              size="sm"
              loading={uploading}
              onClick={handleUpload}
              className="w-full"
            >
              <Upload className="w-4 h-4" />
              Upload photo
            </Button>
          )}

          <p className="text-xs text-slate-400">JPEG, PNG or WebP · max 8 MB</p>
        </div>
      )}
    </div>
  )
}
