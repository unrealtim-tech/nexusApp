import { Bell, HelpCircle } from "lucide-react";
import { NexusCareLogo } from "@/shared/components/ui/NexusCareLogo";

export function OnboardingNavbar() {
  return (
    <nav className="bg-white/95 border-b border-neutral-200 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NexusCareLogo size="md" />

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-onboarding-fadedGreen text-onboarding-primaryBlue shadow-sm transition hover:bg-onboarding-primaryBlue/10"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Help"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-onboarding-fadedGreen text-onboarding-primaryBlue shadow-sm transition hover:bg-onboarding-primaryBlue/10"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-onboarding-primaryBlue text-sm font-semibold text-white shadow-sm">
            A
          </div>
        </div>
      </div>
    </nav>
  );
}
