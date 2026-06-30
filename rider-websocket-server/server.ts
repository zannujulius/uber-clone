import 'dotenv/config';
import http from 'http';
import { createWssServer, handleUpgrade } from './src/app';
import { connectProducer, disconnectProducer } from './src/kafka/producer';
import { startConsumer, disconnectConsumer } from './src/kafka/consumer';

const PORT = process.env.PORT || 3010;

const connectKafka = async (): Promise<void> => {
  try {
    await connectProducer();
    await startConsumer();
    console.log('Kafka connected.');
  } catch (err: any) {
    console.warn(`[Kafka] Unavailable — running without it. Trip events will be dropped until Kafka is up. (${err.message})`);
  }
};

const start = async (): Promise<void> => {
  const wss = createWssServer();

  const server = http.createServer((_req, res) => {
    res.writeHead(404).end('Not found');
  });

  server.on('upgrade', (req, socket, head) => {
    handleUpgrade(wss, req, socket, head);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Run: lsof -ti :${PORT} | xargs kill -9`);
    } else {
      console.error('Server error:', err.message);
    }
    process.exit(1);
  });

  // Bind the WS server first so riders can connect immediately
  server.listen(PORT, () => {
    console.log(`Rider WebSocket Server running on port ${PORT}`);
    console.log(`Connect: ws://localhost:${PORT}?token=<rider_jwt>`);
  });

  // Kafka connects in the background — does not block startup
  connectKafka();

  const shutdown = async (): Promise<void> => {
    console.log('Shutting down...');
    await disconnectProducer();
    await disconnectConsumer();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
