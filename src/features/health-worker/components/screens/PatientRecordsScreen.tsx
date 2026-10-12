import { useEffect, useState } from "react";
import { AlertTriangle, Stethoscope, User } from "lucide-react";
import { Badge } from "@/shared/components/ui/Badge";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ApiError } from "@/lib/apiError";
import {
  PatientRecordsService,
  type ShiftPatientRecordsView,
} from "@/shared/patients/services/patientRecordsService";
import { Header } from "../DashboardChrome";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${d.toLocaleTimeString(
    "en-US",
    { hour: "numeric", minute: "2-digit" },
  )}`;
}

/** Keeps working after the shift completes — this is the point of it, so
 * it's never gated on shift status. See nexus-backend/docs/FRONTEND_HANDOFF.md §4. */
export function PatientRecordsScreen({
  shiftId,
  onBack,
}: {
  shiftId: string;
  onBack: () => void;
}) {
  const [view, setView] = useState<ShiftPatientRecordsView | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    <>
      <Header title="Patient Records" subtitle="This shift" onBack={onBack} />
      <main className="space-y-4 px-5 py-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <p className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-950 dark:text-error-300">
            {error}
          </p>
        ) : !view || view.patients.length === 0 ? (
          <EmptyState
            className="bg-white dark:bg-neutral-900"
            icon={<Stethoscope className="h-10 w-10 text-brand-300" />}
            title="No patient records yet"
            description="Records appear here once patients are seen during this shift."
          />
        ) : (
          view.patients.map((patient) => (
            <div
              key={patient.patient_id}
              className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
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
                <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
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
                <div className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                    {patient.handover_note.escalation_required && (
                      <AlertTriangle className="h-3.5 w-3.5 text-error-500" />
                    )}
                    Handover Note
                  </p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    {patient.handover_note.summary}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </>
  );
}
