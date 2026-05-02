import { redirect } from "next/navigation"

/**
 * The bare `/` route inside the dashboard group redirects straight to /dashboard.
 * This means users who land on the root after login get sent to the right place.
 */
export default function DashboardRootPage() {
  redirect("/dashboard")
}
