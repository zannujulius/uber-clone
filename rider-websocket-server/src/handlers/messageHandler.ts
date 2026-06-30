import WebSocket from "ws";
import { publishEvent } from "../kafka/producer";
import { WsMessage } from "../types";
import { summarizeRidePayload, trace } from "../utils/trace";

const send = (ws: WebSocket, event: string, data: unknown): void => {
  ws.send(JSON.stringify({ event, data }));
};

const sendError = (ws: WebSocket, message: string): void => {
  send(ws, "error", { message });
};

const hasValidCoordinates = (data: Record<string, unknown>): boolean =>
  [
    data.pickup_latitude,
    data.pickup_longitude,
    data.dropoff_latitude,
    data.dropoff_longitude,
  ].every((value) => typeof value === "number" && Number.isFinite(value));

export const handleMessage = async (
  ws: WebSocket,
  riderId: string,
  raw: string,
): Promise<void> => {
  let parsed: WsMessage;

  try {
    parsed = JSON.parse(raw);
  } catch {
    sendError(ws, "Invalid JSON");
    return;
  }

  const { event, data } = parsed;
  trace("ws.message.received", {
    riderId,
    event,
    ...summarizeRidePayload(data),
  });

  switch (event) {
    case "trip:estimate": {
      if (!hasValidCoordinates(data as Record<string, unknown>)) {
        sendError(
          ws,
          "Missing location fields: pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude",
        );
        return;
      }

      try {
        await publishEvent("rider.trip.estimate.requested", riderId, {
          riderId,
          ...(data as Record<string, unknown>),
          timestamp: Date.now(),
        });
        trace("kafka.estimate_request.published", {
          riderId,
          topic: "rider.trip.estimate.requested",
          ...summarizeRidePayload(data),
        });
        send(ws, "trip:estimate:received", {
          message: "Fare estimation is being processed",
        });
      } catch {
        sendError(ws, "Failed to request fare estimate, please retry");
      }
      break;
    }

    case "trip:request": {
      if (!hasValidCoordinates(data as Record<string, unknown>)) {
        sendError(
          ws,
          "Missing location fields: pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude",
        );
        return;
      }
      try {
        await publishEvent("rider.trip.requested", riderId, {
          riderId,
          ...(data as Record<string, unknown>),
          timestamp: Date.now(),
        });
        trace("kafka.trip_request.published", {
          riderId,
          topic: "rider.trip.requested",
          ...summarizeRidePayload(data),
        });
        send(ws, "trip:request:received", {
          message: "Trip request is being processed",
        });
      } catch {
        sendError(ws, "Failed to submit trip request, please retry");
      }
      break;
    }

    case "trip:cancel": {
      const { trip_id } = data as any;
      if (!trip_id) {
        sendError(ws, "trip_id is required to cancel a trip");
        return;
      }
      try {
        await publishEvent("rider.trip.cancelled", riderId, {
          riderId,
          trip_id,
          timestamp: Date.now(),
        });
        trace("kafka.trip_cancel.published", {
          riderId,
          topic: "rider.trip.cancelled",
          trip_id,
        });
        send(ws, "trip:cancel:received", {
          message: "Cancellation is being processed",
        });
      } catch {
        sendError(ws, "Failed to cancel trip, please retry");
      }
      break;
    }

    case "ping":
      send(ws, "pong", { timestamp: Date.now() });
      break;

    default:
      sendError(ws, `Unknown event: ${event}`);
  }
};
