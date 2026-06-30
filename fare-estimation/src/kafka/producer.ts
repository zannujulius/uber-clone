import { Producer } from "kafkajs";
import { kafka } from "../config/kafka";
import { trace } from "../utils/trace";

let producer: Producer | null = null;

export const connectProducer = async (): Promise<void> => {
  producer = kafka.producer();
  await producer.connect();
  console.log("Fare-estimation Kafka producer connected");
};

export const publishNotification = async (
  riderId: string,
  event: string,
  data: Record<string, unknown>,
): Promise<void> => {
  if (!producer) throw new Error("Kafka producer not connected");
  trace("kafka.notification.publish", {
    riderId,
    event,
    trip_id: data.trip_id,
    estimate_id: data.estimate_id,
  });

  await producer.send({
    topic: process.env.KAFKA_NOTIFICATION_TOPIC || "rider.notifications",
    messages: [
      {
        key: riderId,
        value: JSON.stringify({ riderId, event, data }),
      },
    ],
  });
};

export const disconnectProducer = async (): Promise<void> => {
  if (producer) await producer.disconnect();
};
