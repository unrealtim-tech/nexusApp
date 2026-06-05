import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  Building,
  CreditCard,
  HelpCircle,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { NexusCareLogo } from "@/shared/components/ui/NexusCareLogo";
import { useRoleBasePath } from "@/shared/onboarding/hooks/useRoleBasePath";
import { cn } from "@/shared/utils/cn";

interface OnboardingStepItem {
  slug: string;
  title: string;
  description: string;
  icon: typeof Building;
}

const ONBOARDING_STEPS: OnboardingStepItem[] = [
  {
    slug: "registration",
    title: "Hospital Details",
    description: "Facility identity and official registration.",
    icon: Building,
  },
  {
    slug: "location-geofencing",
    title: "Location & Geofencing",
    description: "Define your facility boundary for clock-in verification.",
    icon: MapPin,
  },
  {
    slug: "financial-setup",
    title: "Financial Setup",
    description: "Connect a secure settlement account for payouts.",
    icon: CreditCard,
  },
  {
    slug: "verification-status",
    title: "Verification Status",
    description: "Track application review and approval progress.",
    icon: ShieldCheck,
  },
];

interface HospitalOnboardingShellProps {
  children: ReactNode;
  activeStep: number;
  title: string;
  subtitle: string;
}

export function HospitalOnboardingShell({
  children,
  activeStep,
  title,
  subtitle,
}: HospitalOnboardingShellProps) {
  const basePath = useRoleBasePath();
  const onboardingBase = `${basePath}/onboarding`;

  return (
    <div className="min-h-screen bg-onboarding-mainBackground">
      <div className="border-b border-white/80 bg-white/80 shadow-sm">
        <HospitalNavbarWrapper />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex min-h-[calc(100vh-96px)] flex-col rounded-[32px] border border-white bg-white/95 p-6 shadow-soft">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-onboarding-primaryBlue/70">
                Registration
              </p>
              <h2 className="mt-4 text-2xl font-bold text-onboarding-textPrimary">
                Hospital Onboarding
              </h2>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl bg-onboarding-fadedGreen p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-onboarding-primaryBlue/80">
                  Step {activeStep + 1} of {ONBOARDING_STEPS.length}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EAF3FF]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue"
                    style={{
                      width: `${((activeStep + 1) / ONBOARDING_STEPS.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <nav className="space-y-2">
                {ONBOARDING_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <NavLink
                      key={step.slug}
                      to={`${onboardingBase}/${step.slug}`}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-start gap-4 rounded-2xl border p-4 transition",
                          isActive
                            ? "border-onboarding-primaryBlue bg-onboarding-fadedGreen shadow-sm"
                            : "border-neutral-200 bg-white hover:border-onboarding-primaryBlue/50",
                        )
                      }
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl",
                          activeStep === index
                            ? "bg-onboarding-primaryBlue text-white"
                            : "bg-onboarding-primaryBlue/10 text-onboarding-primaryBlue",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-onboarding-textPrimary">
                          {step.title}
                        </p>
                        <p className="mt-1 text-xs text-onboarding-textSecondary">
                          {step.description}
                        </p>
                      </div>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto space-y-4 pt-6">
              <div className="rounded-2xl bg-onboarding-fadedGreen p-4">
                <p className="text-sm font-semibold text-onboarding-textPrimary">
                  Support
                </p>
                <p className="mt-1 text-xs text-onboarding-textSecondary">
                  Reach out if you need help completing the hospital onboarding
                  steps.
                </p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-onboarding-textSecondary">
                <button className="text-left font-medium text-onboarding-primaryBlue hover:text-onboarding-primaryGreen">
                  Help Center
                </button>
                <button className="text-left font-medium text-onboarding-primaryBlue hover:text-onboarding-primaryGreen">
                  Onboarding guide
                </button>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="rounded-[32px] border border-white bg-white/95 p-8 shadow-soft">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-onboarding-primaryBlue/80">
                  Step {activeStep + 1} of {ONBOARDING_STEPS.length}
                </p>
                <h1 className="mt-3 text-3xl font-bold text-onboarding-textPrimary">
                  {title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-onboarding-textSecondary">
                  {subtitle}
                </p>
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function HospitalNavbarWrapper() {
  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
      <NexusCareLogo />

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-onboarding-textSecondary shadow-sm ring-1 ring-neutral-200 transition hover:bg-onboarding-fadedGreen"
          aria-label="Notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z"
            />
          </svg>
        </button>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-onboarding-textSecondary shadow-sm ring-1 ring-neutral-200 transition hover:bg-onboarding-fadedGreen"
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-onboarding-primaryBlue text-white shadow-sm font-semibold">
          A
        </div>
      </div>
    </div>
  );
}
