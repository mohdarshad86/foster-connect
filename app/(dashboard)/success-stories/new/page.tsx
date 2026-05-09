import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SuccessStoryForm } from "@/components/success-stories/SuccessStoryForm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewSuccessStoryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "RESCUE_LEAD") redirect("/dashboard")

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/success-stories"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to stories
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Success Story</h1>
        <p className="text-sm text-slate-500 mt-1">
          Share an adoption success story on the public homepage.
        </p>
      </div>

      <SuccessStoryForm />
    </div>
  )
}
