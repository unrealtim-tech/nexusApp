import apiClient from "@/lib/apiClient";

export type VideoSessionStatus = "pending" | "active" | "ended";

export interface VirtualCallToken {
  url: string;
  token: string;
  roomName: string;
  sessionId: string;
  sessionStatus: VideoSessionStatus;
  expiresAt: string;
}

export interface ConsultParticipant {
  identity: string;
  display_name: string | null;
  participant_role: string;
  connected: boolean;
  joined_at: string | null;
  left_at: string | null;
  is_publisher: boolean;
  clocked_in_at: string | null;
}

/** `consult_queue.state` — `removed` is a real value (a withdrawn/cancelled
 * entry), not just the three states that move forward. */
export type QueueEntryState = "waiting" | "in_consult" | "seen" | "removed";

export interface ConsultQueuePatientView {
  entry_id: string;
  patient_id: string;
  full_name: string;
  /** Float, not an integer — mirrors the ML model's input type. */
  age: number;
  gender: string;
  severity_level: string;
  predictive_risk_score: number | null;
  state: QueueEntryState;
  /** A sort key, not an index — not unique, not renumbered when entries are removed. */
  position: number;
  called_at: string | null;
  seen_at: string | null;
  queued_at: string;
  has_clinical_note: boolean;
  has_handover_note: boolean;
}

export interface ConsultWaitingRoomView {
  waiting: number;
  in_consult: number;
  seen: number;
  /** Includes removed entries — doesn't equal waiting + in_consult + seen. */
  total: number;
  /** Empty for platform-admin viewers (SuperAdmin/OperationsAdmin), who get
   * counts but never patient identities. */
  patients: ConsultQueuePatientView[];
}

export interface ConsultSession {
  session_id: string;
  shift_id: string | null;
  room_name: string;
  status: VideoSessionStatus;
  started_at: string | null;
  ended_at: string | null;
  ended_reason: string | null;
  live: boolean;
  clock_in_recorded: boolean;
  participants: ConsultParticipant[];
  recording: { enabled: boolean; status: string | null };
  waiting_room: ConsultWaitingRoomView;
}

interface VirtualCallTokenResponse {
  session_id: string;
  url: string;
  token: string;
  room_name: string;
  session_status: VideoSessionStatus;
  expires_at: string;
}

/** Worker GPS sent with a join request so the backend can enforce the 10 km geofence. */
export interface JoinCoords {
  lat: number;
  lng: number;
}

export const VirtualCallService = {
  async getCallToken(
    shiftId: string,
    deviceLabel = "hospital virtual shift page",
    coords?: JoinCoords,
  ): Promise<VirtualCallToken> {
    const res = await apiClient.post<VirtualCallTokenResponse>(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/consult/token`,
      {
        mode: "participant",
        device_label: deviceLabel,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      },
    );
    return {
      url: res.data.url,
      token: res.data.token,
      roomName: res.data.room_name,
      sessionId: res.data.session_id,
      sessionStatus: res.data.session_status,
      expiresAt: res.data.expires_at,
    };
  },

  async getSession(shiftId: string): Promise<ConsultSession> {
    const res = await apiClient.get<ConsultSession>(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/consult`,
    );
    return res.data;
  },

  async leaveSession(shiftId: string): Promise<void> {
    await apiClient.post(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/consult/leave`,
    );
  },

  async endSession(shiftId: string): Promise<void> {
    await apiClient.post(
      `/api/v1/shifts/${encodeURIComponent(shiftId)}/consult/end`,
      { reason: "Hospital ended consultation" },
    );
  },
};
