import WebSocket from 'ws';
import { handleMessage } from '../src/handlers/messageHandler';
import { publishEvent } from '../src/kafka/producer';

jest.mock('../src/kafka/producer', () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
}));

const mockPublish = publishEvent as jest.MockedFunction<typeof publishEvent>;

// Minimal WebSocket mock
const makeMockWs = () => {
  const messages: string[] = [];
  return {
    send: jest.fn((data: string) => messages.push(data)),
    readyState: WebSocket.OPEN,
    _messages: messages,
    lastMessage: () => JSON.parse(messages[messages.length - 1]),
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── trip:estimate ────────────────────────────────────────────────────────────

describe('trip:estimate event', () => {
  it('publishes to Kafka and acks the rider', async () => {
    const ws = makeMockWs();
    await handleMessage(ws as any, 'rider-1', JSON.stringify({
      event: 'trip:estimate',
      data: {
        pickup_latitude: 6.5244,
        pickup_longitude: 3.3792,
        dropoff_latitude: 6.4550,
        dropoff_longitude: 3.4200,
        pickup_address: 'Pickup',
        dropoff_address: 'Dropoff',
      },
    }));

    expect(mockPublish).toHaveBeenCalledWith(
      'rider.trip.estimate.requested',
      'rider-1',
      expect.objectContaining({ riderId: 'rider-1', pickup_latitude: 6.5244 })
    );
    expect(ws.lastMessage().event).toBe('trip:estimate:received');
  });

  it('returns error when estimate fields are missing', async () => {
    const ws = makeMockWs();
    await handleMessage(ws as any, 'rider-1', JSON.stringify({
      event: 'trip:estimate',
      data: { pickup_latitude: 6.5244 },
    }));

    expect(mockPublish).not.toHaveBeenCalled();
    expect(ws.lastMessage().event).toBe('error');
  });
});

// ─── trip:request ─────────────────────────────────────────────────────────────

describe('trip:request event', () => {
  it('publishes to Kafka and acks the rider', async () => {
    const ws = makeMockWs();
    await handleMessage(ws as any, 'rider-1', JSON.stringify({
      event: 'trip:request',
      data: {
        pickup_latitude: 6.5244,
        pickup_longitude: 3.3792,
        dropoff_latitude: 6.4550,
        dropoff_longitude: 3.4200,
        estimate_id: 'estimate-1',
        estimated_fare: 2500,
      },
    }));

    expect(mockPublish).toHaveBeenCalledWith(
      'rider.trip.requested',
      'rider-1',
      expect.objectContaining({
        riderId: 'rider-1',
        pickup_latitude: 6.5244,
        estimate_id: 'estimate-1',
      })
    );
    expect(ws.lastMessage().event).toBe('trip:request:received');
  });

  it('returns error when location fields are missing', async () => {
    const ws = makeMockWs();
    await handleMessage(ws as any, 'rider-1', JSON.stringify({
      event: 'trip:request',
      data: { pickup_latitude: 6.5244 },
    }));

    expect(mockPublish).not.toHaveBeenCalled();
    expect(ws.lastMessage().event).toBe('error');
  });

  it('returns error when Kafka publish fails', async () => {
    mockPublish.mockRejectedValueOnce(new Error('Kafka down'));
    const ws = makeMockWs();
    await handleMessage(ws as any, 'rider-1', JSON.stringify({
      event: 'trip:request',
      data: {
        pickup_latitude: 6.5244,
        pickup_longitude: 3.3792,
        dropoff_latitude: 6.4550,
        dropoff_longitude: 3.4200,
      },
    }));

    expect(ws.lastMessage().event).toBe('error');
  });
});

// ─── trip:cancel ──────────────────────────────────────────────────────────────

describe('trip:cancel event', () => {
  it('publishes to Kafka and acks the rider', async () => {
    const ws = makeMockWs();
    await handleMessage(ws as any, 'rider-1', JSON.stringify({
      event: 'trip:cancel',
      data: { trip_id: 'trip-uuid-123' },
    }));

    expect(mockPublish).toHaveBeenCalledWith(
      'rider.trip.cancelled',
      'rider-1',
      expect.objectContaining({ riderId: 'rider-1', trip_id: 'trip-uuid-123' })
    );
    expect(ws.lastMessage().event).toBe('trip:cancel:received');
  });

  it('returns error when trip_id is missing', async () => {
    const ws = makeMockWs();
    await handleMessage(ws as any, 'rider-1', JSON.stringify({
      event: 'trip:cancel',
      data: {},
    }));

    expect(mockPublish).not.toHaveBeenCalled();
    expect(ws.lastMessage().event).toBe('error');
  });
});

// ─── ping / pong ──────────────────────────────────────────────────────────────

describe('ping event', () => {
  it('responds with pong and timestamp', async () => {
    const ws = makeMockWs();
    await handleMessage(ws as any, 'rider-1', JSON.stringify({ event: 'ping', data: {} }));

    const msg = ws.lastMessage();
    expect(msg.event).toBe('pong');
    expect(msg.data.timestamp).toBeDefined();
  });
});

// ─── Unknown / malformed ─────────────────────────────────────────────────────

describe('unknown and malformed messages', () => {
  it('returns error for unknown event', async () => {
    const ws = makeMockWs();
    await handleMessage(ws as any, 'rider-1', JSON.stringify({ event: 'foo:bar', data: {} }));

    expect(ws.lastMessage().event).toBe('error');
    expect(ws.lastMessage().data.message).toContain('Unknown event');
  });

  it('returns error for invalid JSON', async () => {
    const ws = makeMockWs();
    await handleMessage(ws as any, 'rider-1', 'not json at all');

    expect(ws.lastMessage().event).toBe('error');
    expect(ws.lastMessage().data.message).toBe('Invalid JSON');
  });
});
