import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Sub-state interfaces ──────────────────────────────────────────────────

interface HospitalRegistrationData {
  hospitalName: string;
  facilityType:
    | "Private Facility"
    | "Public Hospital"
    | "Clinic"
    | "Specialty Center";
  yearEstablished: string;
  facilityLogoFileName?: string;
  registrationNumber: string;
  aboutHospital: string;
  postalCode?: string;
  email: string;
}

interface HospitalLocationData {
  streetAddress: string;
  city: string;
  state: string;
  geofenceRadius: number;
  latitude?: string;
  longitude?: string;
}

interface HospitalFinancialData {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

/** Data returned from the registration API — replaces hospitalOnboardingResponse in localStorage */
interface HospitalSubmissionResponse {
  hospitalId: string;
  status: string;
  message: string;
  submittedAt: string;
}

// ─── Store interface ───────────────────────────────────────────────────────

interface HospitalOnboardingState {
  // Step data (cleared after onboarding lifecycle ends)
  registrationData: HospitalRegistrationData;
  locationData: HospitalLocationData;
  financialData: HospitalFinancialData;

  // Setup state for hospital dashboard (persisted beyond onboarding)
  locationSet: boolean;
  paymentSet: boolean;
  coordinates: { lat: number; lng: number } | null;

  // Registration result (persisted beyond onboarding lifecycle)
  isSubmitted: boolean;
  submissionResponse: HospitalSubmissionResponse | null;

  // Setters for step data
  setRegistrationData: (data: Partial<HospitalRegistrationData>) => void;
  setLocationData: (data: Partial<HospitalLocationData>) => void;
  setFinancialData: (data: Partial<HospitalFinancialData>) => void;

  /** Called on successful API registration — stores response and marks submitted */
  setSubmissionResponse: (response: HospitalSubmissionResponse) => void;

  /** Lightweight toggle — marks the hospital as submitted without a full response object */
  setIsSubmitted: (value: boolean) => void;

  /**
   * Called when the user navigates to the dashboard after onboarding.
   * Clears all intermediate step data but preserves isSubmitted + submissionResponse
   * (specifically hospitalId which the dashboard still needs).
   */
  clearOnboardingData: () => void;

  /** Full reset — clears everything including submission state */
  resetHospitalOnboarding: () => void;

  /** Setup state setters */
  setLocationDone: (coords: { lat: number; lng: number }) => void;
  setPaymentDone: () => void;
}

// ─── Initial values ────────────────────────────────────────────────────────

const initialRegistrationData: HospitalRegistrationData = {
  hospitalName: "",
  facilityType: "Private Facility",
  yearEstablished: "",
  facilityLogoFileName: "",
  registrationNumber: "",
  aboutHospital: "",
  postalCode: "",
  email: "",
};

const initialLocationData: HospitalLocationData = {
  streetAddress: "",
  city: "",
  state: "",
  geofenceRadius: 500,
  latitude: "",
  longitude: "",
};

const initialFinancialData: HospitalFinancialData = {
  bankCode: "",
  accountNumber: "",
  accountName: "",
};

// ─── Store ─────────────────────────────────────────────────────────────────

export const useHospitalOnboardingStore = create<HospitalOnboardingState>()(
  persist(
    (set) => ({
      registrationData: initialRegistrationData,
      locationData: initialLocationData,
      financialData: initialFinancialData,
      isSubmitted: false,
      submissionResponse: null,
      locationSet: false,
      paymentSet: false,
      coordinates: null,

      setRegistrationData: (data) =>
        set((state) => ({
          registrationData: { ...state.registrationData, ...data },
        })),

      setLocationData: (data) =>
        set((state) => ({
          locationData: { ...state.locationData, ...data },
        })),

      setFinancialData: (data) =>
        set((state) => ({
          financialData: { ...state.financialData, ...data },
        })),

      setSubmissionResponse: (response) =>
        set({
          isSubmitted: true,
          submissionResponse: response,
        }),

      setIsSubmitted: (value) => set({ isSubmitted: value }),

      clearOnboardingData: () =>
        set((state) => ({
          // Wipe all intermediate step data
          registrationData: initialRegistrationData,
          locationData: initialLocationData,
          financialData: initialFinancialData,
          // Keep submission state — dashboard needs hospitalId
          isSubmitted: state.isSubmitted,
          submissionResponse: state.submissionResponse,
        })),

      resetHospitalOnboarding: () =>
        set({
          registrationData: initialRegistrationData,
          locationData: initialLocationData,
          financialData: initialFinancialData,
          isSubmitted: false,
          submissionResponse: null,
          locationSet: false,
          paymentSet: false,
          coordinates: null,
        }),

      setLocationDone: (coords) =>
        set({ locationSet: true, coordinates: coords }),

      setPaymentDone: () => set({ paymentSet: true }),
    }),
    { name: "hospital-onboarding" },
  ),
);
