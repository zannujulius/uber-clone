type TraceData = Record<string, unknown>;

const clean = (data: TraceData): TraceData =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );

export const trace = (step: string, data: TraceData): void => {
  console.log(`[trace][rider-ws] ${step}`, clean(data));
};

export const summarizeRidePayload = (
  data: Record<string, unknown>,
): TraceData => ({
  pickup: `${data.pickup_latitude},${data.pickup_longitude}`,
  dropoff: `${data.dropoff_latitude},${data.dropoff_longitude}`,
  estimate_id: data.estimate_id,
  trip_id: data.trip_id,
});
