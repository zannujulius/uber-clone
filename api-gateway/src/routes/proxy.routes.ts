import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

const makeProxy = (target: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      error: (_err, _req, res) => {
        (res as any).status(502).json({
          status: "error",
          message: "Service temporarily unavailable",
        });
      },
    },
  });

router.use(
  "/rider",
  authenticate,
  authorize("rider"),
  makeProxy(process.env.RIDER_SERVICE_URL as string),
);
router.use(
  "/driver",
  authenticate,
  authorize("driver"),
  makeProxy(process.env.DRIVER_SERVICE_URL as string),
);
router.use(
  "/location",
  authenticate,
  authorize("rider", "driver"),
  makeProxy(process.env.LOCATION_SERVICE_URL as string),
);
router.use(
  "/assignment",
  authenticate,
  authorize("rider", "driver"),
  makeProxy(process.env.DRIVER_ASSIGNMENT_SERVICE_URL as string),
);

export default router;
