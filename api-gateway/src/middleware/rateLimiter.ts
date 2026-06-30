import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

export const globalLimiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS as string, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX as string, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    status: "error",
    message: "Too many login attempts, please try again later.",
  },
});
