import apiClient from "@/lib/apiClient";

// ── Signed Cloudinary upload ────────────────────────────────────────────────
//
// `GET /api/v1/uploads/signature` returns a short-lived signed payload; the
// browser then POSTs the file straight to Cloudinary (never through our API).
// The backend only signs `folder` + `timestamp`, so the multipart form must
// send exactly those extra fields alongside `file`, `api_key` and `signature`.

interface SignedUpload {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  signature: string;
  upload_url: string;
}

export type UploadKind = "hospital_logo" | "worker_avatar" | "shift_photo";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Upload one image file to Cloudinary and resolve to its `secure_url`. */
export async function uploadImage(
  file: File,
  kind: UploadKind = "shift_photo",
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be uploaded.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image is larger than 10 MB.");
  }

  const { data: sig } = await apiClient.get<SignedUpload>(
    "/api/v1/uploads/signature",
    { params: { kind } },
  );

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.api_key);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const res = await fetch(sig.upload_url, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}).`);
  }
  const body = (await res.json()) as { secure_url?: string };
  if (!body.secure_url) {
    throw new Error("Upload succeeded but returned no URL.");
  }
  return body.secure_url;
}

/** Upload several images; rejects if any one fails. */
export function uploadImages(
  files: File[],
  kind: UploadKind = "shift_photo",
): Promise<string[]> {
  return Promise.all(files.map((f) => uploadImage(f, kind)));
}
