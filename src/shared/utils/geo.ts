// ── Geo helpers ──────────────────────────────────────────────────────────────
//
// Mirrors nexus-backend's `utils::geo::haversine_km`. Used client-side to
// pre-check a worker's clock-in distance before hitting the API and to sort
// the hospital's workforce by proximity.

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lng points, in kilometres. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Maximum distance (km) a worker may be from the hospital when clocking in.
 * The backend geofence is per-hospital (`clock_in_radius_meters`); the hospital
 * app sets that to 10 km on location confirmation, and the worker app enforces
 * the same 10 km as a pre-flight check so an out-of-range worker gets an
 * instant, clear message instead of a generic 409.
 */
export const CLOCK_IN_MAX_KM = 10;

/** `clock_in_radius_meters` the hospital app writes so the backend agrees. */
export const CLOCK_IN_RADIUS_METERS = CLOCK_IN_MAX_KM * 1000;
