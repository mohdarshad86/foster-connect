import type { AnimalStatus } from "@prisma/client"
import { Badge, type BadgeVariant } from "@/components/ui/Badge"

const STATUS_CONFIG: Record<AnimalStatus, { label: string; variant: BadgeVariant }> = {
  INTAKE:           { label: "Intake",           variant: "gray" },
  IN_FOSTER:        { label: "In Foster",         variant: "blue" },
  ADOPTION_READY:   { label: "Adoption Ready",    variant: "green" },
  PENDING_ADOPTION: { label: "Pending Adoption",  variant: "yellow" },
  ADOPTED:          { label: "Adopted",           variant: "purple" },
}

export function AnimalStatusBadge({ status }: { status: AnimalStatus }) {
  const cfg = STATUS_CONFIG[status]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
