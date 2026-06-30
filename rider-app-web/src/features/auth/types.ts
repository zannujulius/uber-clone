export interface Rider {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  is_active: boolean;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  status: 'success';
  data: { rider?: Rider; token: string; refreshToken: string };
}

export interface AuthState {
  rider: Rider | null;
  token: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
}
