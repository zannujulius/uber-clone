import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit';

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export const wsConnect    = createAction<string>('ws/connect');
export const wsDisconnect = createAction('ws/disconnect');
export const wsSend       = createAction<{ event: string; data: Record<string, unknown> }>('ws/send');

const wsSlice = createSlice({
  name: 'websocket',
  initialState: { status: 'disconnected' as WsStatus },
  reducers: {
    wsConnected(state)    { state.status = 'connected'; },
    wsDisconnected(state) { state.status = 'disconnected'; },
    wsConnecting(state)   { state.status = 'connecting'; },
    wsError(state)        { state.status = 'error'; },
  },
});

export const { wsConnected, wsDisconnected, wsConnecting, wsError } = wsSlice.actions;
export default wsSlice.reducer;
