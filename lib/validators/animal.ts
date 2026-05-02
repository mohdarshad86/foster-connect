import { z } from "zod"

// ---------------------------------------------------------------------------
// Animal intake — shared between IntakeForm (client) and POST /api/animals
// ---------------------------------------------------------------------------

export const AnimalCreateSchema = z.object({
  name:          z.string().min(1, "Name is required"),
  species:       z.enum(["Dog", "Cat", "Other"] as const),
  breed:         z.string().optional(),
  ageYears:      z.coerce.number().min(0).max(30).optional(),
  sex:           z.enum(["Male", "Female", "Unknown"] as const),
  colorMarkings: z.string().optional(),
  healthNotes:   z.string().optional(),
})

export type AnimalCreateInput = z.infer<typeof AnimalCreateSchema>

// ---------------------------------------------------------------------------
// Medical records — discriminated union by type
// ---------------------------------------------------------------------------

const VaccinationSchema = z.object({
  type:        z.literal("VACCINATION"),
  vaccineName: z.string().min(1, "Vaccine name is required"),
  date:        z.coerce.date(),
  nextDueDate: z.coerce.date().optional(),
  notes:       z.string().optional(),
})

const SurgerySchema = z.object({
  type:          z.literal("SURGERY"),
  surgeryType:   z.string().min(1, "Surgery type is required"),
  date:          z.coerce.date(),
  outcome:       z.string().optional(),
  recoveryNotes: z.string().optional(),
})

const MedicationSchema = z.object({
  type:              z.literal("MEDICATION"),
  drugName:          z.string().min(1, "Drug name is required"),
  dosage:            z.string().min(1, "Dosage is required"),
  frequency:         z.string().min(1, "Frequency is required"),
  date:              z.coerce.date(),
  medicationEndDate: z.coerce.date().optional(),
})

export const MedicalRecordSchema = z.discriminatedUnion("type", [
  VaccinationSchema,
  SurgerySchema,
  MedicationSchema,
])

export type MedicalRecordInput = z.infer<typeof MedicalRecordSchema>

// ---------------------------------------------------------------------------
// Progress note
// ---------------------------------------------------------------------------

export const ProgressNoteSchema = z.object({
  weekOf:   z.coerce.date(),
  noteText: z.string().min(20, "Note must be at least 20 characters"),
  weightKg: z.coerce.number().min(0).max(200).optional(),
})

export type ProgressNoteInput = z.infer<typeof ProgressNoteSchema>

// ---------------------------------------------------------------------------
// Personality profile
// ---------------------------------------------------------------------------

export const PersonalityProfileSchema = z.object({
  traits:       z.array(z.string()).default([]),
  energyLevel:  z.enum(["Low", "Medium", "High"] as const).optional(),
  goodWithKids: z.boolean().nullable().optional(),
  goodWithDogs: z.boolean().nullable().optional(),
  goodWithCats: z.boolean().nullable().optional(),
  idealHome:    z.string().max(500).optional(),
})

export type PersonalityProfileInput = z.infer<typeof PersonalityProfileSchema>

// ---------------------------------------------------------------------------
// Adopter application (public form)
// ---------------------------------------------------------------------------

export const AdopterApplicationSchema = z.object({
  animalId:        z.string().min(1),
  applicantName:   z.string().min(1, "Full name is required"),
  applicantEmail:  z.string().email("Valid email is required"),
  applicantPhone:  z.string().optional(),
  applicantAddress: z.string().optional(),
  householdNotes:  z.string().optional(),
})

export type AdopterApplicationInput = z.infer<typeof AdopterApplicationSchema>

// ---------------------------------------------------------------------------
// Medical alert
// ---------------------------------------------------------------------------

export const MedicalAlertSchema = z.object({
  description: z.string().min(1, "Description is required"),
  severity:    z.enum(["CRITICAL", "INFORMATIONAL"] as const),
})

export type MedicalAlertInput = z.infer<typeof MedicalAlertSchema>

// ---------------------------------------------------------------------------
// User creation
// ---------------------------------------------------------------------------

export const UserCreateSchema = z.object({
  name:  z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role:  z.enum([
    "RESCUE_LEAD",
    "INTAKE_SPECIALIST",
    "FOSTER_PARENT",
    "MEDICAL_OFFICER",
    "ADOPTION_COUNSELOR",
  ] as const),
})

export type UserCreateInput = z.infer<typeof UserCreateSchema>

// ---------------------------------------------------------------------------
// Vet partner
// ---------------------------------------------------------------------------

export const VetPartnerSchema = z.object({
  name:        z.string().min(1, "Contact name is required"),
  clinicName:  z.string().min(1, "Clinic name is required"),
  phone:       z.string().optional(),
  email:       z.string().email().optional().or(z.literal("")),
  address:     z.string().optional(),
  specialties: z.array(z.string()).default([]),
  notes:       z.string().optional(),
}).refine(
  (data) => !!(data.phone || data.email),
  { message: "At least one of phone or email is required" }
)

export type VetPartnerInput = z.infer<typeof VetPartnerSchema>
