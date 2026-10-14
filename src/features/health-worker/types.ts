import type { PredictionResponse } from "@/shared/patients/services/patientService";
import type {
  ConsultationVitals,
  ConsultationMedication,
} from "@/shared/patients/services/consultationNoteService";
import type { QueueEntryState } from "@/features/virtual-call/virtualCallService";

/**
 * A patient record captured during the current shift session.
 */
export interface PatientRecord {
  id: string;
  backendPatientId?: string;
  /** Set when this record is sourced from a virtual shift's consult queue —
   * the entry_id is required to call/mark-seen/remove it. Absent for
   * in-person shifts, which have no backend queue to attach to. */
  queueEntryId?: string;
  queueState?: QueueEntryState;
  name: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  severityLevel?: string;
  existingConditions?: string;
  vitals: {
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    temperatureC: number;
    heartRateBpm: number;
  };
  intakeAt: string;
  status: "waiting" | "in-consultation" | "seen";
  prediction?: PredictionResponse | null;
  /** Mirrors the real consultation-note fields once Clinical Review saves it
   * to the backend (see consultationNoteService.ts) — `noteId` is set once
   * the note exists there. */
  reportNotes?: {
    noteId?: string;
    chiefComplaint: string;
    historyOfPresentIllness: string;
    assessment: string;
    clinicalPlan: string;
    diagnosis: string;
    vitals: ConsultationVitals;
    medications: ConsultationMedication[];
    followUpAt: string;
  };
}

