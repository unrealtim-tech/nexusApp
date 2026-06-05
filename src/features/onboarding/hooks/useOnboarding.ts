import { useMutation } from "@tanstack/react-query";
import {
  registerHospital,
  completeClinicianProfile,
  addClinicianBankAccount,
} from "@/features/onboarding/services/onboardingApi";
import type {
  HospitalRegistrationRequest,
  HospitalRegistrationResponse,
  CompleteClinicianProfileRequest,
  ClinicianProfileResponse,
  BankAccountRequest,
  BankAccountResponse,
} from "@/features/onboarding/services/onboardingApi";

// ─── Hospital Registration Mutation ─────────────────────────────────────
export function useHospitalRegister() {
  return useMutation<
    HospitalRegistrationResponse,
    Error,
    HospitalRegistrationRequest
  >({
    mutationFn: registerHospital,
  });
}

// ─── Clinician Profile Mutation ─────────────────────────────────────────
interface ClinicianProfileParams {
  clinicianId: string;
  payload: CompleteClinicianProfileRequest;
}

export function useClinicianProfile() {
  return useMutation<ClinicianProfileResponse, Error, ClinicianProfileParams>({
    mutationFn: ({ clinicianId, payload }) =>
      completeClinicianProfile(clinicianId, payload),
  });
}

// ─── Clinician Bank Account Mutation ────────────────────────────────────
interface BankAccountParams {
  clinicianId: string;
  payload: BankAccountRequest;
}

export function useClinicianBankAccount() {
  return useMutation<BankAccountResponse, Error, BankAccountParams>({
    mutationFn: ({ clinicianId, payload }) =>
      addClinicianBankAccount(clinicianId, payload),
  });
}
