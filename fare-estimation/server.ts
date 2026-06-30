import "./src/config/env";
import http from "http";
import { startConsumer, stopConsumer } from "./src/kafka/consumer";
import { connectProducer, disconnectProducer } from "./src/kafka/producer";
import { syncDatabase } from "./src/models";

const port = Number(process.env.FARE_ESTIMATION_PORT || 3012);

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ service: "fare-estimation", status: "ok" }));
});

const shutdown = async (signal: string): Promise<void> => {
  console.log(`Received ${signal}, shutting down fare-estimation service...`);
  await stopConsumer();
  await disconnectProducer();
  server.close(() => {
    process.exit(0);
  });
};

const bootstrap = async (): Promise<void> => {
  await syncDatabase();
  await connectProducer();
  await startConsumer();

  server.listen(port, () => {
    console.log(`Fare estimation service listening on port ${port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start fare-estimation service:", error);
  process.exit(1);
});

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
