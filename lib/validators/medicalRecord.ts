import { z } from "zod"

const BaseSchema = z.object({
  date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  notes: z.string().max(2000).optional().nullable(),
})

export const VaccinationSchema = BaseSchema.extend({
  type:         z.literal("VACCINATION"),
  vaccineName:  z.string().min(1).max(120),
  nextDueDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
})

export const SurgerySchema = BaseSchema.extend({
  type:          z.literal("SURGERY"),
  surgeryType:   z.string().min(1).max(120),
  outcome:       z.string().max(120).optional().nullable(),
  recoveryNotes: z.string().max(2000).optional().nullable(),
})

export const MedicationSchema = BaseSchema.extend({
  type:                z.literal("MEDICATION"),
  drugName:            z.string().min(1).max(120),
  dosage:              z.string().max(80).optional().nullable(),
  frequency:           z.string().max(80).optional().nullable(),
  medicationEndDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
})

export const MedicalRecordCreateSchema = z.discriminatedUnion("type", [
  VaccinationSchema,
  SurgerySchema,
  MedicationSchema,
])

export type MedicalRecordCreate = z.infer<typeof MedicalRecordCreateSchema>
