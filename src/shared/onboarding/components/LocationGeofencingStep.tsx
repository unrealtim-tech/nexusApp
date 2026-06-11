import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Globe2, Compass } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { useHospitalOnboardingStore } from "@/features/onboarding/hooks/useHospitalOnboardingStore";
import {
  hospitalLocationSchema,
  type HospitalLocationFormData,
} from "@/features/onboarding/schemas/onboardingSchemas";
import { HospitalOnboardingShell } from "./HospitalOnboardingShell";
import { useRoleBasePath } from "@/shared/onboarding/hooks/useRoleBasePath";

export function LocationGeofencingStep() {
  const navigate = useNavigate();
  const basePath = useRoleBasePath();
  const { locationData, setLocationData } = useHospitalOnboardingStore();
  const [locationStatus, setLocationStatus] = useState<string>(
    "Ready to verify GPS coordinates",
  );
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HospitalLocationFormData>({
    resolver: zodResolver(hospitalLocationSchema),
    defaultValues: locationData,
  });

  const { streetAddress, city, state, geofenceRadius, latitude, longitude } =
    watch();

  useEffect(() => {
    if (locationData.latitude && locationData.longitude) {
      setLocationStatus("GPS coordinates saved successfully.");
    }
  }, [locationData.latitude, locationData.longitude]);

  const verifyCoordinates = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is unavailable in this browser.");
      return;
    }

    setIsVerifying(true);
    setLocationStatus("Acquiring GPS lock…");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        setValue("latitude", lat, { shouldValidate: true });
        setValue("longitude", lon, { shouldValidate: true });
        setLocationStatus("GPS coordinates locked in.");
        setIsVerifying(false);
      },
      () => {
        setLocationStatus("Unable to access GPS. Please check permissions.");
        setIsVerifying(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const onSubmit: SubmitHandler<HospitalLocationFormData> = (data) => {
    setLocationData(data);
    navigate(`${basePath}/onboarding/financial-setup`);
  };

  return (
    <HospitalOnboardingShell
      activeStep={1}
      title="Location & Geofencing"
      subtitle="Define the precise geofence for your facility so clinicians can clock in only from approved locations."
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6 rounded-[32px] border border-white bg-white p-8 shadow-soft">
          <div className="rounded-3xl bg-onboarding-fadedGreen p-5">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-2xl bg-onboarding-primaryBlue/10 p-3 text-onboarding-primaryBlue">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-onboarding-textPrimary">
                  Why Geofencing Matters
                </p>
                <p className="mt-2 text-sm text-onboarding-textSecondary leading-relaxed">
                  Clinicians must be within this boundary when clocking in
                  through the NexusCare app. This prevents location fraud and
                  ensures clock-ins are registered only on-site.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 rounded-3xl bg-onboarding-inputBackground p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                  Street Address
                </label>
                <input
                  type="text"
                  {...register("streetAddress")}
                  className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-onboarding-textPrimary outline-none transition focus:border-onboarding-primaryBlue focus:ring-2 focus:ring-onboarding-primaryBlue/10"
                  placeholder="14 Broad Street, Victoria Island"
                />
                {errors.streetAddress && (
                  <p className="mt-2 text-xs text-red-600">
                    {errors.streetAddress.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                    City
                  </label>
                  <input
                    type="text"
                    {...register("city")}
                    className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-onboarding-textPrimary outline-none transition focus:border-onboarding-primaryBlue focus:ring-2 focus:ring-onboarding-primaryBlue/10"
                    placeholder="Lagos"
                  />
                  {errors.city && (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                    State
                  </label>
                  <input
                    type="text"
                    {...register("state")}
                    className="w-full rounded-2xl border border-transparent bg-white px-4 py-3 text-sm text-onboarding-textPrimary outline-none transition focus:border-onboarding-primaryBlue focus:ring-2 focus:ring-onboarding-primaryBlue/10"
                    placeholder="Lagos"
                  />
                  {errors.state && (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.state.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-neutral-600">
                    Geofence Radius
                  </label>
                  <span className="text-sm font-semibold text-onboarding-textPrimary">
                    {geofenceRadius ?? 500} meters
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={100}
                  {...register("geofenceRadius", { valueAsNumber: true })}
                  className="w-full cursor-pointer accent-onboarding-primaryBlue"
                />
                {errors.geofenceRadius && (
                  <p className="text-xs text-red-600">
                    {errors.geofenceRadius.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Compass className="h-5 w-5 text-onboarding-primaryBlue" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-onboarding-textPrimary">
                        GPS Coordinates
                      </p>
                      <span className="rounded-full bg-onboarding-primaryBlue/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-onboarding-primaryBlue">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-onboarding-textSecondary">
                      Verify coordinates now or skip — you can always add them later.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-onboarding-inputBackground p-4">
                    <p className="text-[11px] uppercase tracking-widest text-neutral-500">
                      Latitude
                    </p>
                    <p className="mt-2 text-sm text-onboarding-textPrimary">
                      {latitude || "Not verified yet"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-onboarding-inputBackground p-4">
                    <p className="text-[11px] uppercase tracking-widest text-neutral-500">
                      Longitude
                    </p>
                    <p className="mt-2 text-sm text-onboarding-textPrimary">
                      {longitude || "Not verified yet"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={verifyCoordinates}
                    disabled={isVerifying}
                    isLoading={isVerifying}
                    className="w-full rounded-2xl bg-gradient-to-r from-onboarding-primaryGreen to-onboarding-primaryBlue py-3 text-sm font-semibold text-white"
                  >
                    Verify GPS Coordinates
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-white text-onboarding-primaryBlue ring-1 ring-onboarding-primaryBlue/15 py-3 text-sm font-semibold hover:bg-onboarding-primaryBlue/5"
                  >
                    Confirm Location
                  </Button>
                </div>
                <p className="text-xs text-onboarding-textSecondary">
                  {locationStatus}
                </p>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6 rounded-[32px] border border-white bg-white p-6 shadow-soft">
          <div className="rounded-3xl bg-onboarding-fadedGreen p-5">
            <div className="flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-onboarding-primaryBlue" />
              <div>
                <p className="text-sm font-semibold text-onboarding-textPrimary">
                  Facility Coordinates
                </p>
                <p className="text-xs text-onboarding-textSecondary">
                  Your selected point is used to generate the clock-in geofence
                  for clinical staff.
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50 p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(26,88,136,0.08),_transparent_55%)]" />
            <div className="relative h-[360px] rounded-[28px] border border-neutral-200 bg-[linear-gradient(180deg,_rgba(234,243,255,0.95),_rgba(248,250,252,0.95))] p-4">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-onboarding-primaryBlue/40" />
              <div className="absolute left-4 top-4 rounded-2xl bg-white/90 px-3 py-2 text-xs font-semibold text-onboarding-textPrimary shadow-sm">
                {city || "Lagos"}, {state || "Lagos"}
              </div>
              <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 p-3 text-sm text-neutral-600 shadow-sm">
                <p>{latitude ? `Lat ${latitude}` : "Lat —"}</p>
                <p>{longitude ? `Lng ${longitude}` : "Lng —"}</p>
              </div>
              <div className="absolute bottom-4 right-4 rounded-2xl bg-onboarding-primaryBlue px-3 py-2 text-xs font-semibold text-white">
                {geofenceRadius ?? 500}m radius
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-onboarding-inputBackground p-5 text-sm text-onboarding-textSecondary">
            <p className="font-semibold text-onboarding-textPrimary">
              Current Center
            </p>
            <p className="mt-2">
              {streetAddress || "14 Broad Street, Victoria Island"}
            </p>
          </div>
        </div>
      </div>
    </HospitalOnboardingShell>
  );
}
