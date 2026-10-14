import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/Card";
import { ApiError } from "@/lib/apiError";
import {
  ConsultationNoteService,
  type ConsultationMedication,
} from "@/shared/patients/services/consultationNoteService";
import { Header, StatusBadge } from "../DashboardChrome";
import type { PatientRecord } from "../../types";

type ReportNotes = NonNullable<PatientRecord["reportNotes"]>;

const TEXT_FIELDS: { key: keyof Pick<
  ReportNotes,
  "chiefComplaint" | "historyOfPresentIllness" | "assessment" | "clinicalPlan" | "diagnosis"
>; label: string }[] = [
  { key: "chiefComplaint", label: "Chief Complaint" },
  { key: "historyOfPresentIllness", label: "History of Present Illness" },
  { key: "assessment", label: "Assessment" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "clinicalPlan", label: "Clinical Plan" },
];

function emptyMedication(): ConsultationMedication {
  return { name: "", dose: "", route: "", frequency: "" };
}

export function ClinicalReviewScreen({
  patient,
  shiftId,
  onBack,
  onFinalize,
}: {
  patient: PatientRecord;
  shiftId: string;
  onBack: () => void;
  onFinalize: (notes: ReportNotes) => void;
}) {
  const [notes, setNotes] = useState<ReportNotes>(
    patient.reportNotes ?? {
      chiefComplaint: patient.chiefComplaint,
      historyOfPresentIllness: "",
      assessment: "",
      clinicalPlan: "",
      diagnosis: "",
      vitals: {
        blood_pressure_systolic: patient.vitals.bloodPressureSystolic || undefined,
        blood_pressure_diastolic: patient.vitals.bloodPressureDiastolic || undefined,
        heart_rate_bpm: patient.vitals.heartRateBpm || undefined,
        temperature_c: patient.vitals.temperatureC || undefined,
      },
      medications: [],
      followUpAt: "",
    },
  );
  const [noteId, setNoteId] = useState<string | null>(notes.noteId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Start a real consultation note the moment the clinician opens this
  // screen — patients with no backend id (e.g. AI-triage ingest failed at
  // intake) have nothing to attach a note to, so they stay session-only.
  useEffect(() => {
    if (noteId || !patient.backendPatientId) return;
    ConsultationNoteService.start(patient.backendPatientId, { shift_id: shiftId })
      .then((res) => setNoteId(res.id))
      .catch(() => {
        setNoteError("Couldn't start a clinical note — this will only save for this session.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.backendPatientId]);

  function updateField(key: (typeof TEXT_FIELDS)[number]["key"], value: string) {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }

  function updateVital(key: keyof ReportNotes["vitals"], value: string) {
    const parsed = value === "" ? undefined : Number(value);
    setNotes((prev) => ({ ...prev, vitals: { ...prev.vitals, [key]: parsed } }));
  }

  function updateMedication(index: number, patch: Partial<ConsultationMedication>) {
    setNotes((prev) => ({
      ...prev,
      medications: prev.medications.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    setNoteError(null);

    if (noteId) {
      try {
        await ConsultationNoteService.update(noteId, {
          chief_complaint: notes.chiefComplaint,
          history_of_present_illness: notes.historyOfPresentIllness,
          assessment: notes.assessment,
          plan: notes.clinicalPlan,
          diagnosis: notes.diagnosis,
          vitals: notes.vitals,
          medications: notes.medications.filter((m) => m.name.trim()),
          ...(notes.followUpAt ? { follow_up_at: new Date(notes.followUpAt).toISOString() } : {}),
        });
      } catch (err) {
        setNoteError(
          err instanceof ApiError
            ? err.message
            : "Couldn't save this note to the patient's record.",
        );
      }
    }

    setIsSaving(false);
    onFinalize({ ...notes, noteId: noteId ?? undefined });
  }

  return (
    <>
      <Header title="Clinical Review" subtitle={patient.name} onBack={onBack} />
      <main className="space-y-4 px-5 py-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <h2 className="font-bold">{patient.name}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                {patient.age}y • {patient.gender}
              </p>
            </div>
            <StatusBadge tone={noteId ? "green" : "amber"}>
              {noteId ? "Saved to patient record" : "Draft — this session only"}
            </StatusBadge>
          </CardContent>
        </Card>

        {noteError && (
          <p className="rounded-xl bg-warning-50 px-4 py-3 text-center text-xs text-warning-700 dark:bg-warning-950 dark:text-warning-300">
            {noteError}
          </p>
        )}

        {TEXT_FIELDS.map((field) => (
          <Card key={field.key}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{field.label}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <textarea
                rows={3}
                value={notes[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="w-full resize-none rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700 outline-none dark:bg-neutral-800 dark:text-neutral-400"
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Vitals</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 p-4 pt-0">
            {(
              [
                ["blood_pressure_systolic", "BP Systolic"],
                ["blood_pressure_diastolic", "BP Diastolic"],
                ["heart_rate_bpm", "Heart Rate (BPM)"],
                ["temperature_c", "Temperature (°C)"],
                ["spo2", "SpO2 (%)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {label}
                <input
                  type="number"
                  value={notes.vitals[key] ?? ""}
                  onChange={(e) => updateVital(key, e.target.value)}
                  className="mt-1 w-full rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700 outline-none dark:bg-neutral-800 dark:text-neutral-200"
                />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-base">Medications</CardTitle>
            <button
              type="button"
              onClick={() =>
                setNotes((prev) => ({
                  ...prev,
                  medications: [...prev.medications, emptyMedication()],
                }))
              }
              className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {notes.medications.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">None prescribed.</p>
            ) : (
              notes.medications.map((med, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={med.name}
                    onChange={(e) => updateMedication(i, { name: e.target.value })}
                    placeholder="Name"
                    className="w-2/5 rounded-lg bg-neutral-50 px-2.5 py-2 text-xs text-neutral-700 outline-none dark:bg-neutral-800 dark:text-neutral-200"
                  />
                  <input
                    value={med.dose ?? ""}
                    onChange={(e) => updateMedication(i, { dose: e.target.value })}
                    placeholder="Dose"
                    className="w-1/5 rounded-lg bg-neutral-50 px-2.5 py-2 text-xs text-neutral-700 outline-none dark:bg-neutral-800 dark:text-neutral-200"
                  />
                  <input
                    value={med.frequency ?? ""}
                    onChange={(e) => updateMedication(i, { frequency: e.target.value })}
                    placeholder="Frequency"
                    className="w-1/5 rounded-lg bg-neutral-50 px-2.5 py-2 text-xs text-neutral-700 outline-none dark:bg-neutral-800 dark:text-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNotes((prev) => ({
                        ...prev,
                        medications: prev.medications.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="shrink-0 rounded-lg p-2 text-neutral-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Follow-up</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <input
              type="datetime-local"
              value={notes.followUpAt}
              onChange={(e) => setNotes((prev) => ({ ...prev, followUpAt: e.target.value }))}
              className="w-full rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700 outline-none dark:bg-neutral-800 dark:text-neutral-400"
            />
          </CardContent>
        </Card>

        <Button
          type="button"
          className="w-full bg-brand-700"
          isLoading={isSaving}
          onClick={handleSave}
        >
          {noteId ? "Save to Patient Record" : "Save to Session"}
        </Button>
      </main>
    </>
  );
}
