import type { AnimalStatus } from "@prisma/client";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { getAnimalStatusLabel } from "@/lib/animalStatus";

const STATUS_CONFIG: Record<
  AnimalStatus,
  { label: string; variant: BadgeVariant }
> = {
  INTAKE: { label: getAnimalStatusLabel("INTAKE"), variant: "gray" },
  IN_FOSTER: { label: getAnimalStatusLabel("IN_FOSTER"), variant: "blue" },
  ADOPTION_READY: {
    label: getAnimalStatusLabel("ADOPTION_READY"),
    variant: "green",
  },
  PENDING_ADOPTION: {
    label: getAnimalStatusLabel("PENDING_ADOPTION"),
    variant: "yellow",
  },
  ADOPTED: { label: getAnimalStatusLabel("ADOPTED"), variant: "purple" },
};

export function AnimalStatusBadge({ status }: { status: AnimalStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
