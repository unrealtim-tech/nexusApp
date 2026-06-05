import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, ShieldCheck, Mail, Phone } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { HospitalOnboardingShell } from "./HospitalOnboardingShell";
import { useRoleBasePath } from "@/shared/onboarding/hooks/useRoleBasePath";
import { useHospitalOnboardingStore } from "@/features/onboarding/hooks/useHospitalOnboardingStore";

export function VerificationStatusStep() {
  const navigate = useNavigate();
  const basePath = useRoleBasePath();
  const { registrationData } = useHospitalOnboardingStore();

  const userData = JSON.parse(
    localStorage.getItem("userData") || "{}",
  ) as Record<string, any>;
  const response = JSON.parse(
    localStorage.getItem("hospitalOnboardingResponse") || "null",
  );
  const facilityName =
    registrationData.hospitalName || userData.fullName || "Your Facility";
  const bankSummary = JSON.parse(
    localStorage.getItem("hospitalOnboardingResponse") || "{}",
  ) as Record<string, string>;

  return (
    <HospitalOnboardingShell
      activeStep={3}
      title="Application Submitted Successfully"
      subtitle="Thank you for completing the registration process. Our compliance team is currently reviewing your application. You will be notified once the review is complete."
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[32px] border border-white bg-white p-8 shadow-soft">
          <div className="mb-8 rounded-[28px] bg-gradient-to-r from-onboarding-primaryBlue/10 via-white to-onboarding-primaryGreen/10 p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-onboarding-primaryBlue shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Pending Review
            </div>
            <h2 className="mt-6 text-3xl font-bold text-onboarding-textPrimary">
              Application Submitted Successfully
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-onboarding-textSecondary leading-relaxed">
              Thank you for completing the registration process. Our compliance
              team is currently reviewing your application. You will be notified
              once the review is complete.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-neutral-200 bg-onboarding-inputBackground p-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-onboarding-primaryBlue/10 text-onboarding-primaryBlue">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-onboarding-textPrimary">
                  Documents Submitted
                </p>
                <p className="mt-2 text-xs text-onboarding-textSecondary">
                  {new Date().toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-onboarding-primaryGreen/10 text-onboarding-primaryGreen">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-onboarding-textPrimary">
                  Compliance Screening
                </p>
                <p className="mt-2 text-xs text-onboarding-textSecondary">
                  Currently verifying medical licenses and facility credentials
                  against national registries.
                </p>
                <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-xs text-onboarding-textSecondary shadow-sm">
                  Estimated completion: 2-3 business days
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 opacity-60">
              <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-onboarding-textSecondary ring-1 ring-neutral-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-onboarding-textPrimary">
                  Final Approval
                </p>
                <p className="mt-2 text-xs text-onboarding-textSecondary">
                  Account activation and platform access granted once compliance
                  checks are complete.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6 rounded-[32px] border border-white bg-white p-6 shadow-soft">
          <div className="rounded-3xl bg-onboarding-inputBackground p-5">
            <p className="text-sm font-semibold text-onboarding-textPrimary">
              Need Assistance?
            </p>
            <p className="mt-2 text-xs text-onboarding-textSecondary">
              Our verification specialists are available to answer any questions
              about your application.
            </p>
            <div className="mt-4 space-y-2">
              <Button className="w-full rounded-2xl bg-white text-onboarding-primaryBlue ring-1 ring-onboarding-primaryBlue/15 py-3 text-sm font-semibold hover:bg-onboarding-primaryBlue/5">
                Live Chat Support
              </Button>
              <Button className="w-full rounded-2xl bg-onboarding-primaryBlue text-white py-3 text-sm font-semibold hover:bg-onboarding-primaryBlue/90">
                Email Support
              </Button>
            </div>
          </div>

          <div className="rounded-3xl bg-onboarding-fadedGreen p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
              Application Summary
            </p>
            <div className="mt-4 space-y-3 text-sm text-onboarding-textSecondary">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">
                  Facility
                </p>
                <p className="mt-1 text-onboarding-textPrimary">
                  {facilityName}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">
                  Administrator
                </p>
                <p className="mt-1 text-onboarding-textPrimary">
                  {userData.fullName || "Hospital Administrator"}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-500">
                  Bank Details
                </p>
                <p className="mt-1 text-onboarding-textPrimary">
                  {bankSummary.account_number_masked || "•••• •••• 4892"}
                </p>
                <p className="text-xs text-onboarding-textSecondary">
                  {bankSummary.bank_code
                    ? `Bank code ${bankSummary.bank_code}`
                    : "Verified settlement account"}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-[32px] border border-white bg-white p-6 shadow-soft">
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl py-3 text-sm font-semibold uppercase tracking-widest"
          onClick={() => navigate(`${basePath}/onboarding/financial-setup`)}
        >
          Back
        </Button>
        <Button
          type="button"
          className="rounded-2xl bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue py-3 text-sm font-semibold uppercase tracking-widest text-white"
          onClick={() => navigate(`${basePath}/dashboard`)}
        >
          Go to Dashboard
        </Button>
      </div>
    </HospitalOnboardingShell>
  );
}
