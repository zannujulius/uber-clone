import { Request, Response, NextFunction } from "express";
import { AppError } from "../types";

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV === "development") {
    res.status(statusCode).json({ status: "error", message, stack: err.stack });
    return;
  }

  res.status(statusCode).json({ status: "error", message });
};

export const notFound = (req: Request, res: Response): void => {
  res
    .status(404)
    .json({ status: "error", message: `Route ${req.originalUrl} not found` });
};
