import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import type { RouteObject } from "react-router-dom";
import { HospitalRegistrationStep } from "@/shared/onboarding/components/HospitalRegistrationStep";
import { LocationGeofencingStep } from "@/shared/onboarding/components/LocationGeofencingStep";
import { FinancialSetupStep } from "@/shared/onboarding/components/FinancialSetupStep";
import { VerificationStatusStep } from "@/shared/onboarding/components/VerificationStatusStep";
import { AccreditationGrantedStep } from "@/shared/onboarding/components/AccreditationGrantedStep";
import { ProfessionalProfile } from "@/features/onboarding/components/ProfessionalProfile";
import { PayoutSetup } from "@/features/onboarding/components/PayoutSetup";
import type { AppProfile } from "@/types";
import { VerificationPendingStep } from "@/shared/onboarding/components/VerificationPendingStep";

type OnboardingSlug =
  | "registration"
  | "location-geofencing"
  | "financial-setup"
  | "verification-status"
  | "verification-pending"
  | "accreditation-granted"
  | "professional-profile"
  | "payout-setup";

interface OnboardingStepConfig {
  slug: OnboardingSlug;
  element: ReactElement;
}

const profileOnboardingSteps: Record<AppProfile, OnboardingStepConfig[]> = {
  hospital: [
    { slug: "registration", element: <HospitalRegistrationStep /> },
    { slug: "location-geofencing", element: <LocationGeofencingStep /> },
    { slug: "financial-setup", element: <FinancialSetupStep /> },
    { slug: "verification-status", element: <VerificationStatusStep /> },
    { slug: "accreditation-granted", element: <AccreditationGrantedStep /> },
  ],
  "medical-staff": [
    { slug: "professional-profile", element: <ProfessionalProfile /> },
    { slug: "payout-setup", element: <PayoutSetup /> },
    { slug: "verification-pending", element: <VerificationPendingStep /> },
    { slug: "accreditation-granted", element: <AccreditationGrantedStep /> },
  ],
  patient: [
    { slug: "accreditation-granted", element: <AccreditationGrantedStep /> },
  ],
};

export function buildOnboardingRoutes(profile: AppProfile): RouteObject[] {
  const steps = profileOnboardingSteps[profile];
  const firstSlug = steps[0].slug;

  return [
    { path: "onboarding", element: <Navigate to={firstSlug} replace /> },

    ...steps.map(({ slug, element }) => ({
      path: `onboarding/${slug}`,
      element,
    })),
  ];
}
