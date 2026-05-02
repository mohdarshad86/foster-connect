import { z } from "zod"

export const ApplicationCreateSchema = z.object({
  animalId:       z.string().min(1, "Animal ID is required"),
  applicantName:  z.string().min(1, "Full name is required").max(120),
  applicantEmail: z.string().email("Please enter a valid email address"),
  applicantPhone: z.string().max(30).optional().or(z.literal("")),
  applicantAddress: z.string().max(300).optional().or(z.literal("")),
  householdNotes:  z.string().max(2000).optional().or(z.literal("")),
})

export type ApplicationCreateInput = z.infer<typeof ApplicationCreateSchema>
