import { Producer } from 'kafkajs';
import { kafka } from '../config/kafka';
import { trace } from '../utils/trace';

let producer: Producer | null = null;

export const connectProducer = async (): Promise<void> => {
  producer = kafka.producer();
  await producer.connect();
  console.log('Kafka producer connected');
};

export const publishEvent = async (topic: string, key: string, value: unknown): Promise<void> => {
  if (!producer) throw new Error('Kafka producer not connected');
  trace('kafka.producer.send', { topic, key });
  await producer.send({
    topic,
    messages: [{ key, value: JSON.stringify(value) }],
  });
};

export const disconnectProducer = async (): Promise<void> => {
  if (producer) await producer.disconnect();
};
