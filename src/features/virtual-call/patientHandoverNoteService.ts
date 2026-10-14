import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";

// Mirrors nexus-backend's per-patient handover note (new — see
// nexus-backend/docs/FRONTEND_HANDOFF.md §3). Distinct from the existing
// shift-level handover (src/features/hospital/handover/) — this is one note
// per (shift, patient), not one per shift.
//   PUT /api/v1/shifts/{shiftId}/patients/{patientId}/handover-note
//   GET /api/v1/shifts/{shiftId}/patients/{patientId}/handover-note
//
// Writable by the hospital admin or the shift's assigned clinician only.
// Idempotent on (shift, patient) within a 1-hour window — resubmitting
// updates it, not a second row; past the window, 409. Author comes from the
// auth token, never the request body. A 404 on GET is a normal "nobody's
// filed one yet" state, not an error.

export interface PatientHandoverNoteRequest {
  summary: string;
  outstanding_tasks?: string[];
  medications_given?: string[];
  escalation_required?: boolean;
  /** Required (422 if blank) when escalation_required is true. */
  escalation_reason?: string;
}

export interface PatientHandoverNote {
  id: string;
  shift_id: string;
  patient_id: string;
  author_user_id: string;
  author_name: string | null;
  summary: string;
  outstanding_tasks: string[];
  medications_given: string[];
  escalation_required: boolean;
  escalation_reason: string | null;
  submitted_at: string;
  editable: boolean;
  editable_until: string;
}

export const PatientHandoverNoteService = {
  /** `null` on a 404 — nobody has filed a note for this patient yet. */
  async get(shiftId: string, patientId: string): Promise<PatientHandoverNote | null> {
    try {
      const res = await apiClient.get<PatientHandoverNote>(
        `/api/v1/shifts/${encodeURIComponent(shiftId)}/patients/${encodeURIComponent(patientId)}/handover-note`,
      );
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  async save(
    shiftId: string,
    patientId: string,
    payload: PatientHandoverNoteRequest,
  ): Promise<PatientHandoverNote> {
    const res = await apiClient.put<PatientHandoverNote>(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/patients/${encodeURIComponent(patientId)}/handover-note`,
      payload,
    );
    return res.data;
  },
};
