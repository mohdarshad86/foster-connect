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
