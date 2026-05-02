import { redirect } from "next/navigation"

/**
 * Root path — authenticated users are sent to their dashboard;
 * unauthenticated users are caught by middleware and sent to /login.
 */
export default function RootPage() {
  redirect("/dashboard")
}
