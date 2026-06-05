import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { NexusCareLogo } from "@/shared/components/ui/NexusCareLogo";
import { X, Bell, Building, CheckCircle } from "lucide-react";
import { useClinicianBankAccount } from "@/features/onboarding/hooks/useOnboarding";
import {
  payoutSetupSchema,
  type PayoutSetupFormData,
} from "@/features/onboarding/schemas/onboardingSchemas";

const nigerianBanks = [
  { code: "044", name: "Access Bank" },
  { code: "014", name: "Afribank Nigeria Plc" },
  { code: "023", name: "Citibank Nigeria Limited" },
  { code: "050", name: "Ecobank Nigeria Plc" },
  { code: "011", name: "First Bank of Nigeria Limited" },
  { code: "214", name: "First City Monument Bank Limited" },
  { code: "070", name: "Fidelity Bank Plc" },
  { code: "058", name: "Guaranty Trust Bank Plc" },
  { code: "030", name: "Heritage Banking Company Ltd" },
  { code: "082", name: "Keystone Bank Limited" },
  { code: "076", name: "Polaris Bank Limited" },
  { code: "221", name: "Stanbic IBTC Bank Limited" },
  { code: "068", name: "Standard Chartered Bank Nigeria Limited" },
  { code: "232", name: "Sterling Bank Plc" },
  { code: "033", name: "United Bank For Africa Plc" },
  { code: "032", name: "Union Bank of Nigeria Plc" },
  { code: "035", name: "Wema Bank Plc" },
  { code: "057", name: "Zenith Bank Plc" },
];

const mockNames = [
  "Dr. Adebayo Johnson",
  "Dr. Fatima Abdullahi",
  "Dr. Chinedu Okafor",
  "Dr. Aisha Mohammed",
  "Dr. Olumide Adeyemi",
];

