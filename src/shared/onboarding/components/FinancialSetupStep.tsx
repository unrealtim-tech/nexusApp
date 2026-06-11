import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ShieldCheck,
  Zap,
  Lock,
  ChevronDown,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { HospitalOnboardingShell } from "./HospitalOnboardingShell";
import { useRoleBasePath } from "@/shared/onboarding/hooks/useRoleBasePath";
import { useHospitalOnboardingStore } from "@/features/onboarding/hooks/useHospitalOnboardingStore";
import { useHospitalRegister } from "@/features/onboarding/hooks/useOnboarding";
import {
  useNigerianBanks,
  useResolveAccount,
} from "@/features/onboarding/hooks/usePaystack";
import {
  payoutSetupSchema,
  type PayoutSetupFormData,
} from "@/features/onboarding/schemas/onboardingSchemas";

const DEBOUNCE_MS = 600;

export function FinancialSetupStep() {
  const navigate = useNavigate();
  const basePath = useRoleBasePath();
  const registerMutation = useHospitalRegister();
  const { registrationData, locationData, setFinancialData, setSubmissionResponse } =
    useHospitalOnboardingStore();

  // ── Bank search combobox state ────────────────────────────────────────
  const [bankSearch, setBankSearch] = useState("");
  const [isBankOpen, setIsBankOpen] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // Close bank dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        bankDropdownRef.current &&
        !bankDropdownRef.current.contains(e.target as Node)
      ) {
        setIsBankOpen(false);
        setBankSearch("");
      }
    }
    if (isBankOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isBankOpen]);

  const email = registrationData.email;
  const userData = JSON.parse(
    localStorage.getItem("userData") || "{}",
  ) as Record<string, unknown>;
  const phone = (userData.phone as string) || "+2340000000000";

  // ── Bank list + fallback flag ─────────────────────────────────────────
  const { banks, isFallback, isLoading: banksLoading } = useNigerianBanks();

  // ── Account resolution mutation (only used when NOT in fallback) ──────
  const {
    mutateAsync: resolveAccount,
    isPending: isResolving,
    isSuccess: isResolved,
    isError: isResolutionError,
    error: resolutionError,
    reset: resetResolution,
  } = useResolveAccount();

  // ── Form ──────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PayoutSetupFormData>({
    resolver: zodResolver(payoutSetupSchema),
    defaultValues: { bankCode: "", accountNumber: "", accountName: "" },
  });

  const selectedBankCode = watch("bankCode");
  const accountNumber = watch("accountNumber");
  const accountName = watch("accountName");

  // ── Auto-resolution logic ─────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset on any input change
    if (accountName) setValue("accountName", "", { shouldValidate: false });
    resetResolution();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!selectedBankCode || accountNumber?.length !== 10) return;

    if (isFallback) {
      // ── Fallback mode: use hospital name as account name immediately ──
      const hospitalName = registrationData.hospitalName?.trim();
      if (hospitalName) {
        setValue("accountName", hospitalName, { shouldValidate: true });
      }
      return;
    }

    // ── Live mode: debounced Paystack resolution ──────────────────────
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await resolveAccount({
          accountNumber,
          bankCode: selectedBankCode,
        });
        setValue("accountName", result.account_name, { shouldValidate: true });
      } catch {
        // Resolution failed — silently fall back to hospital name
        const hospitalName = registrationData.hospitalName?.trim();
        if (hospitalName) {
          setValue("accountName", hospitalName, { shouldValidate: true });
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBankCode, accountNumber, isFallback]);

  // ── Submit — builds exact backend payload ─────────────────────────────
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
        line2: "",          // backend expects string
        city: locationData.city,
        state: locationData.state,
        postal_code: registrationData.postalCode ?? "",
        country: "Nigeria",
      },
      payment_details: {
        method_type: "card" as const,
        account_number: data.accountNumber,
        bank_code: data.bankCode,
        card_number: "",    // not used for bank-account flow
        expiry_month: 0,    // not used for bank-account flow
        expiry_year: 0,     // not used for bank-account flow
        cvv: "",            // not used for bank-account flow
      },
    };

    try {
      const response = await registerMutation.mutateAsync(payload);
      setSubmissionResponse({
        hospitalId: response.hospital_id,
        status: response.status,
        message: response.message,
        submittedAt: new Date().toISOString(),
      });
      navigate(`${basePath}/onboarding/verification-status`);
    } catch {
      // error managed by mutation
    }
  };

  // ── Derived UI state ──────────────────────────────────────────────────
  const showSpinner = !isFallback && isResolving;
  // showVerified: account name is set — either live verified, fallback, or silent error fallback
  const showVerified = !!accountName;
  // showError is never shown — resolution errors fall back to hospital name silently
  const showError = false;
  // isUnverified: account name came from fallback (bank list OR resolution error)
  const isUnverified = isFallback || (isResolutionError && !!accountName);
  const canSubmit = !isSubmitting && !!accountName && !isResolving;

  return (
    <HospitalOnboardingShell
      activeStep={2}
      title="Financial & Payout Setup"
      subtitle="Connect a secure settlement account for automated disbursements. Your data is encrypted and handled with banking-grade security protocols."
    >
      <form onSubmit={handleSubmit(handleComplete)}>
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">

          {/* ── Left card: Settlement Account ───────────────────────── */}
          <div className="flex flex-col rounded-[28px] border border-white bg-white p-6 shadow-soft">

            {/* Card header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-bold text-onboarding-textPrimary">
                Settlement Account
              </h2>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
                <Lock className="h-3 w-3" />
                Secure Link
              </span>
            </div>

            {/* Fallback notice */}
            {isFallback && !banksLoading && (
              <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <p className="text-xs leading-relaxed text-amber-700">
                  Live bank verification is unavailable. Your hospital name will
                  be used as the account name. You can update this later.
                </p>
              </div>
            )}

            <div className="flex-1 space-y-5">

              {/* Bank Name — searchable combobox */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-onboarding-textSecondary">
                  Bank Name
                </label>
                <div className="relative" ref={bankDropdownRef}>
                  {/* Trigger button */}
                  <button
                    type="button"
                    disabled={banksLoading}
                    onClick={() => setIsBankOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-onboarding-inputBackground px-4 py-3 text-sm outline-none transition focus:border-onboarding-primaryBlue focus:ring-2 focus:ring-onboarding-primaryBlue/10 disabled:opacity-60"
                  >
                    <span
                      className={
                        selectedBankCode
                          ? "text-onboarding-textPrimary"
                          : "text-neutral-400"
                      }
                    >
                      {banksLoading
                        ? "Loading banks…"
                        : selectedBankCode
                          ? (banks.find((b) => b.code === selectedBankCode)?.name ?? "Select financial institution")
                          : "Select financial institution"}
                    </span>
                    {banksLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-onboarding-primaryBlue" />
                    ) : (
                      <ChevronDown
                        className={`h-4 w-4 text-neutral-400 transition-transform ${isBankOpen ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>

                  {/* Dropdown panel */}
                  {isBankOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
                      {/* Search input */}
                      <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2.5">
                        <Search className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                        <input
                          type="text"
                          autoFocus
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          placeholder="Search by name or code…"
                          className="flex-1 bg-transparent text-sm text-onboarding-textPrimary outline-none placeholder:text-neutral-400"
                        />
                        {bankSearch && (
                          <button
                            type="button"
                            onClick={() => setBankSearch("")}
                            className="text-neutral-400 hover:text-neutral-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Options list */}
                      <ul className="max-h-52 overflow-y-auto py-1">
                        {banks
                          .filter((b) => {
                            const q = bankSearch.toLowerCase();
                            return (
                              b.name.toLowerCase().includes(q) ||
                              b.code.toLowerCase().includes(q)
                            );
                          })
                          .map((bank) => (
                            <li key={bank.code}>
                              <button
                                type="button"
                                onClick={() => {
                                  setValue("bankCode", bank.code, {
                                    shouldValidate: true,
                                  });
                                  setIsBankOpen(false);
                                  setBankSearch("");
                                }}
                                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-onboarding-fadedGreen ${
                                  selectedBankCode === bank.code
                                    ? "bg-onboarding-fadedGreen font-semibold text-onboarding-primaryBlue"
                                    : "text-onboarding-textPrimary"
                                }`}
                              >
                                <span>{bank.name}</span>
                                <span className="ml-3 font-mono text-[11px] text-neutral-400">
                                  {bank.code}
                                </span>
                              </button>
                            </li>
                          ))}
                        {banks.filter((b) => {
                          const q = bankSearch.toLowerCase();
                          return (
                            b.name.toLowerCase().includes(q) ||
                            b.code.toLowerCase().includes(q)
                          );
                        }).length === 0 && (
                          <li className="px-4 py-3 text-sm text-neutral-400">
                            No banks match "{bankSearch}"
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                {errors.bankCode && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.bankCode.message}
                  </p>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-onboarding-textSecondary">
                  Account Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    {...register("accountNumber")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setValue("accountNumber", raw, { shouldValidate: true });
                    }}
                    className="w-full rounded-2xl border border-neutral-200 bg-onboarding-inputBackground px-4 py-3 pr-12 font-mono text-sm text-onboarding-textPrimary outline-none transition placeholder:tracking-widest focus:border-onboarding-primaryBlue focus:ring-2 focus:ring-onboarding-primaryBlue/10"
                    placeholder="0000000000"
                    maxLength={10}
                  />
                  {/* Digit counter */}
                  {(accountNumber?.length ?? 0) > 0 &&
                    (accountNumber?.length ?? 0) < 10 && (
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-medium text-neutral-400">
                        {accountNumber?.length}/10
                      </span>
                    )}
                  {showSpinner && (
                    <RefreshCw className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-onboarding-primaryBlue" />
                  )}
                  {showVerified && (
                    <CheckCircle2 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  )}
                  {showError && (
                    <AlertCircle className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                  )}
                </div>
                {errors.accountNumber && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.accountNumber.message}
                  </p>
                )}
              </div>

              {/* Account Name */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-onboarding-textSecondary">
                    Account Name
                  </label>
                  {showSpinner && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-onboarding-primaryBlue">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Auto-resolving…
                    </span>
                  )}
                  {showVerified && !isUnverified && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                  {showVerified && isUnverified && (
                    <span className="text-[11px] text-amber-600">
                      Unverified
                    </span>
                  )}
                </div>

                <div
                  className={`rounded-2xl border px-4 py-3 text-sm transition-all duration-200 ${showVerified && !isUnverified
                    ? "border-emerald-200 bg-emerald-50 font-semibold text-onboarding-textPrimary"
                    : showVerified && isUnverified
                      ? "border-amber-200 bg-amber-50 font-medium text-onboarding-textPrimary"
                      : showError
                        ? "border-red-200 bg-red-50 text-red-600"
                        : showSpinner
                          ? "border-onboarding-primaryBlue/30 bg-onboarding-inputBackground text-onboarding-textSecondary"
                          : "border-neutral-200 bg-onboarding-inputBackground text-neutral-400"
                    }`}
                >
                  {showVerified
                    ? accountName
                    : showError
                      ? (resolutionError as Error)?.message ||
                      "Could not verify account"
                      : showSpinner
                        ? "Verifying with Paystack…"
                        : "Waiting for account verification…"}
                </div>
              </div>
            </div>

            {/* Register error */}
            {registerMutation.isError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {registerMutation.error?.message ||
                  "Unable to complete registration. Please try again."}
              </div>
            )}

            {/* Buttons */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(`${basePath}/onboarding/location-geofencing`)
                }
                className="rounded-2xl bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600 active:bg-red-700"
              >
                Back
              </button>
              <Button
                type="submit"
                disabled={!canSubmit}
                isLoading={isSubmitting}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue px-8 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  "Submitting…"
                ) : (
                  <>
                    Complete
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ── Right card: Banking-Grade Security ──────────────────── */}
          <aside className="flex flex-col rounded-[28px] border border-white bg-white p-6 shadow-soft">

            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-onboarding-fadedGreen p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-onboarding-primaryBlue text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-onboarding-textPrimary">
                  Banking-Grade Security
                </p>
                <p className="mt-1 text-xs leading-relaxed text-onboarding-textSecondary">
                  Your financial data is protected by industry-leading security
                  infrastructure to ensure safe, reliable payouts directly to
                  your facility.
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-onboarding-inputBackground p-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-onboarding-textPrimary">
                    T+1 Payout Cycle
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-onboarding-textSecondary">
                    Cleared funds are automatically disbursed to this account
                    the next business day.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-onboarding-inputBackground p-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-onboarding-primaryBlue text-white">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-onboarding-textPrimary">
                    AES-256 Encryption
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-onboarding-textSecondary">
                    Account details are encrypted at rest and in transit,
                    exceeding standard regulatory compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* Paystack footer */}
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#0BA4DB] text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M20.937 8.22H3.063A3.063 3.063 0 0 0 0 11.283v1.454A3.063 3.063 0 0 0 3.063 15.8h17.874A3.063 3.063 0 0 0 24 12.737v-1.454A3.063 3.063 0 0 0 20.937 8.22z" />
                  <path opacity="0.5" d="M20.937 3H3.063A3.063 3.063 0 0 0 0 6.063v1.454A3.063 3.063 0 0 0 3.063 10.58h17.874A3.063 3.063 0 0 0 24 7.517V6.063A3.063 3.063 0 0 0 20.937 3z" />
                  <path opacity="0.25" d="M20.937 13.42H3.063A3.063 3.063 0 0 0 0 16.483v1.454A3.063 3.063 0 0 0 3.063 21h17.874A3.063 3.063 0 0 0 24 17.937v-1.454A3.063 3.063 0 0 0 20.937 13.42z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  Powered &amp; Secured By
                </p>
                <p className="text-sm font-bold text-[#0BA4DB]">
                  Paystack Integrated
                </p>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </HospitalOnboardingShell>
  );
}
