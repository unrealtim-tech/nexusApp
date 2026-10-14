import apiClient from "@/lib/apiClient";
import type { NewPatientRequest } from "@/shared/patients/services/patientService";
import type { ConsultWaitingRoomView } from "./virtualCallService";

// Mirrors nexus-backend's consult-queue handlers (see
// nexus-backend/docs/FRONTEND_HANDOFF.md §1). All five calls return the full
// ConsultWaitingRoomView, so the caller can drive the whole panel off the
// response and skip a refetch. Live roles (route guard is coarser than the
// actual enforcement — a 403 is still possible even when the route allows
// the call):
//   POST   /api/v1/shifts/{shiftId}/consult/queue              hospital admin      → 201
//   GET    /api/v1/shifts/{shiftId}/consult/queue               clinician/admin    → 200
//   POST   /api/v1/shifts/{shiftId}/consult/queue/{id}/call     assigned clinician → 200
//   POST   /api/v1/shifts/{shiftId}/consult/queue/{id}/seen     assigned clinician → 200
//   DELETE /api/v1/shifts/{shiftId}/consult/queue/{id}          hospital admin     → 200

/** Exactly one of `patient_id` / `patient` — both or neither is a 422. */
export type AddPatientToQueueRequest =
  | { patient_id: string; patient?: undefined }
  | { patient_id?: undefined; patient: NewPatientRequest };

export const ConsultQueueService = {
  async addPatient(
    shiftId: string,
    payload: AddPatientToQueueRequest,
  ): Promise<ConsultWaitingRoomView> {
    const res = await apiClient.post<ConsultWaitingRoomView>(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/consult/queue`,
      payload,
    );
    return res.data;
  },

  async getQueue(shiftId: string): Promise<ConsultWaitingRoomView> {
    const res = await apiClient.get<ConsultWaitingRoomView>(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/consult/queue`,
    );
    return res.data;
  },

  /** Marks `entryId` in_consult. 409 if another entry is already in_consult
   * — a DB-constraint race, not something worth pre-checking client-side. */
  async callPatient(
    shiftId: string,
    entryId: string,
  ): Promise<ConsultWaitingRoomView> {
    const res = await apiClient.post<ConsultWaitingRoomView>(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/consult/queue/${encodeURIComponent(entryId)}/call`,
    );
    return res.data;
  },

  async markSeen(
    shiftId: string,
    entryId: string,
  ): Promise<ConsultWaitingRoomView> {
    const res = await apiClient.post<ConsultWaitingRoomView>(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/consult/queue/${encodeURIComponent(entryId)}/seen`,
    );
    return res.data;
  },

  async removeFromQueue(
    shiftId: string,
    entryId: string,
  ): Promise<ConsultWaitingRoomView> {
    const res = await apiClient.delete<ConsultWaitingRoomView>(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/consult/queue/${encodeURIComponent(entryId)}`,
    );
    return res.data;
  },
};
