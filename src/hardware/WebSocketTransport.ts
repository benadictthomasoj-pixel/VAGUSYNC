// WebSocket transport for ESP-12E / ESP8266 Hardware Prototype
import { RawHardwarePacket } from './hardwareTypes';

type PacketCallback = (packet: RawHardwarePacket, latencyMs: number) => void;
type StatusCallback = (status: 'disconnected' | 'connecting' | 'connected' | 'error', error?: string) => void;

export class WebSocketTransport {
  private ws: WebSocket | null = null;
  private url: string = 'ws://192.168.4.1:81';
  private packetCallback: PacketCallback | null = null;
  private statusCallback: StatusCallback | null = null;
  private reconnectTimer: any = null;
  private shouldReconnect: boolean = false;
  private pingInterval: any = null;
  private lastPingSent = 0;
  private latency = 0;

  public setUrl(url: string): void {
    this.url = url;
  }

  public onPacket(cb: PacketCallback): void {
    this.packetCallback = cb;
  }

  public onStatus(cb: StatusCallback): void {
    this.statusCallback = cb;
  }

  public connect(url?: string): void {
    if (url) this.url = url;
    this.disconnect();
    this.shouldReconnect = true;

    if (this.statusCallback) this.statusCallback('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (this.statusCallback) this.statusCallback('connected');
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const now = performance.now();
          if (typeof event.data === 'string') {
            if (event.data === 'pong') {
              this.latency = Math.max(1, Math.round(now - this.lastPingSent));
              return;
            }
            const data: RawHardwarePacket = JSON.parse(event.data);
            if (this.packetCallback) {
              this.packetCallback(data, this.latency);
            }
          }
        } catch (e) {
          console.warn('Malformed hardware packet received:', event.data, e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket transport error:', err);
        if (this.statusCallback) {
          this.statusCallback('error', 'Connection to ESP-12E WebSocket failed.');
        }
      };

      this.ws.onclose = () => {
        this.stopPing();
        if (this.statusCallback) this.statusCallback('disconnected');
        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => {
            if (this.shouldReconnect) this.connect();
          }, 3000);
        }
      };
    } catch (err: any) {
      if (this.statusCallback) {
        this.statusCallback('error', err.message || 'Failed to initialize WebSocket');
      }
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.statusCallback) this.statusCallback('disconnected');
  }

  public send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingSent = performance.now();
        this.ws.send('ping');
      }
    }, 2000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
