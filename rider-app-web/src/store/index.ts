import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { authApi } from '@/features/auth/authApi';
import authReducer from '@/features/auth/authSlice';
import rideReducer from '@/features/ride/rideSlice';
import wsReducer   from '@/features/websocket/websocketSlice';
import { websocketMiddleware } from '@/features/websocket/websocketMiddleware';

export const store = configureStore({
  reducer: {
    auth:              authReducer,
    ride:              rideReducer,
    websocket:         wsReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (gDM) => gDM().concat(authApi.middleware, websocketMiddleware),
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
