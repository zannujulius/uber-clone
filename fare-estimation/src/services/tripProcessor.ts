import { randomUUID } from "crypto";
import { publishNotification } from "../kafka/producer";
import { FareModel } from "../models/Fare";
import { TripModel, TRIP_STATUS } from "../models/Trip";
import { TripRequestMessage } from "../types";
import { trace } from "../utils/trace";

export const processTripRequest = async (
  payload: TripRequestMessage,
): Promise<void> => {
  try {
    trace("trip_request.started", {
      riderId: payload.riderId,
      estimate_id: payload.estimate_id,
      pickup: `${payload.pickup_latitude},${payload.pickup_longitude}`,
      dropoff: `${payload.dropoff_latitude},${payload.dropoff_longitude}`,
    });
    let fareId = payload.estimate_id ?? null;

    if (fareId) {
      const fare = await FareModel.findByPk(fareId);
      if (!fare) fareId = null;
    }

    if (!fareId) {
      const fallbackFare = await FareModel.create({
        id: randomUUID(),
        base_fare: Number(payload.estimated_fare ?? 0),
        distance: Number(payload.distance_km ?? 0),
        duration: Number(payload.duration_minutes ?? 0),
        surge_multiplier: 1,
        currency: payload.currency || "RWF",
      });
      fareId = fallbackFare.id;
      trace("trip_request.fallback_fare_created", {
        riderId: payload.riderId,
        fare_id: fareId,
      });
    }

    const tripId = randomUUID();
    const requestedAt = new Date(payload.timestamp || Date.now());

    await TripModel.create({
      id: tripId,
      rider_id: payload.riderId,
      fare_id: fareId,
      status: TRIP_STATUS.REQUESTED,
      requested_at: requestedAt,
      pickup_latitude: payload.pickup_latitude,
      pickup_longitude: payload.pickup_longitude,
      dropoff_latitude: payload.dropoff_latitude,
      dropoff_longitude: payload.dropoff_longitude,
      pickup_address: payload.pickup_address ?? null,
      dropoff_address: payload.dropoff_address ?? null,
    });
    trace("trip_request.persisted", {
      riderId: payload.riderId,
      trip_id: tripId,
      fare_id: fareId,
      status: TRIP_STATUS.REQUESTED,
    });

    await publishNotification(payload.riderId, "trip:created", {
      trip_id: tripId,
      fare_id: fareId,
      status: TRIP_STATUS.REQUESTED,
      requested_at: requestedAt.toISOString(),
      pickup_address: payload.pickup_address,
      dropoff_address: payload.dropoff_address,
    });
  } catch (error) {
    console.error("Trip creation failed:", error);
    trace("trip_request.failed", { riderId: payload.riderId });
    await publishNotification(payload.riderId, "trip:request:failed", {
      message: "Unable to create trip right now",
    });
  }
};
