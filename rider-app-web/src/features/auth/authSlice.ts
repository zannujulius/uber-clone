import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, Rider } from './types';

const TOKEN_KEY   = 'rider_token';

export const persistToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken   = () => localStorage.removeItem(TOKEN_KEY);
export const loadToken    = () => localStorage.getItem(TOKEN_KEY);

const initialState: AuthState = {
  rider:           null,
  token:           null,
  isAuthenticated: false,
  isRestoring:     true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ rider: Rider; token: string }>) {
      state.rider           = action.payload.rider;
      state.token           = action.payload.token;
      state.isAuthenticated = true;
    },
    restoreSession(state, action: PayloadAction<string>) {
      state.token           = action.payload;
      state.isAuthenticated = true;
      state.isRestoring     = false;
    },
    sessionNotFound(state) {
      state.isRestoring = false;
    },
    logout(state) {
      state.rider           = null;
      state.token           = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, restoreSession, sessionNotFound, logout } = authSlice.actions;
export default authSlice.reducer;
