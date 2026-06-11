import { post } from "@/shared/services/api";

export type ClinicianRole =
  | "Doctor"
  | "Nurse"
  | "LabTechnician"
  | "Pharmacist"
  | "Radiographer"
  | "Physiotherapist"
  | "Other";

export type ClinicalSpecialty =
  | "emergency-medicine"
  | "pediatrics"
  | "icu-specialist"
  | "general-nursing"
  | "pharmacy"
  | "lab-technician"
  | "surgery"
  | "radiology"
  | "anesthesiology"
  | "cardiology"
  | "obstetrics"
  | "psychiatry"
  | "other";

export interface ClinicianVerifyResponse {
  clinician_id: string;
  access_token: string;
  message: string;
}

export interface CompleteClinicianProfileRequest {
  first_name: string;
  last_name: string;
  role: ClinicianRole;
  license_number: string;
  specialty: ClinicalSpecialty;
}

export interface ClinicianProfileResponse {
  clinician_id: string;
  first_name: string;
  last_name: string;
  role: string;
  license_number: string;
  email: string;
}

export interface BankAccountRequest {
  account_number: string;
  bank_code: string;
}

export interface BankAccountResponse {
  account_name: string;
  account_number_masked: string;
  bank_code: string;
}

export interface HospitalRegistrationRequest {
  hospital_name: string;
  email: string;
  phone: string;
  registration_number: string;
  address: {
    line1: string;
    line2: string;     // backend expects string, send "" when absent
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  payment_details: {
    method_type: "bankaccount" | "card";
    account_number: string;
    bank_code: string;
    card_number: string;   // send "" for bank-account flow
    expiry_month: number;  // send 0 for bank-account flow
    expiry_year: number;   // send 0 for bank-account flow
    cvv: string;           // send "" for bank-account flow
  };
}

export interface HospitalRegistrationResponse {
  hospital_id: string;
  status: string;
  message: string;
  next_steps: string[];
}

export async function sendClinicianRegistrationOtp(
  email: string,
): Promise<void> {
  await post<void>("/api/v1/clinicians/otp/send", { email });
}

export async function verifyClinicianRegistrationOtp(
  email: string,
  otp: string,
): Promise<ClinicianVerifyResponse> {
  return post<ClinicianVerifyResponse>("/api/v1/clinicians/otp/verify", {
    email,
    otp,
  });
}

export async function completeClinicianProfile(
  clinicianId: string,
  payload: CompleteClinicianProfileRequest,
): Promise<ClinicianProfileResponse> {
  return post<ClinicianProfileResponse>(
    `/api/v1/clinicians/${clinicianId}/profile`,
    payload,
  );
}

export async function addClinicianBankAccount(
  clinicianId: string,
  payload: BankAccountRequest,
): Promise<BankAccountResponse> {
  return post<BankAccountResponse>(
    `/api/v1/clinicians/${clinicianId}/bank-account`,
    payload,
  );
}

export async function registerHospital(
  payload: HospitalRegistrationRequest,
): Promise<HospitalRegistrationResponse> {
  return post<HospitalRegistrationResponse>(
    "/api/v1/hospitals/register",
    payload,
  );
}
