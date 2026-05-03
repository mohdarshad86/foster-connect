import type { AnimalStatus, ApplicationStatus } from "@prisma/client"
import { ValidationError } from "@/lib/permissions"

// ---------------------------------------------------------------------------
// Valid status transitions — enforced server-side on every PATCH to an animal
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<AnimalStatus, AnimalStatus[]> = {
  INTAKE:           ["IN_FOSTER"],
  IN_FOSTER:        ["ADOPTION_READY", "INTAKE"],
  ADOPTION_READY:   ["PENDING_ADOPTION", "IN_FOSTER"],
  PENDING_ADOPTION: ["ADOPTED", "ADOPTION_READY"],
  ADOPTED:          ["INTAKE"], // returned-animal edge case
}

export function assertValidTransition(
  from: AnimalStatus,
  to: AnimalStatus
): void {
  const valid = VALID_TRANSITIONS[from]
  if (!valid.includes(to)) {
    throw new ValidationError(
      `Cannot transition from ${from} to ${to}. ` +
      `Valid transitions: ${valid.join(", ")}`
    )
  }
}

export function validNextStatuses(current: AnimalStatus): AnimalStatus[] {
  return VALID_TRANSITIONS[current] ?? []
}

// ---------------------------------------------------------------------------
// Application status groups — single source of truth consumed by dashboard,
// applications list page, and the API route.
// ---------------------------------------------------------------------------

export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = ["SUBMITTED", "UNDER_REVIEW"]
