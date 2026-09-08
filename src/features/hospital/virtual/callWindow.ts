import type {
  ApiShiftStatus,
  ApiShiftType,
} from "@/features/hospital/shifts/types";

export type CallWindowState =
  | "too_early"
  | "open"
  | "elapsed"
  | "completed"
  | "unavailable";

export interface CallWindowInfo {
  state: CallWindowState;
  /** Tooltip/inline copy explaining why the button is (or isn't) enabled. */
  message: string;
}

/**
 * How early (minutes before `scheduled_start`) the hospital may start the call.
 * Kept deliberately tight — a virtual visit shouldn't begin well ahead of time.
 * The rule is surfaced to hospitals in the UI, not just enforced silently.
 */
export const CALL_OPEN_LEAD_MINUTES = 2;

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Computes whether the hospital's "start the call" action should be enabled
 * for a virtual shift, and what to tell the hospital admin when it isn't.
 *
 * This is a client-side rule: the backend `/consult/token` endpoint is not
 * time-gated, so this is what actually stops a hospital opening a visit far
 * ahead of (or long after) its slot. The health-worker app never starts a
 * call — it can only join once the hospital is present.
 */
export function getCallWindowInfo(
  shift: {
    shift_type: ApiShiftType;
    status: ApiShiftStatus;
    scheduled_start: string;
    scheduled_end: string;
  },
  now: Date = new Date(),
): CallWindowInfo {
  if (shift.shift_type !== "virtual") {
    return {
      state: "unavailable",
      message: "This is an in-person shift — no call session.",
    };
  }

  if (shift.status === "completed") {
    return {
      state: "completed",
      message: "This consultation has already taken place.",
    };
  }
  if (shift.status === "cancelled") {
    return { state: "unavailable", message: "This shift was cancelled." };
  }
  if (shift.status === "no_show") {
    return {
      state: "unavailable",
      message: "The clinician did not show up for this shift.",
    };
  }
  if (shift.status === "open") {
    return {
      state: "unavailable",
      message: "Assign a clinician to this shift before starting the call.",
    };
  }

  const start = new Date(shift.scheduled_start);
  const end = new Date(shift.scheduled_end);
  const opensAt = new Date(start.getTime() - CALL_OPEN_LEAD_MINUTES * 60_000);
  const closesAt = end;

  if (now < opensAt) {
    return {
      state: "too_early",
      message: `You can start this call from ${formatTime(opensAt)} — ${CALL_OPEN_LEAD_MINUTES} minutes before the scheduled start.`,
    };
  }
  if (now > closesAt) {
    return {
      state: "elapsed",
      message: `The call window closed at ${formatTime(closesAt)}, the scheduled end time.`,
    };
  }
  return {
    state: "open",
    message: `Ready to connect. This call would normally start at ${formatTime(start)}.`,
  };
}
