import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Clock, Filter, MapPin, SearchX, X } from "lucide-react";
import { SearchInput } from "@/shared/components/ui/SearchInput";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { cn } from "@/shared/utils/cn";
import { formatCurrency } from "../DashboardChrome";
import type { NearbyShiftCard } from "../../hooks/useHealthWorkerShifts";

export function shiftPayoutKobo(shift?: NearbyShiftCard | null): number {
  if (!shift) return 0;
  if (shift.pay_type === "fixed_rate") return shift.fixed_rate_kobo ?? 0;
  return Math.round((shift.rate_kobo_per_hour ?? 0) * (shift.duration_hours ?? 0));
}

export function shiftPayoutLabel(shift?: NearbyShiftCard | null): string {
  return formatCurrency(Math.round(shiftPayoutKobo(shift) / 100));
}

function formatShiftTiming(iso?: string | null): string {
  if (!iso) return "Scheduled";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "Scheduled";
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const time = date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });

  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`;
  return `${date.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}, ${time}`;
}

const priorityTagStyle: Record<string, string> = {
  stat: "bg-error-800 text-white",
  urgent: "bg-error-100 text-error-800 dark:bg-error-950 dark:text-error-300",
  normal: "bg-success-100 text-success-800 dark:bg-success-950 dark:text-success-300",
  scheduled: "bg-success-700 text-white",
};

const priorityTagLabel: Record<string, string> = {
  stat: "STAT",
  urgent: "Urgent",
  normal: "Open",
  scheduled: "Scheduled",
};

/** Urgency values a shift card can carry, in the order shown in the filter. */
const URGENCY_FILTERS: { value: string; label: string }[] = [
  { value: "stat", label: "STAT" },
  { value: "urgent", label: "Urgent" },
  { value: "normal", label: "Open" },
  { value: "scheduled", label: "Scheduled" },
];

const SHIFT_TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "in_person", label: "Physical" },
  { value: "virtual", label: "Virtual" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "nearest", label: "Nearest" },
  { value: "pay", label: "Highest pay" },
  { value: "soonest", label: "Starting soonest" },
];

type SortKey = "nearest" | "pay" | "soonest";
type OpenPanel = null | "distance" | "specialty" | "urgency" | "more";

/** Radius bounds — matches the backend's `radius_km` (default 5, max 50). */
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;
const DEFAULT_RADIUS_KM = 5;
const RADIUS_PRESETS = [2, 5, 10, 25, 50];

function getPriorityStyle(priority?: string | null): string {
  return (priority && priorityTagStyle[priority]) || priorityTagStyle.normal;
}

function getPriorityLabel(priority?: string | null): string {
  return (priority && priorityTagLabel[priority]) || "Open";
}

function priorityCaption(shift: NearbyShiftCard): string {
  return shift.priority === "stat" ? "Immediate Start" : formatShiftTiming(shift.scheduled_start);
}

function ShiftCard({ shift, onOpen }: { shift: NearbyShiftCard; onOpen: () => void }) {
  if (!shift) return null;
  const shiftId = shift.shift_id || (shift as unknown as Record<string, unknown>).id || "shift-card";

  return (
    <button
      type="button"
      key={String(shiftId)}
      onClick={onOpen}
      className="w-full rounded-xl bg-white p-5 text-left shadow-sm ring-1 ring-neutral-900/5 dark:bg-neutral-900 dark:ring-neutral-800 dark:border dark:border-neutral-800 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                getPriorityStyle(shift.priority),
              )}
            >
              {getPriorityLabel(shift.priority)}
            </span>
            <span
              className={cn(
                "text-xs font-semibold",
                shift.priority === "stat" ? "text-error-800 dark:text-error-400" : "text-ink-500 dark:text-neutral-400",
              )}
            >
              {priorityCaption(shift)}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-extrabold text-ink-900 dark:text-neutral-100">{shift.role_title || "Role"}</h3>
          <p className="text-sm font-medium text-ink-700 dark:text-neutral-300">
            {shift.hospital_name ?? "Hospital"}
            {shift.specialty ? ` • ${shift.specialty}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-extrabold text-brand-700 dark:text-brand-400">{shiftPayoutLabel(shift)}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500 dark:text-neutral-400">
            {shift.pay_type === "fixed_rate" ? "Fixed" : "Per shift"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-800 pt-4">
        <div className="flex min-w-0 items-center gap-3 text-xs text-ink-700 dark:text-neutral-300">
          {typeof shift.distance_km === "number" && (
            <span className="flex shrink-0 items-center gap-1">
              <MapPin className="h-3 w-3" />
              {shift.distance_km.toFixed(1)}km
            </span>
          )}
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="h-3 w-3" />
            {shift.duration_hours ?? 0}h
          </span>
          {shift.shift_type === "virtual" ? (
            <span className="shrink-0 rounded-full bg-brand-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white dark:bg-brand-600">
              Virtual
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-brand-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-700 dark:border-brand-400 dark:text-brand-400">
              Physical
            </span>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-xl px-5 py-2 text-xs font-bold",
            shift.interest_expressed
              ? "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              : "bg-brand-700 text-white shadow-sm",
          )}
        >
          {shift.interest_expressed ? "Applied" : "View Details"}
        </span>
      </div>
    </button>
  );
}

