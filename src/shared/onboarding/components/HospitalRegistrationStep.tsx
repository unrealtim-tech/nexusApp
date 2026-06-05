import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building, FileText, UploadCloud } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { useHospitalOnboardingStore } from "@/features/onboarding/hooks/useHospitalOnboardingStore";
import {
  hospitalRegistrationSchema,
  type HospitalRegistrationFormData,
} from "@/features/onboarding/schemas/onboardingSchemas";
import { HospitalOnboardingShell } from "./HospitalOnboardingShell";
import { useRoleBasePath } from "@/shared/onboarding/hooks/useRoleBasePath";

const facilityTypes = [
  "Private Facility",
  "Public Hospital",
  "Clinic",
  "Specialty Center",
] as const;

export function HospitalRegistrationStep() {
  const navigate = useNavigate();
  const basePath = useRoleBasePath();
  const { registrationData, setRegistrationData } = useHospitalOnboardingStore();
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HospitalRegistrationFormData>({
    resolver: zodResolver(hospitalRegistrationSchema),
    defaultValues: registrationData,
  });

  const facilityName = watch("hospitalName");
  const facilityType = watch("facilityType");
  const yearEstablished = watch("yearEstablished");
  const aboutHospital = watch("aboutHospital");
  const logoFileName = watch("facilityLogoFileName");

  const onSubmit: SubmitHandler<HospitalRegistrationFormData> = (data) => {
    setRegistrationData(data);
    navigate(`${basePath}/onboarding/location-geofencing`);
  };

  const handleFileUpload = (file?: File) => {
    if (!file) return;
    setValue("facilityLogoFileName", file.name, { shouldValidate: true });
  };

  return (
    <HospitalOnboardingShell
      activeStep={0}
      title="Hospital Registration"
      subtitle="Establish your facility's core identity on the NexusCare network. This information will be verified against the MDCN database."
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-white bg-white p-8 shadow-soft">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="rounded-3xl bg-onboarding-fadedGreen p-6">
              <p className="text-sm font-semibold text-onboarding-textPrimary">Facility Identity</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                    Official Hospital Name
                  </label>
                  <input
                    type="text"
                    {...register("hospitalName")}
                    className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-onboarding-textPrimary outline-none transition focus:border-onboarding-primaryBlue focus:ring-2 focus:ring-onboarding-primaryBlue/10"
                    placeholder="e.g. St. Nicholas Hospital"
                  />
                  {errors.hospitalName && (
                    <p className="text-xs text-red-600">{errors.hospitalName.message}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                    Facility Type
                  </label>
                  <select
                    {...register("facilityType")}
                    className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-onboarding-textPrimary outline-none transition focus:border-onboarding-primaryBlue focus:ring-2 focus:ring-onboarding-primaryBlue/10"
                  >
                    {facilityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.facilityType && (
                    <p className="text-xs text-red-600">{errors.facilityType.message}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                    Year Established
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    {...register("yearEstablished")}
                    className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-onboarding-textPrimary outline-none transition focus:border-onboarding-primaryBlue focus:ring-2 focus:ring-onboarding-primaryBlue/10"
                    placeholder="YYYY"
                  />
                  {errors.yearEstablished && (
                    <p className="text-xs text-red-600">{errors.yearEstablished.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-onboarding-inputBackground p-6">
              <p className="text-sm font-semibold text-onboarding-textPrimary">Clinical Credentials</p>
              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                    MDCN Registration Number
                  </label>
                  <div className="mt-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-neutral-100">
                    <div className="flex items-center gap-3 text-sm text-onboarding-textPrimary">
                      <FileText className="h-5 w-5 text-onboarding-primaryBlue" />
                      <input
                        type="text"
                        {...register("registrationNumber")}
                        className="w-full bg-transparent text-sm text-onboarding-textPrimary outline-none"
                        placeholder="e.g. MDCN/XYZ/12345"
                      />
                    </div>
                  </div>
                  {errors.registrationNumber && (
                    <p className="mt-2 text-xs text-red-600">{errors.registrationNumber.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                    About the Hospital
                  </label>
                  <textarea
                    {...register("aboutHospital")}
                    rows={5}
                    className="w-full rounded-3xl border border-transparent bg-white px-4 py-3 text-sm text-onboarding-textPrimary outline-none transition focus:border-onboarding-primaryBlue focus:ring-2 focus:ring-onboarding-primaryBlue/10"
                    placeholder="Provide a brief overview of specialties, mission, and patient care philosophy..."
                  />
                  {errors.aboutHospital && (
                    <p className="mt-2 text-xs text-red-600">{errors.aboutHospital.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => navigate(`${basePath}/dashboard`)}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-onboarding-primaryBlue hover:bg-onboarding-primaryBlue/5 sm:w-auto"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue py-3 text-sm font-semibold text-white sm:w-auto"
              >
                Save & Continue
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6 rounded-[32px] border border-white bg-white p-6 shadow-soft">
          <div className="rounded-3xl bg-onboarding-inputBackground p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-onboarding-primaryBlue/10 p-3 text-onboarding-primaryBlue">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-onboarding-textPrimary">Facility Logo</p>
                <p className="mt-2 text-xs text-onboarding-textSecondary">
                  Click to upload or drag and drop SVG, PNG, JPG or GIF (max. 2MB).
                </p>
              </div>
            </div>
            <label
              htmlFor="facility-logo"
              className="mt-6 flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-onboarding-primaryBlue/30 bg-white text-center text-sm text-onboarding-textSecondary transition hover:border-onboarding-primaryBlue/60"
            >
              <input
                id="facility-logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFileUpload(event.target.files?.[0])}
              />
              <UploadCloud className="h-7 w-7 text-onboarding-primaryBlue" />
              <span className="font-semibold text-onboarding-primaryBlue">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-onboarding-textSecondary">SVG, PNG, JPG or GIF (max. 2MB)</span>
            </label>
            {logoFileName && (
              <p className="text-xs text-onboarding-textPrimary">Uploaded file: {logoFileName}</p>
            )}
          </div>

          <div className="rounded-3xl bg-onboarding-fadedGreen p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-onboarding-textPrimary">Live Marketplace Preview</p>
                <p className="mt-2 text-xs text-onboarding-textSecondary">
                  Your hospital details will appear to clinicians and partners exactly like this.
                </p>
              </div>
              <span className="rounded-full bg-onboarding-primaryGreen/10 px-3 py-1 text-[11px] font-semibold text-onboarding-primaryGreen">
                PREVIEW
              </span>
            </div>

            <div className="mt-6 rounded-[28px] border border-white bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-onboarding-textPrimary">
                    {facilityName || "Hospital Name"}
                  </p>
                  <p className="text-xs text-onboarding-textSecondary mt-1">
                    {facilityType || "Private Facility"} • Est. {yearEstablished || "YYYY"}
                  </p>
                </div>
                <div className="flex h-10 min-w-[40px] items-center justify-center rounded-2xl bg-onboarding-primaryBlue/5 text-onboarding-primaryBlue text-xs font-semibold">
                  {facilityName ? facilityName.charAt(0) : "H"}
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-onboarding-textSecondary">
                {aboutHospital || "Your hospital's description will appear here, giving patients an overview of your specialties and care philosophy."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </HospitalOnboardingShell>
  );
}
