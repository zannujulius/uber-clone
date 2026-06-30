import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import * as authService from "../services/auth.service";

const handleValidation = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ status: "error", errors: errors.array() });
    return false;
  }
  return true;
};

export const registerRider = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.registerRider(req.body);
    res.status(201).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

export const loginRider = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.loginRider(req.body);
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

export const registerDriver = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.registerDriver(req.body);
    res.status(201).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

export const loginDriver = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!handleValidation(req, res)) return;
  try {
    const result = await authService.loginDriver(req.body);
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res
      .status(400)
      .json({ status: "error", message: "Refresh token required" });
    return;
  }
  try {
    const result = authService.refreshAccessToken(refreshToken);
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

export const getMe = (req: Request, res: Response): void => {
  res.status(200).json({ status: "success", data: { user: req.user } });
};
