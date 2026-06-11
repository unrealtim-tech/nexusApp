import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import {
  EmailLogin,
  OtpVerify,
  RoleSelection,
  PublicRoute,
} from "@/features/auth/components";
import {
  ProfessionalProfile,
  PayoutSetup,
} from "@/features/onboarding/components";
import { WaitlistLandingStep } from "@/features/waitlist/components/WaitlistLandingStep";
import { WaitlistSuccessStep } from "@/features/waitlist/components/WaitlistSuccessStep";
import { LandingPage } from "@/pages/landing";

export const authRoutes: RouteObject[] = [
  {
    path: "auth",
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      {
        path: "login",
        element: (
          <PublicRoute>
            <EmailLogin />
          </PublicRoute>
        ),
      },
      {
        path: "verify-otp",
        element: (
          <PublicRoute>
            <OtpVerify />
          </PublicRoute>
        ),
      },
      {
        path: "role-selection",
        element: (
          <PublicRoute>
            <RoleSelection />
          </PublicRoute>
        ),
      },
      {
        path: "onboarding",
        children: [
          {
            index: true,
            element: <Navigate to="professional-profile" replace />,
          },
          {
            path: "professional-profile",
            element: (
              <PublicRoute>
                <ProfessionalProfile />
              </PublicRoute>
            ),
          },
          {
            path: "payout-setup",
            element: (
              <PublicRoute>
                <PayoutSetup />
              </PublicRoute>
            ),
          },
          {
            path: "*",
            element: <Navigate to="professional-profile" replace />,
          },
        ],
      },
      { path: "*", element: <Navigate to="login" replace /> },
    ],
  },
  {
    path: "/",
    element: <LandingPage />,
    children: [
      { index: true, element: <WaitlistLandingStep /> },
      { path: "success", element: <WaitlistSuccessStep /> },
    ],
  },
];

