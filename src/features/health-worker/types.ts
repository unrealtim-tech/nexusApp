import type { PredictionResponse } from "@/shared/patients/services/patientService";
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
  reportNotes?: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    assessment: string;
    clinicalPlan: string;
    prescriptions: string;
  };
}

