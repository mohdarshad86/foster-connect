// ---------------------------------------------------------------------------
// Backwards-compatibility redirect — public animal profiles moved to /animals/[id]
// Keep this file so any existing links/bookmarks to /public-animals/<id> still work.
// ---------------------------------------------------------------------------
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicAnimalLegacyRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/animals/${id}`);
}
