import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  Driver,
  FareEstimate,
  PersistedTripStatus,
  Place,
  RideState,
  TripStatus,
} from './types';

const initialState: RideState = {
  pickup: null, dropoff: null,
  persistedTripStatus: null,
  fareEstimate: null,
  fareEstimateStatus: 'idle',
  fareEstimateError: null,
  status: 'idle', tripId: null, driver: null,
};

const rideSlice = createSlice({
  name: 'ride',
  initialState,
  reducers: {
    setPickup(state, action: PayloadAction<Place>)    {
      state.pickup  = action.payload;
      state.fareEstimate = null;
      state.fareEstimateStatus = 'idle';
      state.fareEstimateError = null;
    },
    setDropoff(state, action: PayloadAction<Place>)   {
      state.dropoff = action.payload;
      state.fareEstimate = null;
      state.fareEstimateStatus = 'idle';
      state.fareEstimateError = null;
    },
    setStatus(state, action: PayloadAction<TripStatus>) { state.status = action.payload; },
    tripCreated(state, action: PayloadAction<{ tripId: string; persistedStatus: PersistedTripStatus }>) {
      state.tripId = action.payload.tripId;
      state.persistedTripStatus = action.payload.persistedStatus;
      state.status = 'searching';
    },
    fareEstimateRequested(state) {
      state.fareEstimateStatus = 'pending';
      state.fareEstimateError = null;
    },
    fareEstimateReceived(state, action: PayloadAction<FareEstimate>) {
      state.fareEstimate = action.payload;
      state.fareEstimateStatus = 'ready';
      state.fareEstimateError = null;
    },
    fareEstimateFailed(state, action: PayloadAction<string>) {
      state.fareEstimate = null;
      state.fareEstimateStatus = 'error';
      state.fareEstimateError = action.payload;
    },
    clearFareEstimate(state) {
      state.fareEstimate = null;
      state.fareEstimateStatus = 'idle';
      state.fareEstimateError = null;
    },
    driverAssigned(state, action: PayloadAction<{ tripId: string; driver: Driver }>) {
      state.tripId = action.payload.tripId;
      state.driver = action.payload.driver;
      state.persistedTripStatus = 'Accepted';
      state.status = 'driver_assigned';
    },
    tripStarted(state)   { state.persistedTripStatus = 'In_Progress'; state.status = 'in_progress'; },
    tripCompleted(state) { state.persistedTripStatus = 'Completed'; state.status = 'completed'; },
    tripCancelled(state) { state.persistedTripStatus = 'Cancelled'; state.status = 'cancelled'; },
    resetRide()          { return initialState; },
  },
});

export const {
  setPickup,
  setDropoff,
  setStatus,
  tripCreated,
  fareEstimateRequested,
  fareEstimateReceived,
  fareEstimateFailed,
  clearFareEstimate,
  driverAssigned,
  tripStarted,
  tripCompleted,
  tripCancelled,
  resetRide,
} = rideSlice.actions;
export default rideSlice.reducer;
