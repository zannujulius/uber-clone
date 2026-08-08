import { randomUUID } from "crypto";
import { FareModel } from "../models/Fare";
import { publishNotification } from "../kafka/producer";
import { calculateFare } from "./fareCalculator";
import { getRouteMetrics } from "./routeMetrics";
import { EstimateRequestMessage, FareEstimateReadyPayload } from "../types";
import { trace } from "../utils/trace";

export const processEstimateRequest = async (
  payload: EstimateRequestMessage,
): Promise<void> => {
  try {
    trace("estimate.started", {
      riderId: payload.riderId,
      pickup: `${payload.pickup_latitude},${payload.pickup_longitude}`,
      dropoff: `${payload.dropoff_latitude},${payload.dropoff_longitude}`,
    });
    const routeMetrics = await getRouteMetrics(payload);
    console.log("Route metrics:", routeMetrics);
    const fare = calculateFare(
      routeMetrics.durationMinutes,
      routeMetrics.distanceKm,
    );

    const estimateId = randomUUID();

    await FareModel.create({
      id: estimateId,
      base_fare: fare.baseFare,
      distance: fare.distanceKm,
      duration: fare.durationMinutes,
      surge_multiplier: fare.surgeMultiplier,
      currency: fare.currency,
    });
    trace("estimate.persisted", {
      riderId: payload.riderId,
      estimate_id: estimateId,
      distance_km: fare.distanceKm,
      duration_minutes: fare.durationMinutes,
      amount: fare.estimatedFare,
      route_source: routeMetrics.source,
    });

    const estimatePayload: FareEstimateReadyPayload = {
      estimate_id: estimateId,
      amount: fare.estimatedFare,
      currency: fare.currency,
      base_fare: fare.baseFare,
      distance_km: fare.distanceKm,
      duration_minutes: fare.durationMinutes,
      distance_rate: fare.distanceRate,
      time_rate: fare.timeRate,
      surge_multiplier: fare.surgeMultiplier,
      route_source: routeMetrics.source,
      pickup_address: payload.pickup_address,
      dropoff_address: payload.dropoff_address,
    };

    await publishNotification(
      payload.riderId,
      "trip:estimate:ready",
      estimatePayload,
    );
  } catch (error) {
    console.error("Fare estimation failed:", error);
    trace("estimate.failed", { riderId: payload.riderId });
    await publishNotification(payload.riderId, "trip:estimate:failed", {
      message: "Unable to estimate fare right now",
    });
  }
};
