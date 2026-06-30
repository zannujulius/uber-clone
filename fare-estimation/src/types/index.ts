export interface EstimateRequestMessage {
  riderId: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  pickup_address?: string;
  dropoff_address?: string;
  timestamp: number;
}

export interface TripRequestMessage extends EstimateRequestMessage {
  estimate_id?: string;
  estimated_fare?: number;
  currency?: string;
  distance_km?: number;
  duration_minutes?: number;
}

export interface RouteMetrics {
  distanceKm: number;
  durationMinutes: number;
  source: "google" | "fallback";
}

export interface FareBreakdown {
  baseFare: number;
  timeRate: number;
  distanceRate: number;
  surgeMultiplier: number;
  currency: string;
  durationMinutes: number;
  distanceKm: number;
  estimatedFare: number;
}

export interface FareEstimateReadyPayload extends Record<string, unknown> {
  estimate_id: string;
  amount: number;
  currency: string;
  base_fare: number;
  distance_km: number;
  duration_minutes: number;
  distance_rate: number;
  time_rate: number;
  surge_multiplier: number;
  route_source: "google" | "fallback";
  pickup_address?: string;
  dropoff_address?: string;
}
