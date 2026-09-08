// ── Handover image attachments ──────────────────────────────────────────────
//
// The backend `SubmitHandoverRequest` has no field for post-shift photos, and
// the API can't be changed here. `critical_patients` and `pending_tasks` are
// free-form JSON arrays, so worker-uploaded images ride along inside
// `pending_tasks` as tagged objects. Both the worker (write) and hospital
// (read) sides use these helpers so the tag stays in one place.

export const HANDOVER_IMAGE_TAG = "shift_image";

export interface HandoverImageEntry {
  type: typeof HANDOVER_IMAGE_TAG;
  url: string;
  uploaded_at: string;
  caption?: string;
}

export function makeImageEntry(url: string, caption?: string): HandoverImageEntry {
  return {
    type: HANDOVER_IMAGE_TAG,
    url,
    uploaded_at: new Date().toISOString(),
    ...(caption ? { caption } : {}),
  };
}

function isImageEntry(v: unknown): v is HandoverImageEntry {
  return (
    typeof v === "object" &&
    v !== null &&
    (v as { type?: unknown }).type === HANDOVER_IMAGE_TAG &&
    typeof (v as { url?: unknown }).url === "string"
  );
}

/** Split a free-form handover array into real entries and image attachments. */
export function partitionHandoverEntries(value: unknown): {
  entries: Array<Record<string, unknown>>;
  images: HandoverImageEntry[];
} {
  const entries: Array<Record<string, unknown>> = [];
  const images: HandoverImageEntry[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (isImageEntry(item)) images.push(item);
      else if (typeof item === "object" && item !== null && !Array.isArray(item)) {
        entries.push(item as Record<string, unknown>);
      }
    }
  }
  return { entries, images };
}
