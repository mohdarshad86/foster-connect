import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional section title rendered above the children */
  title?: string
  /** Optional right-aligned content next to the title (e.g. a count badge) */
  action?: React.ReactNode
}

export function Card({ title, action, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden",
        className
      )}
      {...props}
    >
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          {action && <div className="text-sm text-slate-500">{action}</div>}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

// Compact list item used inside a Card
export function CardRow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-2.5 border-b border-slate-50 last:border-0",
        className
      )}
    >
      {children}
    </div>
  )
}

// Empty state displayed when a card has no items
export function CardEmpty({ message = "No items to show." }: { message?: string }) {
  return (
    <p className="text-sm text-slate-400 text-center py-6">{message}</p>
  )
}
