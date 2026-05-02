import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: number | string
  sublabel?: string
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "gray"
  icon?: React.ReactNode
}

const colorMap = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   icon: "text-blue-400" },
  green:  { bg: "bg-green-50",  text: "text-green-700",  icon: "text-green-400" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", icon: "text-yellow-400" },
  red:    { bg: "bg-red-50",    text: "text-red-700",    icon: "text-red-400" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", icon: "text-purple-400" },
  gray:   { bg: "bg-slate-50",  text: "text-slate-700",  icon: "text-slate-400" },
}

export function StatCard({
  label,
  value,
  sublabel,
  color = "blue",
  icon,
}: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={cn("rounded-xl border border-slate-200 p-5 bg-white")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={cn("text-3xl font-bold mt-1", c.text)}>{value}</p>
          {sublabel && (
            <p className="text-xs text-slate-400 mt-1">{sublabel}</p>
          )}
        </div>
        {icon && (
          <div className={cn("p-2 rounded-lg", c.bg)}>
            <span className={cn("block", c.icon)}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  )
}
