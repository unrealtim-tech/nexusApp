import type { RouteObject } from "react-router-dom";
import { DashboardOverview } from "@/features/hospital/components/DashboardOverview";
import { PatientList } from "@/features/patient/components/PatientList";
import { DoctorList } from "@/features/hospital/components/DoctorList";
import { AppointmentList } from "@/features/hospital/components/AppointmentList";
import { AnalyticsPage } from "@/shared/analytics/components/AnalyticsPage";
import { SettingsPage } from "@/shared/settings/components/SettingsPage";
import { HelpPage } from "@/shared/help/components/HelpPage";
import { CreateShiftPage } from "@/features/hospital/shifts/components/CreateShiftPage";

export const hospitalPageRoutes: RouteObject[] = [
  { path: "dashboard", element: <DashboardOverview /> },
  { path: "patients", element: <PatientList /> },
  { path: "doctors", element: <DoctorList /> },
  { path: "appointments", element: <AppointmentList /> },
  { path: "analytics", element: <AnalyticsPage /> },
  { path: "settings", element: <SettingsPage /> },
  { path: "help", element: <HelpPage /> },
];

export const hospitalStandaloneRoutes: RouteObject[] = [
  { path: "shifts/create", element: <CreateShiftPage /> },
];
