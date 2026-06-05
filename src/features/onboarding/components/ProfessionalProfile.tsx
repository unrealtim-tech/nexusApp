import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { NexusCareLogo } from "@/shared/components/ui/NexusCareLogo";
import { X, Bell, Award, Stethoscope } from "lucide-react";
import { useClinicianProfile } from "@/features/onboarding/hooks/useOnboarding";
import {
  professionalProfileSchema,
  clinicianRoles,
  clinicalSpecialties,
  experienceLevels,
  type ProfessionalProfileFormData,
} from "@/features/onboarding/schemas/onboardingSchemas";
import type { ClinicalSpecialty } from "@/features/onboarding/services/onboardingApi";
import { useRoleBasePath } from "@/shared/onboarding/hooks/useRoleBasePath";

function mapSelectedSpecialtyToBackend(specialtyId: string): ClinicalSpecialty {
  switch (specialtyId) {
    case "general-practice":
      return "general-nursing";
    case "surgery":
      return "surgery";
    case "pediatrics":
      return "pediatrics";
    case "nursing":
      return "general-nursing";
    case "anesthesiology":
      return "anesthesiology";
    default:
      return "other";
  }
}

const specialtyLabels: Record<(typeof clinicalSpecialties)[number], string> = {
  "general-practice": "General Practice ✓",
  surgery: "Surgery",
  pediatrics: "Pediatrics",
  nursing: "Nursing",
  anesthesiology: "Anesthesiology",
  other: "+ Other",
};

const experienceLabels: Record<(typeof experienceLevels)[number], string> = {
  "0-1": "0-1 years (Fresh Graduate)",
  "2-5": "2-5 years",
  "6-10": "6-10 years",
  "11-15": "11-15 years",
  "16-20": "16-20 years",
  "20+": "20+ years",
};

