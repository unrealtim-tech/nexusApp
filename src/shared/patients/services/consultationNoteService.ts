import apiClient from "@/lib/apiClient";

// Mirrors nexus-backend's src/models/consultation_note.rs response shapes.
// See src/handlers/consultation_notes.rs for the live routes:
//   POST   /api/v1/patients/{patientId}/consultation-notes
//   GET    /api/v1/patients/{patientId}/consultation-notes
//   GET    /api/v1/consultation-notes/{id}
//   GET    /api/v1/shifts/{shiftId}/patients/{patientId}/consultation-notes
//   POST   /api/v1/consultation-notes/{id}/audio-chunk
//   PATCH  /api/v1/consultation-notes/{id}
//   POST   /api/v1/consultation-notes/{id}/complete
//
// See nexus-backend/docs/FRONTEND_HANDOFF.md §2 for the fields added in this
// release: diagnosis, vitals, medications, follow_up_at, the 1-hour edit
// window, and amends_note_id for superseding a locked note.

export type ConsultationNoteStatus = "recording" | "completed" | "failed";

/** `vitals` is opaque JSON on the wire (serde_json::Value) — this is the
 * concrete shape this app writes and reads back. Replaces wholesale on PATCH,
 * not merged field by field. */
export interface ConsultationVitals {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate_bpm?: number;
  temperature_c?: number;
  spo2?: number;
}

/** `medications` is an opaque JSON array on the wire — this app's concrete
 * entry shape. Replaces wholesale on PATCH, not merged entry by entry. */
export interface ConsultationMedication {
  name: string;
  dose?: string;
  route?: string;
  frequency?: string;
}

export interface ConsultationNote {
  id: string;
  patient_id: string;
  hospital_id: string;
  recorded_by: string;
  shift_id: string | null;
  amends_note_id: string | null;
  status: ConsultationNoteStatus;
  full_transcript: string;
  language: string;
  duration_seconds: number;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  assessment: string | null;
  plan: string | null;
  diagnosis: string | null;
  vitals: ConsultationVitals | null;
  medications: ConsultationMedication[] | null;
  follow_up_at: string | null;
  /** One hour after creation; PATCH returns 409 past this. `null` means a
   * pre-release note — treat that as closed too, not "no limit". */
  editable_until: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/** Single source of truth for "can this note still be PATCHed" — `null`
 * (pre-release notes) counts as closed, same as an elapsed timestamp. */
export function isNoteEditable(note: Pick<ConsultationNote, "editable_until">): boolean {
  return note.editable_until != null && new Date(note.editable_until).getTime() > Date.now();
}

export interface ConsultationTranscriptSegment {
  id: string;
  consultation_note_id: string;
  sequence: number;
  audio_path: string;
  audio_duration_seconds: number | null;
  transcript_text: string;
  status: "completed" | "failed";
  last_error: string | null;
  created_at: string;
}

export interface ConsultationNoteDetail extends ConsultationNote {
  segments: ConsultationTranscriptSegment[];
}

export interface UpdateConsultationNoteRequest {
  chief_complaint?: string;
  history_of_present_illness?: string;
  assessment?: string;
  plan?: string;
  diagnosis?: string;
  /** Replaces the note's vitals wholesale — send the full object, not a diff. */
  vitals?: ConsultationVitals;
  /** Replaces the note's medications wholesale — send the full list, not a diff. */
  medications?: ConsultationMedication[];
  follow_up_at?: string;
}

export interface StartConsultationNoteRequest {
  /** Required for a health-worker caller — their token carries no
   * hospital_id, so omitting this 403s with NoHospital. When set, the caller
   * must be that shift's assigned clinician. */
  shift_id?: string;
  /** Set to supersede a locked (editable_until elapsed) note with a new one,
   * leaving the original byte-for-byte intact. */
  amends_note_id?: string;
}

export interface AudioChunkResponse {
  sequence: number;
  transcript_text: string;
  status: "completed" | "failed";
  full_transcript: string;
}

export class ConsultationNoteService {
  static async start(
    patientId: string,
    payload: StartConsultationNoteRequest = {},
  ): Promise<{ id: string }> {
    const res = await apiClient.post<{ id: string }>(
      `/api/v1/patients/${patientId}/consultation-notes`,
      payload,
    );
    return res.data;
  }

  static async listForPatient(patientId: string): Promise<ConsultationNote[]> {
    const res = await apiClient.get<ConsultationNote[]>(
      `/api/v1/patients/${patientId}/consultation-notes`,
    );
    return res.data;
  }

  static async listForShift(shiftId: string, patientId: string): Promise<ConsultationNote[]> {
    const res = await apiClient.get<ConsultationNote[]>(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/patients/${encodeURIComponent(patientId)}/consultation-notes`,
    );
    return res.data;
  }

  static async get(id: string): Promise<ConsultationNoteDetail> {
    const res = await apiClient.get<ConsultationNoteDetail>(`/api/v1/consultation-notes/${id}`);
    return res.data;
  }

  /** `sequence` is 0-indexed chunk order — the caller tracks it, not the server. */
  static async uploadAudioChunk(
    id: string,
    sequence: number,
    audioBlob: Blob,
    filename: string,
  ): Promise<AudioChunkResponse> {
    const form = new FormData();
    form.append("sequence", String(sequence));
    form.append("audio", audioBlob, filename);
    const res = await apiClient.post<AudioChunkResponse>(
      `/api/v1/consultation-notes/${id}/audio-chunk`,
      form,
      {
        // Let the browser set the multipart boundary itself — the instance's
        // default 'application/json' header would otherwise break the upload.
        headers: { "Content-Type": undefined },
        timeout: 60_000,
      },
    );
    return res.data;
  }

  static async update(
    id: string,
    fields: UpdateConsultationNoteRequest,
  ): Promise<ConsultationNote> {
    const res = await apiClient.patch<ConsultationNote>(
      `/api/v1/consultation-notes/${id}`,
      fields,
    );
    return res.data;
  }

  static async complete(id: string): Promise<ConsultationNote> {
    const res = await apiClient.post<ConsultationNote>(
      `/api/v1/consultation-notes/${id}/complete`,
    );
    return res.data;
  }
}
