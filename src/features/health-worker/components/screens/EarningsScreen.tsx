import { useState } from "react";
import { Activity, Clock, ShieldAlert, WalletCards } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { Card, CardContent } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { appToast } from "@/shared/components/feedback/toast";
import { Metric, StatusBadge, formatKobo } from "../DashboardChrome";
import type { EarningsSummary } from "../../hooks/useHealthWorkerShifts";
import {
  APPEAL_ELIGIBLE_AFTER_HOURS,
  getAppeals,
  isAppealEligible,
  submitAppeal,
  type FundReleaseAppeal,
} from "../../services/fundReleaseAppealService";

const statusTone: Record<string, "green" | "amber" | "red" | "blue"> = {
  success: "green",
  pending: "amber",
  failed: "red",
};

export function EarningsScreen({
  earnings,
  isLoading,
  loadError,
}: {
  earnings: EarningsSummary | null;
  isLoading: boolean;
  loadError: string | null;
}) {
  const [appeals, setAppeals] = useState<Record<string, FundReleaseAppeal>>(
    () => getAppeals(),
  );
  const [appealShiftId, setAppealShiftId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const sendAppeal = () => {
    if (!appealShiftId || !reason.trim()) return;
    const appeal = submitAppeal(appealShiftId, reason.trim());
    setAppeals((prev) => ({ ...prev, [appealShiftId]: appeal }));
    setAppealShiftId(null);
    setReason("");
    appToast.success(
      "Appeal logged",
      "NexusCare will review the delayed payout and can release it on your behalf.",
    );
  };

  return (
    <>
      <main className="space-y-5 py-4">
        <h1 className="text-base font-extrabold text-ink-900 dark:text-neutral-100">Earnings</h1>
        {loadError && (
          <p className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-950/40 dark:text-error-300">{loadError}</p>
        )}
        {isLoading && <p className="text-sm text-ink-500 dark:text-neutral-400">Loading...</p>}

        {earnings && (
          <>
            <section className="rounded-2xl bg-brand-700 p-5 text-white dark:bg-brand-800">
              <p className="text-xs text-brand-100">Total Earned</p>
              <p className="text-3xl font-bold">{formatKobo(earnings.total_earned_kobo)}</p>
            </section>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Pending" value={formatKobo(earnings.pending_kobo)} icon={Clock} />
              <Metric
                label="This Month"
                value={formatKobo(earnings.this_month_kobo)}
                icon={Activity}
              />
            </div>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-ink-900 dark:text-neutral-100">Recent Earnings</h2>
                <span className="text-xs text-ink-500 dark:text-neutral-400">
                  {earnings.total_transactions} total
                </span>
              </div>
              {earnings.transactions.length === 0 ? (
                <EmptyState
                  className="bg-white dark:bg-neutral-900"
                  icon={<WalletCards className="h-10 w-10 text-brand-300 dark:text-brand-400" />}
                  title="No payouts yet"
                />
              ) : (
                <div className="space-y-3">
                  {earnings.transactions.map((tx) => {
                    const appeal = tx.shift_id ? appeals[tx.shift_id] : undefined;
                    const canAppeal =
                      !!tx.shift_id && !appeal && isAppealEligible(tx);
                    return (
                      <Card key={tx.id}>
                        <CardContent className="flex flex-col gap-3 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-ink-900 dark:text-neutral-50">{tx.hospital_name ?? "Hospital"}</p>
                              <p className="text-xs text-ink-500 dark:text-neutral-500">
                                {tx.role_title ?? ""}
                                {tx.completed_at
                                  ? ` • ${new Date(tx.completed_at).toLocaleDateString("en-NG", {
                                      month: "short",
                                      day: "numeric",
                                    })}`
                                  : ""}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-success-700 dark:text-success-400">
                                {formatKobo(tx.amount_kobo)}
                              </p>
                              <StatusBadge tone={statusTone[tx.status] ?? "blue"}>
                                {tx.status}
                              </StatusBadge>
                            </div>
                          </div>

                          {appeal && (
                            <p className="flex items-center gap-1.5 rounded-lg bg-warning-50 px-3 py-2 text-xs font-medium text-warning-800 dark:bg-warning-950/40 dark:text-warning-300">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Appeal submitted{" "}
                              {new Date(appeal.submittedAt).toLocaleDateString("en-NG", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              — NexusCare is reviewing.
                            </p>
                          )}

                          {canAppeal && (
                            <button
                              type="button"
                              onClick={() => setAppealShiftId(tx.shift_id ?? null)}
                              className="flex items-center justify-center gap-1.5 rounded-lg border border-warning-300 px-3 py-2 text-xs font-bold text-warning-800 transition-colors hover:bg-warning-50 dark:border-warning-800 dark:text-warning-300 dark:hover:bg-warning-950/40"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Payment overdue — appeal to NexusCare
                            </button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Modal
        isOpen={!!appealShiftId}
        onClose={() => setAppealShiftId(null)}
        title="Appeal a delayed payout"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600 dark:text-neutral-400">
            The hospital hasn't released payment for this shift more than{" "}
            {APPEAL_ELIGIBLE_AFTER_HOURS} hours after it ended. NexusCare will
            review your handover and can release the funds on your behalf.
          </p>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add any detail that helps NexusCare review this faster…"
            className="w-full resize-none rounded-lg bg-neutral-50 px-3 py-2 text-sm outline-none dark:bg-neutral-800"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAppealShiftId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!reason.trim()}
              onClick={sendAppeal}
              className="bg-brand-700"
            >
              Submit appeal
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