function FeaturedFacilityCard() {
  return (
    <div className="relative flex h-40 items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 p-8">
      <div>
        <h4 className="text-xl font-extrabold text-white">Premium Shifts Available</h4>
        <p className="mt-2 max-w-[200px] text-sm text-white/80">
          Unlock exclusive roles at Eko Hospitals with Nexus Gold.
        </p>
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-success-300">
          Learn more →
        </p>
      </div>
    </div>
  );
}

/** A single scrollable filter pill. */
function FilterChip({
  active,
  onClick,
  children,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: typeof Filter;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-colors",
        active
          ? "bg-brand-700 text-white"
          : "bg-brand-100 text-ink-700 hover:bg-brand-200 dark:bg-brand-950 dark:text-brand-300 dark:hover:bg-brand-900",
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </button>
  );
}

/** Small toggle pill used inside the filter panels. */
function TogglePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-neutral-200 text-ink-700 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600",
      )}
    >
      {children}
    </button>
  );
}

function FilterPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-900/5 dark:bg-neutral-900 dark:ring-neutral-800">
      {children}
    </div>
  );
}

/** Distance slider — the only filter that re-queries the backend (`radius_km`). */
function DistancePanel({
  radiusKm,
  onCommit,
}: {
  radiusKm: number;
  onCommit: (km: number) => void;
}) {
  const [draft, setDraft] = useState(radiusKm);

  // Keep the slider in sync if the radius is changed elsewhere (e.g. cleared).
  useEffect(() => {
    setDraft(radiusKm);
  }, [radiusKm]);

  return (
    <FilterPanel>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-neutral-400">
          Distance from you
        </p>
        <span className="text-sm font-extrabold text-brand-700 dark:text-brand-400">
          {draft} km
        </span>
      </div>
      <input
        type="range"
        min={MIN_RADIUS_KM}
        max={MAX_RADIUS_KM}
        step={1}
        value={draft}
        onChange={(e) => setDraft(Number(e.target.value))}
        onPointerUp={() => onCommit(draft)}
        onTouchEnd={() => onCommit(draft)}
        onKeyUp={() => onCommit(draft)}
        className="mt-3 w-full accent-brand-700"
        aria-label="Search radius in kilometres"
      />
      <div className="mt-1 flex justify-between text-[10px] font-semibold text-ink-400 dark:text-neutral-500">
        <span>{MIN_RADIUS_KM} km</span>
        <span>{MAX_RADIUS_KM} km</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {RADIUS_PRESETS.map((km) => (
          <TogglePill
            key={km}
            active={draft === km}
            onClick={() => {
              setDraft(km);
              onCommit(km);
            }}
          >
            {km} km
          </TogglePill>
        ))}
      </div>
    </FilterPanel>
  );
}

