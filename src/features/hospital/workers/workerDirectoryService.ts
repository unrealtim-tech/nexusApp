import apiClient from "@/lib/apiClient";
import type {
  ApiShift,
  ApiShiftListResponse,
} from "@/features/hospital/shifts/types";
import { getWorkerPublic } from "./workerPublicService";

export type WorkerLicenseStatus = "verified" | "pending";

export type WorkerAvailability =
  | { kind: "available_now" }
  | { kind: "on_shift" }
  | { kind: "available_today" }
  | { kind: "available_at"; label: string };

export interface DirectoryWorker {
  id: string;
  name: string;
  /** Professional credential shown after the name, e.g. "RN", "MD", "LT". */
  credential: string;
  role: string;
  yearsExperience: number;
  distanceMi: number;
  rating: number;
  shiftsDone: number;
  license: WorkerLicenseStatus;
  availability: WorkerAvailability;
  nearby: boolean;
  recommended: boolean;
  bio: string;
  acceptanceRatePct: number;
  cancellationRatePct: number;
  certificates: string[];
  languages: string[];
  /** Past shifts with this hospital, newest first. */
  history: { shift: string; date: string }[];
}

export function availabilityDisplay(availability: WorkerAvailability): {
  label: string;
  className: string;
} {
  switch (availability.kind) {
    case "available_now":
      return { label: "Available now", className: "text-success-600" };
    case "on_shift":
      return { label: "On shift", className: "text-primary-600" };
    case "available_today":
      return { label: "Available Today", className: "text-success-600" };
    case "available_at":
      return { label: availability.label, className: "text-success-600" };
  }
}

function mapAvailability(raw: string): WorkerAvailability {
  const v = raw.toLowerCase();
  if (v.includes("shift") || v.includes("busy")) return { kind: "on_shift" };
  if (v.includes("now") || v === "available" || v.includes("online"))
    return { kind: "available_now" };
  return { kind: "available_today" };
}

/**
 * Worker directory for the hospital Workers page.
 *
 * There is no hospital-scoped workforce endpoint in nexus-backend, so the
 * directory is built from the hospital's own shifts: every clinician that has
 * been assigned (i.e. accepted an offer) is fetched from the ungated
 * `GET /api/v1/workers/{id}` profile. Fields the profile doesn't carry
 * (years of experience, certificates, languages, cancellation rate) are left
 * blank rather than fabricated; `history` is reconstructed from the shifts
 * this hospital ran with that clinician.
 */
export const WorkerDirectoryService = {
  async getWorkers(): Promise<DirectoryWorker[]> {
    let shifts: ApiShift[] = [];
    try {
      const res = await apiClient.get<ApiShiftListResponse>("/api/v1/shifts", {
        params: { page: 1, page_size: 100 },
      });
      shifts = res.data.shifts;
    } catch {
      return [];
    }

    const byClinician = new Map<string, ApiShift[]>();
    for (const s of shifts) {
      if (!s.assigned_clinician_id) continue;
      const list = byClinician.get(s.assigned_clinician_id) ?? [];
      list.push(s);
      byClinician.set(s.assigned_clinician_id, list);
    }

    const results = await Promise.allSettled(
      [...byClinician.keys()].map((id) => getWorkerPublic(id)),
    );

    return results.flatMap((r) => {
      if (r.status !== "fulfilled") return [];
      const w = r.value;
      const theirShifts = (byClinician.get(w.id) ?? []).sort(
        (a, b) =>
          new Date(b.scheduled_start).getTime() -
          new Date(a.scheduled_start).getTime(),
      );
      return [
        {
          id: w.id,
          name: `${w.first_name} ${w.last_name}`.trim(),
          credential: w.role_title,
          role: w.role_title,
          yearsExperience: 0,
          distanceMi: 0,
          rating: Number(w.rating.toFixed(1)),
          shiftsDone: Number(w.completed_shifts),
          license: w.is_verified ? "verified" : "pending",
          availability: mapAvailability(w.availability),
          nearby: false,
          recommended: w.is_verified && w.rating >= 4.5,
          bio: "",
          acceptanceRatePct: Math.round(w.acceptance_rate_pct ?? 0),
          cancellationRatePct: 0,
          certificates: w.specialty ? [w.specialty] : [],
          languages: [],
          history: theirShifts.map((s) => ({
            shift: s.shift_label ?? s.role_title,
            date: new Date(s.scheduled_start).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          })),
        } satisfies DirectoryWorker,
      ];
    });
  },

  async getNearbyAvailable(_limit = 3): Promise<DirectoryWorker[]> {
    return [];
  },

  /** Headline count for the dashboard "Worker Availability" stat. */
  async getAvailableCount(): Promise<number | null> {
    return null;
  },
};

// API endpoint documentation for the backend team:
/*
GET /api/v1/hospitals/:id/workforce?radius_km=25
Response: Array<{
  id, name, credential, role, years_experience, distance_km,
  rating, shifts_done, license_status: "verified" | "pending",
  availability: { kind, label? }, bio, acceptance_rate_pct,
  cancellation_rate_pct, certificates: string[], languages: string[],
  history: Array<{ shift: string, date: string }>
}>
*/
