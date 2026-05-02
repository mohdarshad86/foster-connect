import { z } from "zod"

export const UserCreateSchema = z.object({
  name:  z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum([
    "RESCUE_LEAD",
    "INTAKE_SPECIALIST",
    "FOSTER_PARENT",
    "MEDICAL_OFFICER",
    "ADOPTION_COUNSELOR",
  ]),
})

export type UserCreateInput = z.infer<typeof UserCreateSchema>
