import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "fare-estimation",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  retry: { retries: 2, initialRetryTime: 100, multiplier: 1.5 },
});
