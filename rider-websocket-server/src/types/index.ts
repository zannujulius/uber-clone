export interface TokenPayload {
  id: string;
  role: 'rider' | 'driver';
  iat?: number;
  exp?: number;
}

export interface WsMessage {
  event: string;
  data: Record<string, unknown>;
}

export interface KafkaNotification {
  riderId: string;
  event: string;
  data: Record<string, unknown>;
}
