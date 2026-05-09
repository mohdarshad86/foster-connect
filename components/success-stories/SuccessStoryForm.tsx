"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Image as ImageIcon } from "lucide-react"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 8 * 1024 * 1024

export function SuccessStoryForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [animalName,    setAnimalName]    = useState("")
  const [blurb,         setBlurb]         = useState("")
  const [adoptionMonth, setAdoptionMonth] = useState("")
  const [isPublished,   setIsPublished]   = useState(false)
  const [photoFile,     setPhotoFile]     = useState<File | null>(null)
  const [photoPreview,  setPhotoPreview]  = useState<string | null>(null)

  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [fileError,    setFileError]    = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFileError(null)
    setPhotoFile(null)
    setPhotoPreview(null)

    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("Only JPEG, PNG and WebP images are accepted.")
      return
    }
    if (file.size > MAX_BYTES) {
      setFileError("File exceeds the 8 MB size limit.")
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (blurb.length > 200) {
      setError("Blurb must be 200 characters or fewer.")
      return
    }

    setSaving(true)

    const formData = new FormData()
    formData.append("animalName",    animalName.trim())
    formData.append("blurb",         blurb.trim())
    formData.append("adoptionMonth", adoptionMonth.trim())
    formData.append("isPublished",   String(isPublished))
    if (photoFile) {
      formData.append("photo", photoFile)
    }

    const res = await fetch("/api/success-stories", {
      method: "POST",
      body:   formData,
    })

    setSaving(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? "Failed to create story. Please try again.")
      return
    }

    router.push("/success-stories")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Animal name */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Animal name <span className="text-red-500">*</span>
        </label>
        <input
          required
          type="text"
          value={animalName}
          onChange={(e) => setAnimalName(e.target.value)}
          placeholder="e.g. Buddy"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Adoption month */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Adoption month <span className="text-red-500">*</span>
        </label>
        <input
          required
          type="text"
          value={adoptionMonth}
          onChange={(e) => setAdoptionMonth(e.target.value)}
          placeholder="e.g. May 2025"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Blurb */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Story blurb <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={3}
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          placeholder="A short description of the adoption success…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
        <p className={`text-xs ${blurb.length > 200 ? "text-red-500 font-medium" : "text-slate-400"}`}>
          {blurb.length} / 200 characters
        </p>
      </div>

      {/* Photo */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Photo (optional)
        </label>
        {photoPreview ? (
          <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/70"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            Upload photo
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        {fileError && <p className="text-xs text-red-500">{fileError}</p>}
      </div>

      {/* Published toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
        <span className="text-sm text-slate-700 font-medium">
          Publish immediately on homepage
        </span>
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Create story"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