export function MarketplaceScreen({
  shifts,
  searchTerm,
  onSearchChange,
  onOpenShift,
  onMyApplications,
  isLoading,
  isRefetching = false,
  loadError,
  onRetryLocation,
  radiusKm = DEFAULT_RADIUS_KM,
  onRadiusChange,
}: {
  shifts?: NearbyShiftCard[] | null;
  searchTerm?: string | null;
  onSearchChange: (value: string) => void;
  onOpenShift: (shift: NearbyShiftCard) => void;
  onMyApplications: () => void;
  isLoading: boolean;
  isRefetching?: boolean;
  loadError: string | null;
  onRetryLocation?: () => void;
  radiusKm?: number;
  onRadiusChange?: (km: number) => void;
}) {
  const safeShifts = useMemo(
    () => (Array.isArray(shifts) ? shifts : []),
    [shifts],
  );
  const query = (searchTerm ?? "").trim().toLowerCase();

  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState<string[]>([]);
  const [urgencyFilter, setUrgencyFilter] = useState<string[]>([]);
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("nearest");

  // Specialties actually present in the current results, for the picker.
  const availableSpecialties = useMemo(() => {
    const set = new Set<string>();
    safeShifts.forEach((s) => {
      if (s?.specialty) set.add(s.specialty);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [safeShifts]);

  // Drop any selected specialty that's no longer in the results.
  useEffect(() => {
    setSpecialtyFilter((prev) =>
      prev.filter((s) => availableSpecialties.includes(s)),
    );
  }, [availableSpecialties]);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const moreCount = shiftTypeFilter.length + (sortBy !== "nearest" ? 1 : 0);
  const radiusActive = Math.round(radiusKm) !== DEFAULT_RADIUS_KM;
  const anyActive =
    radiusActive ||
    specialtyFilter.length > 0 ||
    urgencyFilter.length > 0 ||
    moreCount > 0;

  const clearAll = () => {
    setSpecialtyFilter([]);
    setUrgencyFilter([]);
    setShiftTypeFilter([]);
    setSortBy("nearest");
    if (radiusActive) onRadiusChange?.(DEFAULT_RADIUS_KM);
    setOpenPanel(null);
  };

  const filtered = useMemo(() => {
    const rows = safeShifts.filter((shift) => {
      if (!shift) return false;

      if (query) {
        const haystack = [
          shift.hospital_name,
          shift.role_title,
          shift.specialty,
          getPriorityLabel(shift.priority),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (
        specialtyFilter.length > 0 &&
        !(shift.specialty && specialtyFilter.includes(shift.specialty))
      ) {
        return false;
      }

      if (urgencyFilter.length > 0) {
        const p = shift.priority ?? "normal";
        if (!urgencyFilter.includes(p)) return false;
      }

      if (
        shiftTypeFilter.length > 0 &&
        !shiftTypeFilter.includes(shift.shift_type)
      ) {
        return false;
      }

      return true;
    });

    const sorted = [...rows];
    if (sortBy === "nearest") {
      sorted.sort((a, b) => {
        const da = typeof a.distance_km === "number" ? a.distance_km : Infinity;
        const db = typeof b.distance_km === "number" ? b.distance_km : Infinity;
        return da - db;
      });
    } else if (sortBy === "pay") {
      sorted.sort((a, b) => shiftPayoutKobo(b) - shiftPayoutKobo(a));
    } else {
      sorted.sort((a, b) => {
        const ta = new Date(a.scheduled_start ?? 0).getTime() || Infinity;
        const tb = new Date(b.scheduled_start ?? 0).getTime() || Infinity;
        return ta - tb;
      });
    }
    return sorted;
  }, [safeShifts, query, specialtyFilter, urgencyFilter, shiftTypeFilter, sortBy]);

  const cards: ReactNode[] = [];
  filtered.forEach((shift, index) => {
    const shiftId = shift.shift_id || (shift as unknown as Record<string, unknown>).id || index;
    cards.push(<ShiftCard key={String(shiftId)} shift={shift} onOpen={() => onOpenShift(shift)} />);
    if (index === 1 && filtered.length > 2) {
      cards.push(<FeaturedFacilityCard key="featured-facility" />);
    }
  });

  const togglePanel = (panel: Exclude<OpenPanel, null>) =>
    setOpenPanel((cur) => (cur === panel ? null : panel));

  return (
    <main className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-extrabold text-ink-900 dark:text-neutral-50">Shift Marketplace</h1>
        <button
          type="button"
          onClick={onMyApplications}
          className="rounded-lg bg-brand-700 px-3 py-1 text-xs font-bold text-white"
        >
          My Applications
        </button>
      </div>

      <SearchInput
        value={searchTerm ?? ""}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search role, facility or specialty..."
        className="rounded-lg border-transparent bg-brand-input py-3.5 text-ink-900 placeholder:text-ink-700/60 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-500"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          icon={MapPin}
          active={openPanel === "distance" || radiusActive}
          onClick={() => togglePanel("distance")}
        >
          {Math.round(radiusKm)} km
        </FilterChip>
        <FilterChip
          icon={Filter}
          active={openPanel === "specialty" || specialtyFilter.length > 0}
          onClick={() => togglePanel("specialty")}
        >
          Specialty{specialtyFilter.length > 0 ? ` (${specialtyFilter.length})` : ""}
        </FilterChip>
        <FilterChip
          active={openPanel === "urgency" || urgencyFilter.length > 0}
          onClick={() => togglePanel("urgency")}
        >
          Urgency{urgencyFilter.length > 0 ? ` (${urgencyFilter.length})` : ""}
        </FilterChip>
        <FilterChip
          active={openPanel === "more" || moreCount > 0}
          onClick={() => togglePanel("more")}
        >
          More{moreCount > 0 ? ` (${moreCount})` : ""}
        </FilterChip>
        {anyActive && (
          <button
            type="button"
            onClick={clearAll}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold text-ink-500 hover:text-ink-800 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {openPanel === "distance" && (
        <DistancePanel
          radiusKm={radiusKm}
          onCommit={(km) => {
            const clamped = Math.min(
              MAX_RADIUS_KM,
              Math.max(MIN_RADIUS_KM, Math.round(km)),
            );
            if (clamped !== Math.round(radiusKm)) onRadiusChange?.(clamped);
          }}
        />
      )}

      {openPanel === "specialty" && (
        <FilterPanel>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-neutral-400">
            Specialty
          </p>
          {availableSpecialties.length === 0 ? (
            <p className="mt-2 text-xs text-ink-500 dark:text-neutral-500">
              No specialties in the current results.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {availableSpecialties.map((s) => (
                <TogglePill
                  key={s}
                  active={specialtyFilter.includes(s)}
                  onClick={() => setSpecialtyFilter((prev) => toggle(prev, s))}
                >
                  {s}
                </TogglePill>
              ))}
            </div>
          )}
        </FilterPanel>
      )}

      {openPanel === "urgency" && (
        <FilterPanel>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-neutral-400">
            Urgency
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {URGENCY_FILTERS.map((u) => (
              <TogglePill
                key={u.value}
                active={urgencyFilter.includes(u.value)}
                onClick={() => setUrgencyFilter((prev) => toggle(prev, u.value))}
              >
                {u.label}
              </TogglePill>
            ))}
          </div>
        </FilterPanel>
      )}

      {openPanel === "more" && (
        <FilterPanel>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-neutral-400">
            Shift type
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SHIFT_TYPE_FILTERS.map((t) => (
              <TogglePill
                key={t.value}
                active={shiftTypeFilter.includes(t.value)}
                onClick={() => setShiftTypeFilter((prev) => toggle(prev, t.value))}
              >
                {t.label}
              </TogglePill>
            ))}
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-neutral-400">
            Sort by
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SORT_OPTIONS.map((o) => (
              <TogglePill
                key={o.value}
                active={sortBy === o.value}
                onClick={() => setSortBy(o.value)}
              >
                {o.label}
              </TogglePill>
            ))}
          </div>
        </FilterPanel>
      )}

      {loadError && (
        <div className="flex flex-col items-start gap-2 rounded-xl bg-error-50 px-4 py-3.5 text-sm text-error-700 dark:bg-error-950 dark:text-error-300">
          <p>{loadError}</p>
          {onRetryLocation && (
            <button
              type="button"
              onClick={onRetryLocation}
              className="rounded-lg bg-error-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-error-800 transition-colors"
            >
              Share Location / Enable GPS
            </button>
          )}
        </div>
      )}

      {(isLoading || isRefetching) && (
        <p className="text-sm text-ink-500 dark:text-neutral-500">
          {isRefetching && !isLoading ? "Updating results…" : "Loading shifts..."}
        </p>
      )}

      {!isLoading && !isRefetching && !loadError && filtered.length === 0 && (
        <EmptyState
          className="bg-white dark:bg-neutral-900"
          icon={<SearchX className="h-10 w-10 text-brand-300" />}
          title="No shifts match your filters"
          description={
            anyActive || query
              ? "Try widening the distance or clearing some filters to see more roles."
              : "Check back soon — new shifts are posted throughout the day."
          }
        />
      )}

      <div className="space-y-4">{cards}</div>
    </main>
  );
}
