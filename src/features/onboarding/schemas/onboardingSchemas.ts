import { z } from "zod";

// ─── Hospital Registration ──────────────────────────────────────────────
export const hospitalRegistrationSchema = z.object({
  hospitalName: z
    .string()
    .min(2, "Hospital name must be at least 2 characters")
    .max(150, "Hospital name must be under 150 characters"),
  facilityType: z.enum([
    "Private Facility",
    "Public Hospital",
    "Clinic",
    "Specialty Center",
  ]),
  yearEstablished: z
    .string()
    .min(4, "Enter a valid year")
    .regex(/^(19|20)\d{2}$/, "Enter a valid year between 1900 and 2099"),
  facilityLogoFileName: z.string().optional(),
  registrationNumber: z
    .string()
    .min(1, "Registration number is required")
    .regex(
      /^RC-?\d{5,}$/i,
      "Enter a valid CAC registration number (e.g., RC-1234567)",
    ),
  aboutHospital: z
    .string()
    .min(20, "Provide a short overview of the hospital")
    .max(750, "Please keep the overview under 750 characters"),
  postalCode: z
    .string()
    .regex(/^\d{5,6}$/, "Enter a valid 5–6 digit postal code")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Enter a valid email address"),
});

export type HospitalRegistrationFormData = z.infer<
  typeof hospitalRegistrationSchema
>;

// ─── Hospital Location & Geofencing ───────────────────────────────────────
export const hospitalLocationSchema = z.object({
  streetAddress: z
    .string()
    .min(5, "Street address must be at least 5 characters"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  geofenceRadius: z
    .number()
    .min(100, "Radius must be at least 100 meters")
    .max(5000, "Radius must be 5km or less"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export type HospitalLocationFormData = z.infer<typeof hospitalLocationSchema>;
export const legalVerificationSchema = z.object({
  medicalCertificateFileName: z.string().optional(),
  taxCertificateFileName: z.string().optional(),
  registrationNumber: z.string().min(1, "Registration number is required"),
  expiryDate: z
    .string()
    .min(1, "Expiry date is required")
    .refine(
      (val) => new Date(val) > new Date(),
      "Expiry date must be in the future",
    ),
  issuingAuthority: z.string().min(1, "Issuing authority is required"),
});

export type LegalVerificationFormData = z.infer<typeof legalVerificationSchema>;

// ─── Professional Profile (Clinician) ───────────────────────────────────
export const clinicianRoles = [
  "Doctor",
  "Nurse",
  "LabTechnician",
  "Pharmacist",
  "Radiographer",
  "Physiotherapist",
  "Other",
] as const;

export const clinicalSpecialties = [
  "general-practice",
  "surgery",
  "pediatrics",
  "nursing",
  "anesthesiology",
  "other",
] as const;

export const experienceLevels = [
  "0-1",
  "2-5",
  "6-10",
  "11-15",
  "16-20",
  "20+",
] as const;

export const professionalProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be under 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be under 50 characters"),
  role: z.enum(clinicianRoles, {
    error: "Select a valid professional role",
  }),
  licenseNumber: z
    .string()
    .min(1, "License number is required")
    .regex(
      /^MDCN\/R\/\d{4,}$/,
      "Enter a valid MDCN license (e.g., MDCN/R/12345)",
    ),
  specialties: z
    .array(z.enum(clinicalSpecialties))
    .min(1, "Select at least one specialty"),
  yearsOfExperience: z.enum(experienceLevels, {
    error: "Select your years of experience",
  }),
});

export type ProfessionalProfileFormData = z.infer<
  typeof professionalProfileSchema
>;

// ─── Payout Setup ───────────────────────────────────────────────────────
export const payoutSetupSchema = z.object({
  bankCode: z.string().min(1, "Please select a bank"),
  accountNumber: z
    .string()
    .length(10, "Account number must be exactly 10 digits")
    .regex(/^\d{10}$/, "Account number must contain only digits"),
  accountName: z.string(),
});

export type PayoutSetupFormData = z.infer<typeof payoutSetupSchema>;
