import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { PlusCircle, PawPrint } from "lucide-react"
import { StoryActions } from "@/components/success-stories/StoryActions"

export default async function SuccessStoriesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "RESCUE_LEAD") redirect("/dashboard")

  const stories = await prisma.successStory.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  })

  const publishedCount = stories.filter((s) => s.isPublished).length

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Success Stories</h1>
          <p className="text-sm text-slate-500 mt-1">
            {stories.length === 0
              ? "No stories yet."
              : `${stories.length} stor${stories.length === 1 ? "y" : "ies"} · ${publishedCount} published on homepage`}
          </p>
        </div>
        <Link
          href="/success-stories/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New story
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <PawPrint className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No success stories yet. Create the first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <div
              key={story.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4"
            >
              {/* Photo thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                {story.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/uploads/${story.photoUrl}`}
                    alt={story.animalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PawPrint className="w-6 h-6 text-slate-300" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{story.animalName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{story.adoptionMonth}</p>
                <p className="text-xs text-slate-500 mt-1 truncate">{story.blurb}</p>
              </div>

              {/* Meta */}
              <div className="text-right text-xs text-slate-400 shrink-0">
                <p>By {story.createdBy.name}</p>
                <p>{formatDate(story.createdAt)}</p>
              </div>

              {/* Actions */}
              <StoryActions storyId={story.id} isPublished={story.isPublished} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
