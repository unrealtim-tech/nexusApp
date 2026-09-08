import apiClient from "@/lib/apiClient";

/**
 * `GET /api/v1/workers/{id}` — ungated public clinician profile
 * (nexus-backend `WorkerPublicDetail`). Excludes contact / bank / earnings.
 */
export interface WorkerPublicDetail {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  role_title: string;
  license_number: string | null;
  rating: number;
  rating_count: number;
  acceptance_rate_pct: number | null;
  availability: string;
  is_verified: boolean;
  is_active: boolean;
  identity_verified: boolean;
  completed_shifts: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export async function getWorkerPublic(
  clinicianId: string,
): Promise<WorkerPublicDetail> {
  const res = await apiClient.get<WorkerPublicDetail>(
    `/api/v1/workers/${encodeURIComponent(clinicianId)}`,
  );
  return res.data;
}
