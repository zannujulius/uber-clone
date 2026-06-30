import { Router } from "express";
import { body } from "express-validator";
import * as controller from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

const registerRules = [
  body("first_name").trim().notEmpty().withMessage("First name is required"),
  body("last_name").trim().notEmpty().withMessage("Last name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phone_number")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const loginRules = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post(
  "/rider/register",
  authLimiter,
  registerRules,
  controller.registerRider,
);
router.post("/rider/login", authLimiter, loginRules, controller.loginRider);

router.post(
  "/driver/register",
  authLimiter,
  registerRules,
  controller.registerDriver,
);
router.post("/driver/login", authLimiter, loginRules, controller.loginDriver);

router.post("/refresh", controller.refreshToken);
router.get("/me", authenticate, controller.getMe);

export default router;
