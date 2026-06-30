export interface TokenPayload {
  id: string;
  role: "rider" | "driver";
  iat?: number;
  exp?: number;
}

export interface AppError extends Error {
  statusCode?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  gender?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
