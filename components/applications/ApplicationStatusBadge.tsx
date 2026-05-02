import { Badge, type BadgeVariant } from "@/components/ui/Badge"
import type { ApplicationStatus } from "@prisma/client"

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; variant: BadgeVariant }> = {
  SUBMITTED:             { label: "Submitted",          variant: "gray"   },
  UNDER_REVIEW:          { label: "Under Review",       variant: "blue"   },
  MEET_GREET_SCHEDULED:  { label: "Meet & Greet",       variant: "yellow" },
  RECOMMENDED:           { label: "Recommended",        variant: "green"  },
  APPROVED:              { label: "Approved",           variant: "green"  },
  DENIED:                { label: "Denied",             variant: "red"    },
  WAITLISTED:            { label: "Waitlisted",         variant: "default"},
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CONFIG[status]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export { STATUS_CONFIG }
