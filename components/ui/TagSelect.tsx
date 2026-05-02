"use client"

interface Props {
  options:  string[]
  selected: string[]
  onChange: (next: string[]) => void
}

export function TagSelect({ options, selected, onChange }: Props) {
  function toggle(tag: string) {
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag],
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((tag) => {
        const active = selected.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={[
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              active
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            ].join(" ")}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}
