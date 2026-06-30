import { fareConfig } from "../config/fare";
import { EstimateRequestMessage, RouteMetrics } from "../types";

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const haversineDistanceKm = (
  pickupLatitude: number,
  pickupLongitude: number,
  dropoffLatitude: number,
  dropoffLongitude: number,
): number => {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(dropoffLatitude - pickupLatitude);
  const longitudeDelta = toRadians(dropoffLongitude - pickupLongitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(pickupLatitude)) *
      Math.cos(toRadians(dropoffLatitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const fallbackMetrics = (
  payload: EstimateRequestMessage,
  reason: string,
): RouteMetrics => {
  const straightDistanceKm = haversineDistanceKm(
    payload.pickup_latitude,
    payload.pickup_longitude,
    payload.dropoff_latitude,
    payload.dropoff_longitude,
  );
  const adjustedDistanceKm = Math.max(straightDistanceKm * 1.2, 0.5);
  const durationMinutes = Math.max(
    (adjustedDistanceKm / fareConfig.fallbackAverageSpeedKph) * 60,
    3,
  );

  console.warn(`Using fallback route metrics: ${reason}`);

  return {
    distanceKm: adjustedDistanceKm,
    durationMinutes,
    source: "fallback",
  };
};

export const getRouteMetrics = async (
  payload: EstimateRequestMessage,
): Promise<RouteMetrics> => {
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!googleMapsApiKey) {
    return fallbackMetrics(payload, "GOOGLE_MAPS_API_KEY is missing");
  }

  const origin = `${payload.pickup_latitude},${payload.pickup_longitude}`;
  const destination = `${payload.dropoff_latitude},${payload.dropoff_longitude}`;
  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("key", googleMapsApiKey);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      return fallbackMetrics(
        payload,
        `Directions API returned ${response.status}`,
      );
    }

    const json = await response.json();
    const leg = json.routes?.[0]?.legs?.[0];
    if (!leg?.distance?.value || !leg?.duration?.value) {
      return fallbackMetrics(
        payload,
        "Directions API returned no usable route",
      );
    }

    return {
      distanceKm: leg.distance.value / 1000,
      durationMinutes: leg.duration.value / 60,
      source: "google",
    };
  } catch (error) {
    return fallbackMetrics(
      payload,
      error instanceof Error ? error.message : "Unknown fetch error",
    );
  }
};
