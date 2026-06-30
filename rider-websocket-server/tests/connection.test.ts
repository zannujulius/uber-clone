import WebSocket from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { createWssServer, handleUpgrade } from '../src/app';
import { registry } from '../src/services/connectionRegistry';

// Kafka must be mocked before any app code imports it
jest.mock('../src/kafka/producer', () => ({
  connectProducer: jest.fn(),
  publishEvent: jest.fn().mockResolvedValue(undefined),
  disconnectProducer: jest.fn(),
}));

const TEST_PORT = 9011;
const SECRET = process.env.JWT_SECRET as string;

const makeToken = (role: 'rider' | 'driver', id = 'rider-123') =>
  jwt.sign({ id, role }, SECRET, { expiresIn: '1h' });

const connect = (token?: string): WebSocket =>
  new WebSocket(
    token
      ? `ws://localhost:${TEST_PORT}?token=${token}`
      : `ws://localhost:${TEST_PORT}`
  );

let server: http.Server;

beforeAll((done) => {
  const wss = createWssServer();
  server = http.createServer();
  server.on('upgrade', (req, socket, head) => handleUpgrade(wss, req, socket, head));
  server.listen(TEST_PORT, done);
});

afterAll((done) => {
  server.close(done);
});

// ─── Connection Auth ──────────────────────────────────────────────────────────

describe('WebSocket authentication', () => {
  it('accepts a valid rider token and sends connection:established', (done) => {
    const ws = connect(makeToken('rider', 'rider-abc'));
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      expect(msg.event).toBe('connection:established');
      expect(msg.data.riderId).toBe('rider-abc');
      ws.close();
      done();
    });
    ws.on('error', done);
  });

  it('rejects connection with no token', (done) => {
    const ws = connect();
    ws.on('close', (code) => {
      expect(code).not.toBe(1000);
      done();
    });
    ws.on('unexpected-response', (_req, res) => {
      expect(res.statusCode).toBe(401);
      done();
    });
  });

  it('rejects connection with an invalid token', (done) => {
    const ws = connect('this.is.invalid');
    ws.on('unexpected-response', (_req, res) => {
      expect(res.statusCode).toBe(401);
      done();
    });
    ws.on('error', () => done());
  });

  it('rejects connection with an expired token', (done) => {
    const token = jwt.sign({ id: 'r1', role: 'rider' }, SECRET, { expiresIn: -1 });
    const ws = connect(token);
    ws.on('unexpected-response', (_req, res) => {
      expect(res.statusCode).toBe(401);
      done();
    });
    ws.on('error', () => done());
  });

  it('rejects a driver token on the rider WS server', (done) => {
    const ws = connect(makeToken('driver', 'driver-xyz'));
    ws.on('unexpected-response', (_req, res) => {
      expect(res.statusCode).toBe(401);
      done();
    });
    ws.on('error', () => done());
  });
});

// ─── Connection Registry ─────────────────────────────────────────────────────

describe('Connection registry', () => {
  it('adds rider to registry on connect and removes on disconnect', (done) => {
    const riderId = 'rider-reg-test';
    const ws = connect(makeToken('rider', riderId));

    ws.on('message', () => {
      expect(registry.get(riderId)).toBeDefined();
      ws.close();
    });

    ws.on('close', () => {
      // Small delay to allow close handler to run
      setTimeout(() => {
        expect(registry.get(riderId)).toBeUndefined();
        done();
      }, 50);
    });
  });
});
