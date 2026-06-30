import { Middleware } from '@reduxjs/toolkit';
import {
  driverAssigned,
  fareEstimateFailed,
  fareEstimateReceived,
  fareEstimateRequested,
  setStatus,
  tripCreated,
  tripCancelled,
  tripCompleted,
  tripStarted,
} from '../ride/rideSlice';
import { wsConnect, wsConnected, wsConnecting, wsDisconnect, wsDisconnected, wsError, wsSend } from './websocketSlice';

let socket: WebSocket | null = null;

export const websocketMiddleware: Middleware = (store) => (next) => (action) => {
  if (wsConnect.match(action)) {
    if (socket) socket.close();
    store.dispatch(wsConnecting());

    const url = `${import.meta.env.VITE_WS_URL}/ws/rider?token=${action.payload}`;
    socket = new WebSocket(url);

    socket.onopen    = () => store.dispatch(wsConnected());
    socket.onclose   = () => { store.dispatch(wsDisconnected()); socket = null; };
    socket.onerror   = () => store.dispatch(wsError());
    socket.onmessage = (e) => {
      try {
        const msg: { event: string; data: Record<string, unknown> } = JSON.parse(e.data);
        switch (msg.event) {
          case 'trip:estimate:received':
            store.dispatch(fareEstimateRequested());
            break;
          case 'trip:estimate:ready':
            store.dispatch(fareEstimateReceived({
              estimateId: (msg.data.estimate_id as string) ?? null,
              amount: Number(msg.data.amount ?? 0),
              currency: String(msg.data.currency ?? 'RWF'),
              baseFare: Number(msg.data.base_fare ?? 0),
              distanceKm: Number(msg.data.distance_km ?? 0),
              durationMinutes: Number(msg.data.duration_minutes ?? 0),
              distanceRate: Number(msg.data.distance_rate ?? 0),
              timeRate: Number(msg.data.time_rate ?? 0),
              surgeMultiplier: Number(msg.data.surge_multiplier ?? 1),
              routeSource: (msg.data.route_source as 'google' | 'fallback') ?? 'fallback',
            }));
            break;
          case 'trip:estimate:failed':
            store.dispatch(fareEstimateFailed(String(msg.data.message ?? 'Unable to estimate fare')));
            break;
          case 'trip:request:received': store.dispatch(setStatus('searching')); break;
          case 'trip:created':
            store.dispatch(
              tripCreated({
                tripId: String(msg.data.trip_id ?? ''),
                persistedStatus: (msg.data.status as 'Requested' | 'Accepted' | 'In_Progress' | 'Completed' | 'Cancelled') ?? 'Requested',
              }),
            );
            break;
          case 'trip:request:failed':
            store.dispatch(setStatus('idle'));
            break;
          case 'trip:driver_assigned':
            store.dispatch(driverAssigned({ tripId: msg.data.trip_id as string, driver: msg.data.driver as any }));
            break;
          case 'trip:started':   store.dispatch(tripStarted());   break;
          case 'trip:completed': store.dispatch(tripCompleted()); break;
          case 'trip:cancelled': store.dispatch(tripCancelled()); break;
        }
      } catch { /* malformed frame */ }
    };
  }

  if (wsSend.match(action) && socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(action.payload));
  }

  if (wsDisconnect.match(action)) {
    socket?.close();
    socket = null;
  }

  return next(action);
};
