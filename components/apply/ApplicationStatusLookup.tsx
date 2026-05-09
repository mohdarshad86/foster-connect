"use client"

import { useState } from "react"
import { PawPrint, Search } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { formatDate, formatDateTime } from "@/lib/utils"

interface LookupResult {
  found:       boolean
  status?:     string
  statusLabel?: string
  animalName?:  string
  animalPhoto?: string | null
  submittedAt?: string
  meetGreetAt?: string | null
}

const STATUS_COLOURS: Record<string, string> = {
  Received:                "bg-blue-50 text-blue-700 border-blue-200",
  "Under Review":          "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Meet & Greet Scheduled":"bg-purple-50 text-purple-700 border-purple-200",
  Approved:                "bg-green-50 text-green-700 border-green-200",
  "Not Approved":          "bg-slate-50 text-slate-600 border-slate-200",
  Waitlisted:              "bg-orange-50 text-orange-700 border-orange-200",
}

export function ApplicationStatusLookup() {
  const [email, setEmail]           = useState("")
  const [animalName, setAnimalName] = useState("")
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState<LookupResult | null>(null)
  const [error, setError]           = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const params = new URLSearchParams({ email: email.trim(), animalName: animalName.trim() })
      const res = await fetch(`/api/application-status?${params}`)

      if (res.status === 429) {
        setError("Too many lookups. Please wait a moment and try again.")
        return
      }

      if (!res.ok) {
        setError("Something went wrong. Please try again.")
        return
      }

      const data: LookupResult = await res.json()
      setResult(data)
    } catch {
      setError("Unable to reach the server. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const colourClass = result?.statusLabel
    ? (STATUS_COLOURS[result.statusLabel] ?? "bg-slate-50 text-slate-700 border-slate-200")
    : ""

  return (
    <div className="space-y-6">
      {/* Lookup form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-8 space-y-5"
      >
        <Input
          label="Email Address"
          type="email"
          placeholder="jane@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Animal Name"
          placeholder="e.g. Biscuit"
          required
          value={animalName}
          onChange={(e) => setAnimalName(e.target.value)}
        />

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="w-full"
        >
          <Search className="w-4 h-4 mr-2" />
          Check Status
        </Button>
      </form>

      {/* Result */}
      {result && (
        result.found ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Animal photo */}
            {result.animalPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/uploads/${result.animalPhoto}`}
                alt={result.animalName}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-blue-50 flex items-center justify-center">
                <PawPrint className="w-12 h-12 text-blue-200" />
              </div>
            )}

            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Animal</p>
                <p className="text-lg font-semibold text-slate-900">{result.animalName}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Status</p>
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${colourClass}`}>
                  {result.statusLabel}
                </span>
              </div>

              {result.meetGreetAt && result.statusLabel === "Meet & Greet Scheduled" && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
                    Meet &amp; Greet Date
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {formatDateTime(result.meetGreetAt)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Please contact us to confirm your attendance.
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Submitted</p>
                <p className="text-sm text-slate-600">{formatDate(result.submittedAt!)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-8 text-center space-y-2">
            <PawPrint className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="text-slate-700 font-medium">No application found.</p>
            <p className="text-sm text-slate-500">
              We couldn&apos;t find an application matching those details.
              Please double-check your email and animal name.
            </p>
          </div>
        )
      )}
    </div>
  )
}
