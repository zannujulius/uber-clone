import "dotenv/config";
import http from "http";
import httpProxy from "http-proxy";
import jwt from "jsonwebtoken";
import { IncomingMessage } from "http";
import { Duplex } from "stream";
import app from "./src/app";
import { sequelize } from "./src/models";
import { TokenPayload } from "./src/types";

const PORT = process.env.PORT || 3000;

const gatewayTrace = (step: string, data: Record<string, unknown>): void => {
  console.log(`[trace][gateway] ${step}`, data);
};

const proxy = httpProxy.createProxyServer({ ws: true });

proxy.on("error", (err, _req, res) => {
  console.error("Proxy error:", err.message);
  if (res instanceof http.ServerResponse) {
    res.writeHead(502).end("WebSocket service unavailable");
  }
});

const rejectSocket = (socket: Duplex, message: string): void => {
  socket.write(
    `HTTP/1.1 401 Unauthorized\r\nContent-Type: text/plain\r\n\r\n${message}`,
  );
  socket.destroy();
};

const handleWsUpgrade = (
  req: IncomingMessage,
  socket: Duplex,
  head: Buffer,
): void => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  const token = url.searchParams.get("token");
  const path = url.pathname;

  if (!token) {
    return rejectSocket(socket, "Token required");
  }

  let decoded: TokenPayload;
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as TokenPayload;
  } catch {
    return rejectSocket(socket, "Invalid or expired token");
  }

  if (path.startsWith("/ws/rider")) {
    if (decoded.role !== "rider") {
      return rejectSocket(socket, "Access denied: riders only");
    }
    gatewayTrace("ws.upgrade.proxy", {
      path,
      role: decoded.role,
      userId: decoded.id,
      target: process.env.RIDER_WS_URL,
    });
    proxy.ws(req, socket, head, { target: process.env.RIDER_WS_URL });
    return;
  }

  if (path.startsWith("/ws/driver")) {
    if (decoded.role !== "driver") {
      return rejectSocket(socket, "Access denied: drivers only");
    }
    gatewayTrace("ws.upgrade.proxy", {
      path,
      role: decoded.role,
      userId: decoded.id,
      target: process.env.DRIVER_WS_URL,
    });
    proxy.ws(req, socket, head, { target: process.env.DRIVER_WS_URL });
    return;
  }

  socket.destroy();
};

const start = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("Database synced.");

    const server = http.createServer(app);
    server.on("upgrade", handleWsUpgrade);

    server.listen(PORT, () => {
      console.log(`API Gateway running on port ${PORT}`);
      console.log(`WS proxy: /ws/rider  → ${process.env.RIDER_WS_URL}`);
      console.log(`WS proxy: /ws/driver → ${process.env.DRIVER_WS_URL}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();
