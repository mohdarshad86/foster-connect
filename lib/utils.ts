import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind classes safely — handles conditional classes and conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a Date to a readable string.
 * e.g. "May 2, 2025"
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Format a Date to a readable datetime string.
 * e.g. "Thursday, June 5, 2025 at 2:00 PM"
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/**
 * Short datetime format for compact displays.
 * e.g. "Jun 5, 2025 2:00 PM"
 */
export function formatDateTimeShort(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/**
 * Format a Date as a human-readable relative time string.
 * e.g. "just now", "3 hours ago", "2 days ago"
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1)   return "just now"
  if (diffMins < 60)  return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7)   return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  return formatDate(then)
}

/**
 * Format a human-readable duration between two dates.
 * e.g. "3 weeks", "2 months", "1 year 3 months"
 * Returns null if either date is invalid.
 */
export function formatDuration(from: Date | string, to: Date | string = new Date()): string | null {
  const start = new Date(from)
  const end   = new Date(to)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

  const diffMs = end.getTime() - start.getTime()
  if (diffMs < 0) return null

  // Total months (approximate, ignoring day-of-month edge cases for simplicity)
  const totalMonths =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) -
    (end.getDate() < start.getDate() ? 1 : 0)

  if (totalMonths < 1) {
    const weeks = Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)))
    return `${weeks} week${weeks === 1 ? "" : "s"}`
  }

  if (totalMonths < 12) {
    return `${totalMonths} month${totalMonths === 1 ? "" : "s"}`
  }

  const years          = Math.floor(totalMonths / 12)
  const remainingMonths = totalMonths % 12

  if (remainingMonths === 0) {
    return `${years} year${years === 1 ? "" : "s"}`
  }
  return `${years} year${years === 1 ? "" : "s"} ${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`
}

/**
 * Return the ISO date of the Monday of the week containing `date`.
 * Used to normalise progress note weekOf values.
 */
export function getWeekMonday(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust for Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
