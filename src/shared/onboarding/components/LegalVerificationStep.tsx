import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCheck, FilePlus2, UploadCloud } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { useRoleBasePath } from "@/shared/onboarding/hooks/useRoleBasePath";
import { OnboardingNavbar } from "./OnboardingNavbar";
import { StepTracker } from "@/shared/components/ui/StepTracker";
import { useHospitalOnboardingStore } from "@/features/onboarding/hooks/useHospitalOnboardingStore";
import {
  legalVerificationSchema,
  type LegalVerificationFormData,
} from "@/features/onboarding/schemas/onboardingSchemas";

export function LegalVerificationStep() {
  const navigate = useNavigate();
  const basePath = useRoleBasePath();
  const { legalVerificationData, registrationData, setLegalVerificationData } =
    useHospitalOnboardingStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LegalVerificationFormData>({
    resolver: zodResolver(legalVerificationSchema),
    defaultValues: {
      operationalFileName: legalVerificationData.operationalFileName || "",
      medicalCertificateFileName:
        legalVerificationData.medicalCertificateFileName || "",
      taxCertificateFileName:
        legalVerificationData.taxCertificateFileName || "",
      registrationNumber:
        legalVerificationData.registrationNumber || registrationData.registrationNumber || "",
      expiryDate: legalVerificationData.expiryDate || "",
      issuingAuthority:
        legalVerificationData.issuingAuthority || "Ministry of Health (Federal)",
    },
  });

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setValue("operationalFileName", file.name);
  }

  const onSubmit: SubmitHandler<LegalVerificationFormData> = (data) => {
    setLegalVerificationData(data);
    navigate(`${basePath}/onboarding/onboarding-status`);
  };

  return (
    <div className="min-h-screen bg-[#F3FAFF]">
      <OnboardingNavbar />

      <div className="mx-auto max-w-4xl px-4 pb-8 pt-8">
        <div className="rounded-2xl bg-white px-8 py-10 shadow-md">
          <h1 className="mb-1 text-2xl font-bold text-onboarding-textPrimary">
            Legal Verification
          </h1>
          <p className="mb-5 max-w-xl text-sm text-onboarding-textSecondary">
            Please provide high-resolution copies of your institution's
            operational credentials. These documents are required for
            institutional accreditation on the NexusCare platform.
          </p>

          <StepTracker activeIndex={1} />

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Top row: Operational License + Compliance Check */}
            <div className="mb-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-onboarding-textPrimary">
                      Operational License
                    </h2>
                    <p className="text-xs text-onboarding-textSecondary">
                      Valid hospital registration from the Ministry of Health
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary-700 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    REQUIRED
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setValue("operationalFileName", file.name);
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fileInputRef.current?.click()
                  }
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`w-full cursor-pointer rounded-lg border border-dashed py-8 text-center transition-colors ${
                    isDragging
                      ? "border-secondary-500 bg-secondary-50"
                      : "border-neutral-300 bg-neutral-50 hover:border-secondary-400 hover:bg-secondary-50/40"
                  }`}
                >
                  <UploadCloud
                    className={`mx-auto mb-2 h-7 w-7 ${isDragging ? "text-secondary-500" : "text-secondary-600"}`}
                  />
                  <p className="text-sm font-semibold text-secondary-700">
                    {errors.operationalFileName
                      ? "Please upload a file"
                      : isDragging
                        ? "Drop file here"
                        : "Click to upload or drag and drop"}
                  </p>
                  {!errors.operationalFileName && (
                    <p className="text-xs text-neutral-500">
                      PDF, PNG, or JPG (Max 10MB)
                    </p>
                  )}
                </div>
                {errors.operationalFileName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.operationalFileName.message}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-secondary-800 p-5 text-white">
                <CheckCheck className="mb-3 h-7 w-7 text-secondary-200" />
                <h3 className="mb-2 text-lg font-semibold">Compliance Check</h3>
                <p className="text-sm leading-relaxed text-secondary-100">
                  Our legal team reviews all documents within 24-48 business
                  hours. Ensure all seals and signatures are clearly visible.
                </p>
              </div>
            </div>

            {/* Bottom row: Medical Certificate + Tax Compliance */}
            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-dashed border-neutral-300 p-5">
                <h3 className="mb-0.5 text-sm font-semibold text-onboarding-textPrimary">
                  Medical Certificate of Standards
                </h3>
                <p className="mb-4 text-xs text-onboarding-textSecondary">
                  Certification of clinical quality and safety protocols
                </p>
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="flex items-center gap-2 text-sm font-semibold text-secondary-700 hover:text-secondary-900"
                >
                  <FilePlus2 className="h-4 w-4" />
                  Add certification
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setValue("medicalCertificateFileName", file.name);
                  }}
                />
              </div>

              <div className="rounded-xl border border-dashed border-neutral-300 p-5">
                <h3 className="mb-0.5 text-sm font-semibold text-onboarding-textPrimary">
                  Tax Compliance Certificate
                </h3>
                <p className="mb-4 text-xs text-onboarding-textSecondary">
                  Proof of current tax status and commercial standing
                </p>
                <div
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-secondary-100 bg-secondary-50 px-3 py-2"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  <UploadCloud className="h-4 w-4 text-secondary-600" />
                  <div>
                    <p className="text-sm font-semibold text-secondary-700">
                      Upload TCC Document
                    </p>
                    <p className="text-[11px] text-onboarding-textSecondary">
                      Must be valid for the current fiscal year
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setValue("taxCertificateFileName", file.name);
                  }}
                />
              </div>
            </div>

            {/* Registration details row */}
            <div className="mb-8 rounded-xl bg-onboarding-inputBackground p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    {...register("registrationNumber")}
                    className="w-full rounded-lg bg-white/70 px-3 py-2.5 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
                    placeholder="HOSP-XXXX-X"
                  />
                  {errors.registrationNumber && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.registrationNumber.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    {...register("expiryDate")}
                    className={`w-full rounded-lg bg-white/70 px-3 py-2.5 text-sm text-neutral-800 outline-none ${errors.expiryDate ? "ring-1 ring-red-400" : ""}`}
                  />
                  {errors.expiryDate && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.expiryDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                    Issuing Authority
                  </label>
                  <select
                    {...register("issuingAuthority")}
                    className="w-full rounded-lg bg-white/70 px-3 py-2.5 text-sm text-neutral-800 outline-none"
                  >
                    <option>Ministry of Health (Federal)</option>
                    <option>Ministry of Health (State)</option>
                    <option>NAFDAC</option>
                    <option>NMA</option>
                  </select>
                  {errors.issuingAuthority && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.issuingAuthority.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(`${basePath}/onboarding/registration`)}
                className="flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Identity
              </button>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSubmitting}
                  className="rounded-lg py-3 text-sm font-semibold uppercase tracking-widest"
                >
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  className="rounded-lg bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue py-3 text-sm font-semibold uppercase tracking-widest"
                >
                  {isSubmitting ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}