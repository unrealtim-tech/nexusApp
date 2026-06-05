import { post } from "@/shared/services/api";

export type BackendUserRole = "staff" | "hospital-admin" | "super-admin";

export interface AuthUserResponse {
  id: string;
  hospital_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: BackendUserRole;
  role_label?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  redirect_to: string;
  user: AuthUserResponse;
}

export interface RegisterRequest {
  hospital_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  password: string;
  role: "Staff" | "HospitalAdmin";
}

export async function sendLoginOtp(email: string): Promise<void> {
  await post<void>("/api/v1/auth/otp/send", { email });
}

export async function verifyLoginOtp(
  email: string,
  code: string,
): Promise<LoginResponse> {
  return post<LoginResponse>("/api/v1/auth/otp/verify", { email, code });
}

export async function registerUser(
  payload: RegisterRequest,
): Promise<AuthUserResponse> {
  return post<AuthUserResponse>("/api/v1/auth/register", payload);
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return post<LoginResponse>("/api/v1/auth/login", { email, password });
}
