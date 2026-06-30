import { Consumer } from "kafkajs";
import { kafka } from "../config/kafka";
import { registry } from "../services/connectionRegistry";
import { KafkaNotification } from "../types";
import { trace } from "../utils/trace";

let consumer: Consumer | null = null;

export const startConsumer = async (): Promise<void> => {
  consumer = kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID || "rider-ws-group",
  });
  await consumer.connect();

  await consumer.subscribe({
    topics: ["rider.notifications"],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        const payload = JSON.parse(
          message.value.toString(),
        ) as KafkaNotification;
        trace("kafka.notification.received", {
          riderId: payload.riderId,
          event: payload.event,
          trip_id: payload.data.trip_id,
          estimate_id: payload.data.estimate_id,
        });
        const sent = registry.send(
          payload.riderId,
          payload.event,
          payload.data,
        );
        trace("ws.notification.forwarded", {
          riderId: payload.riderId,
          event: payload.event,
          delivered: sent,
        });
        if (!sent) {
          console.warn(
            `Rider ${payload.riderId} not connected, dropping event: ${payload.event}`,
          );
        }
      } catch (err) {
        console.error("Failed to process Kafka message:", err);
      }
    },
  });

  console.log("Kafka consumer listening on: rider.notifications");
};

export const disconnectConsumer = async (): Promise<void> => {
  if (consumer) await consumer.disconnect();
};
