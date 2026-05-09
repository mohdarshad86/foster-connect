import { ApplicationStatusLookup } from "@/components/apply/ApplicationStatusLookup"
import { PawPrint } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Check Application Status — Foster Connect" }

export default function ApplicationStatusPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Brand mark */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-lg"
          >
            <PawPrint className="w-6 h-6" />
            Foster Connect
          </Link>
        </div>

        {/* Heading */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Check Your Application</h1>
          <p className="text-sm text-slate-500">
            Enter the email you applied with and the animal&apos;s name to see your current status.
          </p>
        </div>

        {/* Interactive lookup form */}
        <ApplicationStatusLookup />

        <p className="text-center text-xs text-slate-400">
          Foster Connect · All rights reserved
        </p>
      </div>
    </div>
  )
}
