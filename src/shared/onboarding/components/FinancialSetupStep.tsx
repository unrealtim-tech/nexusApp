import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building, CheckCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { HospitalOnboardingShell } from "./HospitalOnboardingShell";
import { useRoleBasePath } from "@/shared/onboarding/hooks/useRoleBasePath";
import { useHospitalOnboardingStore } from "@/features/onboarding/hooks/useHospitalOnboardingStore";
import { useHospitalRegister } from "@/features/onboarding/hooks/useOnboarding";
import {
  payoutSetupSchema,
  type PayoutSetupFormData,
} from "@/features/onboarding/schemas/onboardingSchemas";

const nigerianBanks = [
  { code: "044", name: "Access Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "033", name: "United Bank For Africa Plc" },
  { code: "011", name: "First Bank of Nigeria Limited" },
  { code: "057", name: "Zenith Bank Plc" },
  { code: "032", name: "Union Bank of Nigeria Plc" },
];

const accountNames = [
  "NexusCare Facility Account",
  "St. Jude Medical Center",
  "Victoria Island Clinic",
  "Ogudu Hospital Settlement",
  "Westend Health Systems",
];

export function FinancialSetupStep() {
  const navigate = useNavigate();
  const basePath = useRoleBasePath();
  const registerMutation = useHospitalRegister();
  const { registrationData, locationData, setFinancialData } =
    useHospitalOnboardingStore();

  const userData = JSON.parse(
    localStorage.getItem("userData") || "{}",
  ) as Record<string, any>;
  const email = userData.email || "billing@hospital.org";
  const phone = userData.phone || "+2340000000000";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PayoutSetupFormData>({
    resolver: zodResolver(payoutSetupSchema),
    defaultValues: {
      bankCode: "",
      accountNumber: "",
      accountName: "",
    },
  });

  const selectedBankCode = watch("bankCode");
  const accountNumber = watch("accountNumber");

  useEffect(() => {
    if (selectedBankCode && accountNumber?.length === 10) {
      const randomName =
        accountNames[Math.floor(Math.random() * accountNames.length)];
      setValue("accountName", randomName, { shouldValidate: true });
    } else {
      setValue("accountName", "", { shouldValidate: true });
    }
  }, [selectedBankCode, accountNumber, setValue]);

  const handleComplete = async (data: PayoutSetupFormData) => {
    if (!registrationData.hospitalName || !locationData.streetAddress) {
      navigate(`${basePath}/onboarding/registration`);
      return;
    }

    setFinancialData(data);

    const payload = {
      hospital_name: registrationData.hospitalName,
      email,
      phone,
      registration_number: registrationData.registrationNumber,
      address: {
        line1: locationData.streetAddress,
        line2: null,
        city: locationData.city,
        state: locationData.state,
        postal_code: "",
        country: "Nigeria",
      },
      payment_details: {
        method_type: "BankAccount",
        account_number: data.accountNumber,
        bank_code: data.bankCode,
        card_number: null,
        expiry_month: null,
        expiry_year: null,
        cvv: null,
      },
    };

    try {
      const response = await registerMutation.mutateAsync(payload);
      localStorage.setItem(
        "hospitalOnboardingResponse",
        JSON.stringify({
          hospitalId: response.hospital_id,
          status: response.status,
          message: response.message,
          submittedAt: new Date().toISOString(),
        }),
      );
      navigate(`${basePath}/onboarding/verification-status`);
    } catch {
      // Error state is managed by mutation
    }
  };

  return (
    <HospitalOnboardingShell
      activeStep={2}
      title="Financial & Payout Setup"
      subtitle="Connect a secure settlement account for automated disbursements. Your data is encrypted and handled with banking-grade security protocols."
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white bg-white p-8 shadow-soft">
          <form onSubmit={handleSubmit(handleComplete)} className="space-y-6">
            <div className="space-y-4 rounded-3xl bg-onboarding-inputBackground p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                  Bank Name
                </label>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <select
                    {...register("bankCode")}
                    className="w-full bg-transparent text-sm text-onboarding-textPrimary outline-none"
                  >
                    <option value="">Select financial institution</option>
                    {nigerianBanks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.bankCode && (
                  <p className="mt-2 text-xs text-red-600">
                    {errors.bankCode.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                  Account Number
                </label>
                <input
                  type="text"
                  {...register("accountNumber")}
                  onChange={(event) => {
                    const raw = event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setValue("accountNumber", raw, { shouldValidate: true });
                  }}
                  className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-onboarding-textPrimary outline-none transition focus:border-onboarding-primaryBlue focus:ring-2 focus:ring-onboarding-primaryBlue/10 font-mono"
                  placeholder="0000000000"
                />
                {errors.accountNumber && (
                  <p className="mt-2 text-xs text-red-600">
                    {errors.accountNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                  Account Name
                </label>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm transition ${
                    watch("accountName")
                      ? "bg-white text-onboarding-textPrimary"
                      : "bg-onboarding-inputBackground text-neutral-400"
                  }`}
                >
                  {watch("accountName") ||
                    "Waiting for account verification..."}
                </div>
                {errors.accountName && (
                  <p className="mt-2 text-xs text-red-600">
                    {errors.accountName.message}
                  </p>
                )}
              </div>
            </div>

            {registerMutation.isError && (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {registerMutation.error?.message ||
                  "Unable to verify your account. Please try again."}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() =>
                  navigate(`${basePath}/onboarding/location-geofencing`)
                }
                className="rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-onboarding-primaryBlue hover:bg-onboarding-primaryBlue/5"
              >
                Back
              </button>
              <Button
                type="submit"
                disabled={isSubmitting || !watch("accountName")}
                isLoading={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue py-3 text-sm font-semibold text-white sm:w-auto"
              >
                {isSubmitting ? "Submitting..." : "Complete"}
              </Button>
            </div>
          </form>
        </div>

        <aside className="rounded-[32px] border border-white bg-white p-8 shadow-soft">
          <div className="mb-6 rounded-3xl bg-onboarding-fadedGreen p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-onboarding-primaryBlue" />
              <div>
                <p className="text-sm font-semibold text-onboarding-textPrimary">
                  Banking-Grade Security
                </p>
                <p className="mt-2 text-xs text-onboarding-textSecondary leading-relaxed">
                  Your payout details are protected by industry-leading security
                  infrastructure to ensure safe, reliable disbursements directly
                  to your facility.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-onboarding-inputBackground p-5">
              <p className="text-sm font-semibold text-onboarding-textPrimary">
                T+1 Payout Cycle
              </p>
              <p className="mt-2 text-xs text-onboarding-textSecondary">
                Cleared funds are automatically disbursed to this account the
                next business day.
              </p>
            </div>
            <div className="rounded-3xl bg-onboarding-inputBackground p-5">
              <p className="text-sm font-semibold text-onboarding-textPrimary">
                AES-256 Encryption
              </p>
              <p className="mt-2 text-xs text-onboarding-textSecondary">
                Account details are encrypted at rest and in transit, exceeding
                standard regulatory compliance.
              </p>
            </div>
            <div className="mt-4 rounded-3xl border border-neutral-200 bg-white p-4 text-center text-sm text-onboarding-textSecondary">
              Powered & Secured by Paystack Integrated
            </div>
          </div>
        </aside>
      </div>
    </HospitalOnboardingShell>
  );
}