export function ProfessionalProfile() {
  const navigate = useNavigate();
  const basePath = useRoleBasePath();
  const profileMutation = useClinicianProfile();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProfessionalProfileFormData>({
    resolver: zodResolver(professionalProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: "Doctor",
      licenseNumber: "",
      specialties: [],
      yearsOfExperience: undefined,
    },
  });

  const onSubmit = async (data: ProfessionalProfileFormData) => {
    const clinicianId = localStorage.getItem("clinicianId");
    if (!clinicianId) {
      return;
    }

    try {
      await profileMutation.mutateAsync({
        clinicianId,
        payload: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role,
          license_number: data.licenseNumber,
          specialty: mapSelectedSpecialtyToBackend(data.specialties[0] || "other"),
        },
      });

      localStorage.setItem("professionalData", JSON.stringify(data));
      navigate(`${basePath}/onboarding/payout-setup`);
    } catch {
      // Error state managed by mutation
    }
  };

  const handleClose = () => {
    navigate("/auth/login");
  };

  return (
    <div className="min-h-screen bg-[#F3FAFF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <NexusCareLogo size="md" />
            </div>
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-slate-400" />
              <button
                onClick={handleClose}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              STEP 02 OF 04
            </p>
            <h1 className="text-2xl font-bold text-onboarding-textPrimary">
              Professional Identity
            </h1>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-1">
              <div
                className="bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue h-1 rounded-full"
                style={{ width: "50%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="bg-white rounded-t-none rounded-b-2xl border-t-0 shadow-md">
          <CardContent className="p-6 space-y-6">
            {/* Description */}
            <p className="text-onboarding-textSecondary leading-relaxed">
              To ensure clinical safety and maintain our high standards of care,
              please provide your current medical registration details.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Name and Role */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                    First Name
                  </label>
                  <input
                    type="text"
                    {...register("firstName")}
                    className={`w-full rounded-lg border border-slate-200 bg-onboarding-inputBackground px-3 py-2 text-sm text-neutral-800 outline-none transition-colors ${
                      errors.firstName ? "border-red-300 text-red-700" : ""
                    }`}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                    Last Name
                  </label>
                  <input
                    type="text"
                    {...register("lastName")}
                    className={`w-full rounded-lg border border-slate-200 bg-onboarding-inputBackground px-3 py-2 text-sm text-neutral-800 outline-none transition-colors ${
                      errors.lastName ? "border-red-300 text-red-700" : ""
                    }`}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Professional Role
                </label>
                <div className="flex items-center gap-2 rounded-lg bg-onboarding-inputBackground px-3 py-2.5">
                  <select
                    {...register("role")}
                    className="flex-1 bg-transparent text-sm text-neutral-800 outline-none"
                  >
                    {clinicianRoles.map((role) => (
                      <option key={role} value={role}>
                        {role === "LabTechnician" ? "Lab Technician" : role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* License Number */}
              <div className="space-y-3">
                <label className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>License Number</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-lg bg-onboarding-inputBackground px-3 py-2.5">
                  <input
                    type="text"
                    {...register("licenseNumber")}
                    className={`flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400 font-mono ${
                      errors.licenseNumber ? "text-red-600" : ""
                    }`}
                    placeholder="MDCN/R/0000"
                  />
                </div>
                {errors.licenseNumber && (
                  <p className="text-sm text-red-600">
                    {errors.licenseNumber.message}
                  </p>
                )}
              </div>

              {/* Identification Method */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Identification Method
                </label>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-600">
                    Your license will be verified with the Medical and Dental
                    Council of Nigeria.
                  </p>
                </div>
              </div>

              {/* Years of Experience */}
              <div className="space-y-3">
                <label className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 flex items-center space-x-2">
                  <Stethoscope className="h-4 w-4" />
                  <span>Years of Experience</span>
                </label>
                <div className="flex items-center gap-2.5 rounded-lg bg-onboarding-inputBackground px-3 py-2.5">
                  <select
                    {...register("yearsOfExperience")}
                    className={`flex-1 bg-transparent text-sm text-neutral-800 outline-none ${
                      errors.yearsOfExperience ? "text-red-600" : ""
                    }`}
                  >
                    <option value="">Select experience level</option>
                    {experienceLevels.map((level) => (
                      <option key={level} value={level}>
                        {experienceLabels[level]}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.yearsOfExperience && (
                  <p className="text-sm text-red-600">
                    {errors.yearsOfExperience.message}
                  </p>
                )}
              </div>

              {/* Specialties & Expertise */}
              <div className="space-y-4">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Specialties & Expertise
                </label>
                <p className="text-sm text-onboarding-textSecondary">
                  Select all areas that match your qualifications (multiple
                  selections allowed)
                </p>

                <Controller
                  control={control}
                  name="specialties"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-3">
                      {clinicalSpecialties.map((id) => {
                        const isSelected = field.value.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? field.value.filter((s) => s !== id)
                                : [...field.value, id];
                              field.onChange(next);
                            }}
                            className={`px-4 py-2 rounded-full border transition-all text-sm font-medium ${
                              isSelected
                                ? "bg-teal-500 text-white border-teal-500"
                                : "bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            {specialtyLabels[id]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.specialties && (
                  <p className="text-sm text-red-600">
                    {errors.specialties.message}
                  </p>
                )}
              </div>

              {/* Data Privacy Section */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">
                      Data Privacy
                    </h4>
                    <p className="text-sm text-slate-600">
                      Your credentials are encrypted and stored following
                      international health data standards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fast Track Section */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">
                      Fast Track
                    </h4>
                    <p className="text-sm text-slate-600">
                      Most licenses are verified automatically within 24 hours
                      of submission.
                    </p>
                  </div>
                </div>
              </div>

              {profileMutation.isError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {profileMutation.error?.message ||
                    "Unable to complete your profile. Please try again."}
                </div>
              )}

              {!localStorage.getItem("clinicianId") && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  Unable to complete registration. Please verify your email
                  first.
                </div>
              )}

              {/* Continue Button */}
              <Button
                type="submit"
                disabled={profileMutation.isPending}
                isLoading={profileMutation.isPending}
                className="w-full rounded-lg bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue py-3 text-sm font-semibold uppercase tracking-widest text-white transition-all shadow-md hover:shadow-lg"
              >
                {profileMutation.isPending
                  ? "Verifying Profile..."
                  : "Verify & Continue"}
              </Button>

              {/* Skip Option */}
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  I'll complete this later
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
