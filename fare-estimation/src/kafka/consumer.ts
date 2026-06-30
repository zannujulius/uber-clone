import { Consumer } from "kafkajs";
import { kafka } from "../config/kafka";
import { processEstimateRequest } from "../services/fareEstimateProcessor";
import { processTripRequest } from "../services/tripProcessor";
import { EstimateRequestMessage, TripRequestMessage } from "../types";
import { trace } from "../utils/trace";

let consumer: Consumer | null = null;

export const startConsumer = async (): Promise<void> => {
  consumer = kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID || "fare-estimation-group",
  });
  await consumer.connect();

  const estimateTopic =
    process.env.KAFKA_ESTIMATE_REQUEST_TOPIC || "rider.trip.estimate.requested";
  const tripRequestedTopic =
    process.env.KAFKA_TRIP_REQUEST_TOPIC || "rider.trip.requested";

  await consumer.subscribe({
    topic: estimateTopic,
    fromBeginning: false,
  });

  await consumer.subscribe({
    topic: tripRequestedTopic,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;

      try {
        const payload = JSON.parse(message.value.toString());
        trace("kafka.message.received", {
          topic,
          riderId: payload.riderId,
          estimate_id: payload.estimate_id,
          trip_id: payload.trip_id,
        });

        if (topic === estimateTopic) {
          await processEstimateRequest(payload as EstimateRequestMessage);
          return;
        }

        if (topic === tripRequestedTopic) {
          await processTripRequest(payload as TripRequestMessage);
        }
      } catch (error) {
        console.error(`Failed to process message for topic ${topic}:`, error);
      }
    },
  });

  console.log(
    `Fare-estimation consumer listening on: ${estimateTopic}, ${tripRequestedTopic}`,
  );
  trace("consumer.ready", {
    estimateTopic,
    tripRequestedTopic,
  });
};

export const stopConsumer = async (): Promise<void> => {
  if (consumer) await consumer.disconnect();
};
