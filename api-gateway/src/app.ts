import express from "express";
import cors from "cors";
import os from "os";
import swaggerUi from "swagger-ui-express";
import { globalLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFound } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import proxyRoutes from "./routes/proxy.routes";
import { swaggerSpec } from "./config/swagger";

const app = express();

const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGINS ?? "http://localhost:5173"
).split(",");

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "API Gateway is run!!!! 😂",
    pod: os.hostname(),
    podIp:
      Object.values(os.networkInterfaces())
        .flat()
        .find((i) => i?.family === "IPv4" && !i.internal)?.address ?? "unknown",
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Ride Hailing API Gateway",
    swaggerOptions: { persistAuthorization: true },
  }),
);

app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", proxyRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
