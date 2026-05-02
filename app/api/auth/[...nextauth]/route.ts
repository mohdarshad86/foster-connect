import { handlers } from "@/lib/auth"

// NextAuth route must be dynamic — never statically generated
export const dynamic = "force-dynamic"

export const { GET, POST } = handlers
