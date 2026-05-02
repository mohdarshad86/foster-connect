import { formatDate } from "@/lib/utils"
import { FileText } from "lucide-react"

interface Note {
  id:          string
  weekOf:      Date | string
  noteText:    string
  weightKg:    number | null
  fosterParent: { name: string }
}

export function NoteTimeline({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-8 h-8 text-slate-200 mx-auto mb-3" />
        <p className="text-sm text-slate-400">No progress notes yet.</p>
      </div>
    )
  }

  return (
    <ol className="space-y-4">
      {notes.map((note) => (
        <li key={note.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              Week of {formatDate(note.weekOf)}
            </span>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {note.weightKg != null && (
                <span className="font-medium text-slate-600">{note.weightKg} kg</span>
              )}
              <span>{note.fosterParent.name}</span>
            </div>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.noteText}</p>
        </li>
      ))}
    </ol>
  )
}
