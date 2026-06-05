import { create } from "zustand";
import { persist } from "zustand/middleware";

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
}

interface HospitalLocationData {
  streetAddress: string;
  city: string;
  state: string;
  geofenceRadius: number;
  latitude: string;
  longitude: string;
}

interface HospitalFinancialData {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

interface HospitalOnboardingState {
  registrationData: HospitalRegistrationData;
  locationData: HospitalLocationData;
  financialData: HospitalFinancialData;
  setRegistrationData: (data: Partial<HospitalRegistrationData>) => void;
  setLocationData: (data: Partial<HospitalLocationData>) => void;
  setFinancialData: (data: Partial<HospitalFinancialData>) => void;
  resetHospitalOnboarding: () => void;
}

const initialRegistrationData: HospitalRegistrationData = {
  hospitalName: "",
  facilityType: "Private Facility",
  yearEstablished: "",
  facilityLogoFileName: "",
  registrationNumber: "",
  aboutHospital: "",
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

export const useHospitalOnboardingStore = create<HospitalOnboardingState>()(
  persist(
    (set) => ({
      registrationData: initialRegistrationData,
      locationData: initialLocationData,
      financialData: initialFinancialData,
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
      resetHospitalOnboarding: () =>
        set({
          registrationData: initialRegistrationData,
          locationData: initialLocationData,
          financialData: initialFinancialData,
        }),
    }),
    { name: "hospital-onboarding" },
  ),
);
