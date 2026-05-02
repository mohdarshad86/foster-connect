import type { AnimalStatus } from "@prisma/client"

const LABELS: Record<AnimalStatus, string> = {
  INTAKE:           "Intake",
  IN_FOSTER:        "In Foster",
  ADOPTION_READY:   "Adoption Ready",
  PENDING_ADOPTION: "Pending Adoption",
  ADOPTED:          "Adopted",
}

export function getAnimalStatusLabel(status: string): string {
  return LABELS[status as AnimalStatus] ?? status
}
