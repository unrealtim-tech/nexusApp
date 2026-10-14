import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Stethoscope, User } from "lucide-react";
import { Badge } from "@/shared/components/ui/Badge";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ApiError } from "@/lib/apiError";
import { PATHS } from "@/routes/paths";
import {
  PatientRecordsService,
  type ShiftPatientRecordsView,
} from "@/shared/patients/services/patientRecordsService";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${d.toLocaleTimeString(
    "en-US",
    { hour: "numeric", minute: "2-digit" },
  )}`;
}

/**
 * The hospital's record for a shift's patients — the hospital app's first
 * patient-facing read view. Works after the shift completes (that's the
 * point of it), so this is never gated on shift status.
 */
export function ShiftPatientRecordsPage() {
  const { shiftId } = useParams<{ shiftId: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<ShiftPatientRecordsView | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!shiftId) return;
    let cancelled = false;
    setIsLoading(true);
    PatientRecordsService.getForShift(shiftId)
      .then((data) => {
        if (!cancelled) setView(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't load patient records.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shiftId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => shiftId && navigate(PATHS.hospital.shiftDetail(shiftId))}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shift
        </button>
        {view && (
          <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            {view.patients_seen} of {view.patients_total} seen
          </span>
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-4">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Patient Records</h1>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <p className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-950 dark:text-error-300">
            {error}
          </p>
        ) : !view ? null : view.metadata_only ? (
          <EmptyState
            icon={<Stethoscope className="h-10 w-10 text-neutral-300" />}
            title="Counts only"
            description={`${view.patients_total} patients, ${view.patients_seen} seen. Patient identities aren't shown to this role.`}
          />
        ) : view.patients.length === 0 ? (
          <EmptyState
            icon={<Stethoscope className="h-10 w-10 text-neutral-300" />}
            title="No patient records yet"
            description="Records appear here once patients are seen during this shift."
          />
        ) : (
          view.patients.map((patient) => (
            <div
              key={patient.patient_id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950">
                    <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white">{patient.full_name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {patient.age}y • {patient.gender}
                    </p>
                  </div>
                </div>
                {patient.queue_state && (
                  <Badge variant={patient.queue_state === "seen" ? "success" : "neutral"}>
                    {patient.queue_state}
                  </Badge>
                )}
              </div>

              {patient.clinical_notes.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                    Clinical Notes ({patient.clinical_notes.length})
                  </p>
                  {patient.clinical_notes.map((note) => (
                    <div key={note.id} className="text-sm text-neutral-700 dark:text-neutral-300">
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        {formatDateTime(note.updated_at)}
                      </p>
                      {note.diagnosis && <p className="mt-1">Diagnosis: {note.diagnosis}</p>}
                      {note.assessment && <p className="mt-1">{note.assessment}</p>}
                    </div>
                  ))}
                </div>
              )}

              {patient.handover_note && (
                <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                    {patient.handover_note.escalation_required && (
                      <AlertTriangle className="h-3.5 w-3.5 text-error-500" />
                    )}
                    Handover Note
                  </p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    {patient.handover_note.summary}
                  </p>
                  {patient.handover_note.escalation_required && (
                    <p className="text-xs font-semibold text-error-600 dark:text-error-400">
                      Escalation: {patient.handover_note.escalation_reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
