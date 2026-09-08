import apiClient from "@/lib/apiClient";

/** Shape of `GET /api/v1/hospitals/{id}/location` (nexus-backend HospitalLocationResponse). */
export interface HospitalLocation {
  hospital_id: string;
  latitude: number | null;
  longitude: number | null;
  place_label: string | null;
  clock_in_radius_meters: number | null;
  location_confirmed: boolean | null;
}

/**
 * Fetch a hospital's coordinates + geofence. The endpoint is unauthenticated,
 * so both the hospital and the worker app can call it. Returns `null` when the
 * hospital has no confirmed location (404).
 */
export async function fetchHospitalLocation(
  hospitalId: string,
): Promise<HospitalLocation | null> {
  try {
    const res = await apiClient.get<HospitalLocation>(
      `/api/v1/hospitals/${encodeURIComponent(hospitalId)}/location`,
    );
    return res.data;
  } catch {
    return null;
  }
}
