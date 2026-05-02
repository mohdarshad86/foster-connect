import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const tempPassword = "ChangeMe123!"
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const lead = await prisma.user.upsert({
    where: { email: "admin@fosterconnect.local" },
    update: {},
    create: {
      name: "Rescue Lead",
      email: "admin@fosterconnect.local",
      passwordHash,
      role: "RESCUE_LEAD",
      isActive: true,
      mustChangePassword: true,
    },
  })

  console.log("\n✅ Seed complete")
  console.log(`   Email:    ${lead.email}`)
  console.log(`   Password: ${tempPassword}`)
  console.log("   ⚠️  Change this password immediately after first login.\n")
}

main()
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
