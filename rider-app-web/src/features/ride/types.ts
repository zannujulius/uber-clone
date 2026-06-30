export interface LatLng { lat: number; lng: number }

export interface Place {
  address: string;
  lat: number;
  lng: number;
}

export interface FareEstimate {
  estimateId: string | null;
  amount: number;
  currency: string;
  baseFare: number;
  distanceKm: number;
  durationMinutes: number;
  distanceRate: number;
  timeRate: number;
  surgeMultiplier: number;
  routeSource: "google" | "fallback";
}

export type PersistedTripStatus =
  | 'Requested'
  | 'Accepted'
  | 'In_Progress'
  | 'Completed'
  | 'Cancelled';
export type TripStatus = 'idle' | 'searching' | 'driver_assigned' | 'in_progress' | 'completed' | 'cancelled';
export type FareEstimateStatus = 'idle' | 'pending' | 'ready' | 'error';

export interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  eta_minutes?: number;
}

export interface RideState {
  pickup:  Place | null;
  dropoff: Place | null;
  status:  TripStatus;
  persistedTripStatus: PersistedTripStatus | null;
  fareEstimate: FareEstimate | null;
  fareEstimateStatus: FareEstimateStatus;
  fareEstimateError: string | null;
  tripId:  string | null;
  driver:  Driver | null;
}
