import Link from "next/link"
import { CheckCircle, PawPrint } from "lucide-react"

interface Props {
  params:       Promise<{ animalId: string }>
  searchParams: Promise<{ email?: string }>
}

export default async function ApplicationSuccessPage({ searchParams }: Props) {
  const { email } = await searchParams

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Brand mark */}
        <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-lg">
          <PawPrint className="w-6 h-6" />
          Foster Connect
        </div>

        {/* Success card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-10 space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Application received!
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Your application has been received.{" "}
            {email ? (
              <>
                We&apos;ll be in touch at{" "}
                <span className="font-medium text-slate-800">{email}</span>.
              </>
            ) : (
              "We'll be in touch soon."
            )}
          </p>

          <p className="text-xs text-slate-400">
            Please check your spam folder if you don&apos;t hear from us within
            a few business days.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block text-sm text-blue-600 hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
