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
