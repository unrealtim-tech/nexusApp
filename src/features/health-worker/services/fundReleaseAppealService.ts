// ── Fund-release appeals (worker side) ──────────────────────────────────────
//
// When a hospital hasn't released payment 24h after a shift ended (and the
// worker submitted a handover), the worker can appeal to NexusCare. The
// backend has no create-dispute endpoint and can't be changed here, so the
// appeal is recorded locally and shown back to the worker; NexusCare's admin
// app surfaces the same eligibility from shift + handover data and acts on it.

export interface FundReleaseAppeal {
  shiftId: string;
  submittedAt: string;
  reason: string;
}

const KEY = "nexus.worker.fundReleaseAppeals";

/** Hours after a shift ends before the worker may appeal a non-release. */
export const APPEAL_ELIGIBLE_AFTER_HOURS = 24;

function readAll(): Record<string, FundReleaseAppeal> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, FundReleaseAppeal>) : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, FundReleaseAppeal>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — appeal just won't persist across reloads */
  }
}

export function getAppeals(): Record<string, FundReleaseAppeal> {
  return readAll();
}

export function getAppeal(shiftId: string): FundReleaseAppeal | null {
  return readAll()[shiftId] ?? null;
}

export function submitAppeal(
  shiftId: string,
  reason: string,
): FundReleaseAppeal {
  const map = readAll();
  const appeal: FundReleaseAppeal = {
    shiftId,
    reason: reason.trim(),
    submittedAt: new Date().toISOString(),
  };
  map[shiftId] = appeal;
  writeAll(map);
  return appeal;
}

/**
 * True when a payout row is old enough and still unpaid, so the worker should
 * be offered an appeal. A `completed` shift always has a submitted handover
 * (clock-out requires one), so that condition is implied.
 */
export function isAppealEligible(tx: {
  status: string;
  completed_at?: string | null;
  scheduled_start?: string | null;
}): boolean {
  if (tx.status !== "pending") return false;
  const endIso = tx.completed_at ?? tx.scheduled_start;
  if (!endIso) return false;
  const hours = (Date.now() - new Date(endIso).getTime()) / 3_600_000;
  return hours >= APPEAL_ELIGIBLE_AFTER_HOURS;
}
