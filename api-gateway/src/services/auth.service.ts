import jwt from "jsonwebtoken";
import { Rider, Driver } from "../models";
import { TokenPayload, AppError, RegisterInput, LoginInput } from "../types";

const makeError = (message: string, statusCode: number): AppError => {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
};

const signToken = (payload: TokenPayload): string =>
  jwt.sign(
    payload,
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    } as jwt.SignOptions,
  );

const signRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    } as jwt.SignOptions,
  );

const omitPassword = <T extends { password?: string }>(
  obj: T,
): Omit<T, "password"> => {
  const { password: _pw, ...rest } = obj;
  return rest;
};

export const registerRider = async (input: RegisterInput) => {
  const existing = await Rider.findOne({ where: { email: input.email } });
  if (existing) throw makeError("Email already in use", 409);

  const rider = await Rider.create(input as any);
  const tokenPayload: TokenPayload = { id: rider.id, role: "rider" };

  return {
    rider: omitPassword(rider.toJSON()),
    token: signToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
  };
};

export const loginRider = async ({ email, password }: LoginInput) => {
  const rider = await Rider.findOne({ where: { email } });
  if (!rider || !(await rider.validatePassword(password))) {
    throw makeError("Invalid email or password", 401);
  }

  const tokenPayload: TokenPayload = { id: rider.id, role: "rider" };
  return {
    rider: omitPassword(rider.toJSON()),
    token: signToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
  };
};

export const registerDriver = async (input: RegisterInput) => {
  const existing = await Driver.findOne({ where: { email: input.email } });
  if (existing) throw makeError("Email already in use", 409);

  const driver = await Driver.create(input as any);
  const tokenPayload: TokenPayload = { id: driver.id, role: "driver" };

  return {
    driver: omitPassword(driver.toJSON()),
    token: signToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
  };
};

export const loginDriver = async ({ email, password }: LoginInput) => {
  const driver = await Driver.findOne({ where: { email } });
  if (!driver || !(await driver.validatePassword(password))) {
    throw makeError("Invalid email or password", 401);
  }

  const tokenPayload: TokenPayload = { id: driver.id, role: "driver" };
  console.log("Driver logged in:", driver.toJSON()); 
  return {
    driver: omitPassword(driver.toJSON()),
    token: signToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
  };
};

export const refreshAccessToken = (refreshToken: string): { token: string } => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string,
    ) as TokenPayload;
    const payload: TokenPayload = { id: decoded.id, role: decoded.role };
    return { token: signToken(payload) };
  } catch {
    throw makeError("Invalid or expired refresh token", 401);
  }
};
// rebuild: produce arm64 image via native-arm workflow
