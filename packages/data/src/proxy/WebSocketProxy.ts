/**
 * @framesquared/data – WebSocketProxy
 *
 * Maintains a WebSocket connection for real-time data.  Sends
 * CRUD operations as JSON messages.  Auto-reconnects on disconnect.
 */

import type { Operation } from '../Operation.js';
import { ResultSet } from '../ResultSet.js';
import { Proxy } from './Proxy.js';
import type { ProxyConfig } from './Proxy.js';

export interface WebSocketProxyConfig extends ProxyConfig {
  url: string;
  protocol?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
}

export class WebSocketProxy extends Proxy {
  private url: string;
  private reconnect: boolean;
  private reconnectInterval: number;
  private ws: WebSocket | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Record<string, ((...args: any[]) => void)[]> = {};
  private intentionalClose = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: WebSocketProxyConfig) {
    super(config);
    this.url = config.url;
    this.reconnect = config.reconnect ?? false;
    this.reconnectInterval = config.reconnectInterval ?? 3000;
  }

  // -----------------------------------------------------------------------
  // Connection management
  // -----------------------------------------------------------------------

  connect(): void {
    this.intentionalClose = false;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => this.fire('open');
    this.ws.onerror = (e) => this.fire('error', e);
    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.fire('message', data);
      } catch {
        this.fire('message', e.data);
      }
    };
    this.ws.onclose = () => {
      this.fire('close');
      if (this.reconnect && !this.intentionalClose) {
        this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectInterval);
      }
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  // -----------------------------------------------------------------------
  // Send operations
  // -----------------------------------------------------------------------

  send(operation: Operation): void {
    if (!this.ws || this.ws.readyState !== 1) return;
    const message = {
      action: operation.action,
      records: operation.records.map((r) => r.getData()),
      params: operation.params,
    };
    this.ws.send(JSON.stringify(message));
  }

  // -----------------------------------------------------------------------
  // Proxy interface (returns empty ResultSets — real data comes via events)
  // -----------------------------------------------------------------------

  async read(operation: Operation): Promise<ResultSet> {
    this.send(operation);
    return new ResultSet({ records: [], success: true });
  }

  async create(operation: Operation): Promise<ResultSet> {
    this.send(operation);
    return new ResultSet({ records: operation.records, success: true });
  }

  async update(operation: Operation): Promise<ResultSet> {
    this.send(operation);
    return new ResultSet({ records: operation.records, success: true });
  }

  async destroy(operation: Operation): Promise<ResultSet> {
    this.send(operation);
    return new ResultSet({ records: [], success: true });
  }

  // -----------------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, fn: (...args: any[]) => void): void {
    (this.listeners[event] ??= []).push(fn);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, fn: (...args: any[]) => void): void {
    const list = this.listeners[event];
    if (!list) return;
    const idx = list.indexOf(fn);
    if (idx >= 0) list.splice(idx, 1);
  }

  private fire(event: string, ...args: unknown[]): void {
    (this.listeners[event] ?? []).forEach((fn) => fn(...args));
  }
}
