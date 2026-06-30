import WebSocket from "ws";

class ConnectionRegistry {
  private connections = new Map<string, WebSocket>();

  add(riderId: string, ws: WebSocket): void {
    this.connections.set(riderId, ws);
    console.log(
      `Rider ${riderId} connected. Active connections: ${this.connections.size}`,
    );
  }

  remove(riderId: string): void {
    this.connections.delete(riderId);
    console.log(
      `Rider ${riderId} disconnected. Active connections: ${this.connections.size}`,
    );
  }

  get(riderId: string): WebSocket | undefined {
    return this.connections.get(riderId);
  }

  send(riderId: string, event: string, data: unknown): boolean {
    const ws = this.connections.get(riderId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
      return true;
    }
    return false;
  }

  size(): number {
    return this.connections.size;
  }
}

export const registry = new ConnectionRegistry();
