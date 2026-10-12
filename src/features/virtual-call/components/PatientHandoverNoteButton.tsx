import { useEffect, useState } from "react";
import { ClipboardList, X } from "lucide-react";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { ApiError } from "@/lib/apiError";
import {
  PatientHandoverNoteService,
  type PatientHandoverNote,
} from "../patientHandoverNoteService";

function TagListInput({
  label,
  values,
  disabled,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  disabled: boolean;
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setDraft("");
  }

  return (
    <div>
      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{label}</p>
      {values.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {v}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                  aria-label={`Remove ${v}`}
                  className="text-neutral-400 hover:text-error-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {!disabled && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          className="mt-1.5 w-full rounded-lg bg-neutral-50 px-3 py-1.5 text-sm text-neutral-700 outline-none dark:bg-neutral-800 dark:text-neutral-200"
        />
      )}
    </div>
  );
}

/**
 * Self-contained trigger + modal for the per-patient handover note — drop it
 * wherever a patient is already in view (the consult queue row, a patient
 * detail screen). Writable by the hospital admin or the shift's assigned
 * clinician only; the backend 403s anyone else, surfaced as the usual error.
 */
export function PatientHandoverNoteButton({
  shiftId,
  patientId,
  patientName,
}: {
  shiftId: string;
  patientId: string;
  patientName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState<PatientHandoverNote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState("");
  const [outstandingTasks, setOutstandingTasks] = useState<string[]>([]);
  const [medicationsGiven, setMedicationsGiven] = useState<string[]>([]);
  const [escalationRequired, setEscalationRequired] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setError("");
    PatientHandoverNoteService.get(shiftId, patientId)
      .then((existing) => {
        setNote(existing);
        if (existing) {
          setSummary(existing.summary);
          setOutstandingTasks(existing.outstanding_tasks);
          setMedicationsGiven(existing.medications_given);
          setEscalationRequired(existing.escalation_required);
          setEscalationReason(existing.escalation_reason ?? "");
        }
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load this note."),
      )
      .finally(() => setIsLoading(false));
  }, [isOpen, shiftId, patientId]);

  const locked = note != null && !note.editable;

  async function handleSave() {
    if (escalationRequired && !escalationReason.trim()) {
      setError("An escalation reason is required.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const saved = await PatientHandoverNoteService.save(shiftId, patientId, {
        summary,
        outstanding_tasks: outstandingTasks,
        medications_given: medicationsGiven,
        escalation_required: escalationRequired,
        ...(escalationRequired ? { escalation_reason: escalationReason } : {}),
      });
      setNote(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this note.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <ClipboardList className="h-3.5 w-3.5" />
        Handover note
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Handover note · ${patientName}`}
        size="md"
      >
        {isLoading ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
        ) : (
          <div className="space-y-4">
            {error && (
              <p className="rounded-lg bg-error-50 px-3 py-2 text-xs text-error-700 dark:bg-error-950 dark:text-error-300">
                {error}
              </p>
            )}
            {note && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {locked ? "Locked — " : ""}
                {note.author_name ? `Last saved by ${note.author_name}` : "Last saved"} ·{" "}
                {new Date(note.submitted_at).toLocaleString()}
              </p>
            )}

            <div>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Summary</p>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={locked}
                className="mt-1.5 w-full resize-none rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700 outline-none disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-200"
                placeholder="Condition, what to watch for, anything the next clinician needs to know…"
              />
            </div>

            <TagListInput
              label="Outstanding tasks"
              values={outstandingTasks}
              disabled={locked}
              onChange={setOutstandingTasks}
              placeholder="Add a task and press Enter"
            />
            <TagListInput
              label="Medications given"
              values={medicationsGiven}
              disabled={locked}
              onChange={setMedicationsGiven}
              placeholder="Add a medication and press Enter"
            />

            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={escalationRequired}
                disabled={locked}
                onChange={(e) => setEscalationRequired(e.target.checked)}
              />
              Needs escalation
            </label>
            {escalationRequired && (
              <textarea
                rows={2}
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                disabled={locked}
                className="w-full resize-none rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700 outline-none disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-200"
                placeholder="Why does this need escalation?"
              />
            )}

            {!locked && (
              <Button
                type="button"
                className="w-full bg-brand-700"
                isLoading={isSaving}
                onClick={handleSave}
              >
                {note ? "Update note" : "Save note"}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
