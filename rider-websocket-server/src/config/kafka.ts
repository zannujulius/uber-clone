import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'rider-websocket-server',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  // Fail fast so the server starts immediately when Kafka is not available
  retry: { retries: 2, initialRetryTime: 100, multiplier: 1.5 },
});
