import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AuthResponse, LoginRequest, RegisterRequest } from './types';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  endpoints: (b) => ({
    register: b.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: '/api/v1/auth/rider/register', method: 'POST', body }),
    }),
    login: b.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/api/v1/auth/rider/login', method: 'POST', body }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation } = authApi;
