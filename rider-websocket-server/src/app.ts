import WebSocket, { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { IncomingMessage } from "http";
import { Duplex } from "stream";
import { TokenPayload } from "./types";
import { registry } from "./services/connectionRegistry";
import { handleMessage } from "./handlers/messageHandler";
import { trace } from "./utils/trace";

const extractToken = (req: IncomingMessage): string | null => {
  const url = new URL(req.url || "/", `http://localhost`);
  return url.searchParams.get("token");
};

export const createWssServer = (): WebSocketServer => {
  const wss = new WebSocketServer({ noServer: true });

  wss.on(
    "connection",
    (ws: WebSocket, _req: IncomingMessage, riderId: string) => {
      registry.add(riderId, ws);
      trace("ws.connected", { riderId });

      ws.send(
        JSON.stringify({
          event: "connection:established",
          data: { riderId, message: "Connected to Rider WebSocket Server" },
        }),
      );

      ws.on("message", async (raw: WebSocket.RawData) => {
        await handleMessage(ws, riderId, raw.toString());
      });

      ws.on("close", () => {
        trace("ws.closed", { riderId });
        registry.remove(riderId);
      });

      ws.on("error", (err: Error) => {
        console.error(`Socket error for rider ${riderId}:`, err.message);
        registry.remove(riderId);
      });
    },
  );

  return wss;
};

export const handleUpgrade = (
  wss: WebSocketServer,
  req: IncomingMessage,
  socket: Duplex,
  head: Buffer,
): void => {
  const reject = (message: string): void => {
    socket.write(
      `HTTP/1.1 401 Unauthorized\r\nContent-Type: text/plain\r\n\r\n${message}`,
    );
    socket.destroy();
  };

  const token = extractToken(req);
  if (!token) return reject("Token required");

  let decoded: TokenPayload;
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as TokenPayload;
  } catch {
    return reject("Invalid or expired token");
  }

  if (decoded.role !== "rider") {
    return reject("Access denied: riders only");
  }

  trace("ws.upgrade.accepted", {
    riderId: decoded.id,
    path: req.url,
  });

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req, decoded.id);
  });
};
