"use client"

import { useState, useEffect } from "react"
import { Link2, Check } from "lucide-react"

/**
 * Copies the current page URL to the clipboard.
 * Rendered only when the Clipboard API is available (hidden on HTTP or
 * unsupported browsers so it is never shown in a broken state).
 */
export function CopyLinkButton() {
  const [clipboardAvailable, setClipboardAvailable] = useState(false)
  const [copied, setCopied]                         = useState(false)

  // Detect availability after mount (avoids SSR mismatch)
  useEffect(() => {
    setClipboardAvailable(
      typeof navigator !== "undefined" && !!navigator.clipboard,
    )
  }, [])

  if (!clipboardAvailable) return null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard write failed — hide the button
      setClipboardAvailable(false)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
      aria-label="Copy link to this page"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Link2 className="w-4 h-4" />
          Copy link
        </>
      )}
    </button>
  )
}