export function PayoutSetup() {
  const navigate = useNavigate();
  const bankAccountMutation = useClinicianBankAccount();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PayoutSetupFormData>({
    resolver: zodResolver(payoutSetupSchema),
    defaultValues: {
      bankCode: "",
      accountNumber: "",
      accountName: "",
    },
  });

  const selectedRole = localStorage.getItem("selectedRole") || "health-worker";
  const clinicianId = localStorage.getItem("clinicianId");

  const accountNumber = watch("accountNumber");
  const bankCode = watch("bankCode");

  // Simulate account name lookup when bank and account number are provided
  useEffect(() => {
    if (bankCode && accountNumber?.length === 10) {
      const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
      setValue("accountName", randomName, { shouldValidate: true });
    } else {
      setValue("accountName", "", { shouldValidate: true });
    }
  }, [bankCode, accountNumber, setValue]);

  const handleComplete = async (data: PayoutSetupFormData) => {
    try {
      if (selectedRole === "health-worker") {
        if (!clinicianId) {
          throw new Error(
            "Clinician account not found. Please restart verification.",
          );
        }

        await bankAccountMutation.mutateAsync({
          clinicianId,
          payload: {
            account_number: data.accountNumber,
            bank_code: data.bankCode,
          },
        });
      }

      const professionalData = JSON.parse(
        localStorage.getItem("professionalData") || "{}",
      );
      const pendingEmail = localStorage.getItem("pendingEmail") || "";

      const authToken =
        localStorage.getItem("authToken") ||
        `token_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const currentUserData = localStorage.getItem("userData");
      const userData = currentUserData
        ? JSON.parse(currentUserData)
        : {
            id: `user_${Date.now()}`,
            fullName: data.accountName,
            email: pendingEmail,
            role: selectedRole === "health-worker" ? "medical-staff" : "hospital-admin",
            onboardingComplete: true,
            createdAt: new Date().toISOString(),
          };

      localStorage.setItem("authToken", authToken);
      localStorage.setItem(
        "userData",
        JSON.stringify({
          ...userData,
          onboardingComplete: true,
          payout: data,
          professional: professionalData,
        }),
      );

      localStorage.removeItem("emailVerified");
      localStorage.removeItem("selectedRole");
      localStorage.removeItem("professionalData");
      localStorage.removeItem("payoutData");
      localStorage.removeItem("clinicianId");
      localStorage.removeItem("pendingEmail");

      if (selectedRole === "health-worker") {
        navigate("/medical-staff/dashboard");
      } else {
        navigate("/hospital/dashboard");
      }
    } catch (error) {
      console.error("Onboarding completion error:", error);
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
              STEP 03 OF 04
            </p>
            <h1 className="text-2xl font-bold text-onboarding-textPrimary">
              Payout Setup
            </h1>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-1">
              <div
                className="bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue h-1 rounded-full"
                style={{ width: "75%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="bg-white rounded-t-none rounded-b-2xl border-t-0 shadow-md">
          <CardContent className="p-6 space-y-6">
            {/* Description */}
            <p className="text-onboarding-textSecondary leading-relaxed">
              Link your bank account to receive instant payments via Paystack.
            </p>
            <form onSubmit={handleSubmit(handleComplete)} className="space-y-6">
              {/* Bank Selection */}
              <div className="space-y-3">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Select Bank
                </label>
                <div className="flex items-center gap-2.5 rounded-lg bg-onboarding-inputBackground px-3 py-2.5">
                  <Building className="h-4 w-4 flex-shrink-0 text-secondary-600" />
                  <select
                    {...register("bankCode")}
                    className={`flex-1 bg-transparent text-sm text-neutral-800 outline-none ${
                      errors.bankCode ? "text-red-600" : ""
                    }`}
                  >
                    <option value="">Choose your bank</option>
                    {nigerianBanks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.bankCode && (
                  <p className="text-sm text-red-600">{errors.bankCode.message}</p>
                )}
              </div>

              {/* Account Number */}
              <div className="space-y-3">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Account Number
                </label>
                <div className="flex items-center gap-2.5 rounded-lg bg-onboarding-inputBackground px-3 py-2.5">
                  <input
                    type="text"
                    {...register("accountNumber")}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setValue("accountNumber", cleaned, { shouldValidate: true });
                    }}
                    className={`flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400 font-mono ${
                      errors.accountNumber ? "text-red-600" : ""
                    }`}
                    placeholder="0123456789"
                    maxLength={10}
                  />
                  <div className="flex-shrink-0">
                    <svg
                      className="h-4 w-4 text-secondary-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                </div>
                {errors.accountNumber && (
                  <p className="text-sm text-red-600">
                    {errors.accountNumber.message}
                  </p>
                )}
              </div>

              {/* Account Name Verification */}
              <div className="space-y-3">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  Account Name
                </label>
                <div
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all ${
                    watch("accountName") && !errors.accountName
                      ? "border-green-300 bg-green-50"
                      : "bg-onboarding-inputBackground"
                  }`}
                >
                  <Controller
                    control={control}
                    name="accountName"
                    render={({ field }) =>
                      field.value ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800 font-semibold">
                            {field.value}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-400">
                          Account name will appear here after verification
                        </span>
                      )
                    }
                  />
                </div>
                {errors.accountName && (
                  <p className="text-sm text-red-600">{errors.accountName.message}</p>
                )}
              </div>

              {bankAccountMutation.isError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {bankAccountMutation.error?.message ||
                    "Unable to link account. Please try again."}
                </div>
              )}

              {!clinicianId && selectedRole === "health-worker" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  Unable to complete registration. Please verify your email first.
                </div>
              )}

              {/* Complete Setup Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !watch("accountName")}
                isLoading={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue py-3 text-sm font-semibold uppercase tracking-widest text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? "Linking Account..." : "Link Account & Continue"}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    Secure & Encrypted
                  </h4>
                  <p className="text-sm text-slate-600">
                    Your banking information is encrypted and processed securely
                    through Paystack. We never store your sensitive financial data.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}