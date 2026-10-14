import apiClient from "@/lib/apiClient";

// GET /api/v1/shifts/{shiftId}/patient-records — nexus-backend/docs/FRONTEND_HANDOFF.md §4.
// Every patient the shift produced a record for, with their clinical notes
// and handover note. Keeps working after the shift completes — that's the
// point of it, so don't gate this screen on shift status.
//
// `metadata_only: true` for platform-admin viewers (SuperAdmin/OperationsAdmin):
// counts are still real, but `patients` is always [].

export interface PatientRecordClinicalNote {
  id: string;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  assessment: string | null;
  plan: string | null;
  diagnosis: string | null;
  vitals: Record<string, unknown> | null;
  medications: unknown[] | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientRecordHandoverNote {
  id: string;
  author_name: string | null;
  summary: string;
  outstanding_tasks: string[];
  medications_given: string[];
  escalation_required: boolean;
  escalation_reason: string | null;
  submitted_at: string;
}

export interface PatientRecordView {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  /** Null when the patient has a clinical record but was never queued for
   * this shift's consult (the clinical record outlives the queue entry). */
  queue_state: string | null;
  clinical_notes: PatientRecordClinicalNote[];
  handover_note: PatientRecordHandoverNote | null;
}

export interface ShiftPatientRecordsView {
  shift_id: string;
  shift_status: string;
  shift_ended_at: string | null;
  patients_total: number;
  patients_seen: number;
  patients: PatientRecordView[];
  metadata_only: boolean;
}

export const PatientRecordsService = {
  async getForShift(shiftId: string): Promise<ShiftPatientRecordsView> {
    const res = await apiClient.get<ShiftPatientRecordsView>(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/patient-records`,
    );
    return res.data;
  },
};
