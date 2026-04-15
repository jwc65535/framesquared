/**
 * @framesquared/data – Server Proxies
 *
 * AjaxProxy (fetch-based) and RestProxy (RESTful URL patterns).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Operation } from '../Operation.js';
import type { Model } from '../Model.js';
import { ResultSet } from '../ResultSet.js';
import { JsonReader } from '../reader/Reader.js';
import { JsonWriter } from '../writer/Writer.js';
import { Proxy } from './Proxy.js';
import type { ProxyConfig } from './Proxy.js';

// ---------------------------------------------------------------------------
// AjaxProxy
// ---------------------------------------------------------------------------

export interface RequestEvent {
  method: string;
  url: string;
  action: string;
}

export interface ResponseEvent {
  method: string;
  url: string;
  action: string;
  /** HTTP status code; 0 for network / parse errors. */
  status: number;
  /** Round-trip duration in milliseconds. */
  elapsed: number;
  /** True when the HTTP response was 2xx. */
  success: boolean;
  /** Parsed response body, if available. */
  data?: unknown;
  /** Set for network or JSON-parse errors. */
  error?: Error;
}

export interface AjaxProxyConfig extends ProxyConfig {
  url: string;
  api?: Partial<Record<string, string>>;
  /** Static header map or a function evaluated per-request (useful for auth tokens). */
  headers?: Record<string, string> | (() => Record<string, string>);
  timeout?: number;
  withCredentials?: boolean;
  beforeRequest?: (event: RequestEvent) => void;
  afterRequest?: (event: ResponseEvent) => void;
}

const ACTION_METHODS: Record<string, string> = {
  read: 'GET',
  create: 'POST',
  update: 'PUT',
  patch: 'PATCH',
  destroy: 'DELETE',
};

export class AjaxProxy extends Proxy {
  protected url: string;
  protected api: Partial<Record<string, string>>;
  protected headers: Record<string, string> | (() => Record<string, string>);
  protected timeout: number;
  protected withCredentials: boolean;
  protected reader: JsonReader;
  protected writer: JsonWriter;
  protected beforeRequest?: (event: RequestEvent) => void;
  protected afterRequest?: (event: ResponseEvent) => void;

  constructor(config: AjaxProxyConfig) {
    super(config);
    this.url = config.url;
    this.api = config.api ?? {};
    this.headers = config.headers ?? {};
    this.timeout = config.timeout ?? 30000;
    this.withCredentials = config.withCredentials ?? false;
    this.reader = new JsonReader({ model: config.model });
    this.writer = new JsonWriter({});
    this.beforeRequest = config.beforeRequest;
    this.afterRequest = config.afterRequest;
  }

  async read(
    records: Model[] = [],
    options: { params?: Record<string, unknown>; start?: number; limit?: number; page?: number } = {},
    signal?: AbortSignal,
  ): Promise<ResultSet> {
    return this.doRequest(new Operation({ action: 'read', records, ...options }), 'read', signal);
  }

  async create(records: Model[]): Promise<ResultSet> {
    return this.doRequest(new Operation({ action: 'create', records }), 'create');
  }

  async update(records: Model[]): Promise<ResultSet> {
    return this.doRequest(new Operation({ action: 'update', records }), 'update');
  }

  async patch(records: Model[]): Promise<ResultSet> {
    return this.doRequest(new Operation({ action: 'patch', records }), 'patch');
  }

  async destroy(records: Model[]): Promise<ResultSet> {
    return this.doRequest(new Operation({ action: 'destroy', records }), 'destroy');
  }

  protected buildUrl(operation: Operation, action: string): string {
    const base = this.api[action] ?? this.url;
    const params = { ...operation.params };

    if (operation.start !== undefined) params.start = operation.start;
    if (operation.limit !== undefined) params.limit = operation.limit;
    if (operation.page !== undefined) params.page = operation.page;

    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');

    return qs ? `${base}?${qs}` : base;
  }

  protected async doRequest(
    operation: Operation,
    action: string,
    signal?: AbortSignal,
  ): Promise<ResultSet> {
    const method = ACTION_METHODS[action] ?? 'GET';
    const url = this.buildUrl(operation, action);
    const resolvedHeaders =
      typeof this.headers === 'function' ? this.headers() : this.headers;

    this.beforeRequest?.({ method, url, action });

    const init: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', ...resolvedHeaders },
      credentials: this.withCredentials ? 'include' : 'same-origin',
      signal,
    };

    if (method !== 'GET' && operation.records.length > 0) {
      init.body = JSON.stringify(this.writer.write(operation.records));
    }

    const t0 = Date.now();
    try {
      const response = await fetch(url, init);
      const elapsed = Date.now() - t0;

      let data: unknown = null;
      try { data = await response.json(); } catch { /* ignore */ }

      this.afterRequest?.({ method, url, action, status: response.status, elapsed, success: response.ok, data });

      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        if (data && typeof data === 'object' && 'message' in data) {
          message = String((data as Record<string, unknown>).message);
        }
        return new ResultSet({ records: [], success: false, message });
      }

      if (action === 'read') {
        return this.reader.read(data);
      }

      // CUD: use the echoed record if the server returns one
      const records = Array.isArray(data)
        ? data.map((d: any) => this.model.create(d))
        : data && typeof data === 'object' && 'id' in data
          ? [this.model.create(data as Record<string, unknown>)]
          : operation.records;

      return new ResultSet({ records, success: true });
    } catch (err: any) {
      const elapsed = Date.now() - t0;
      this.afterRequest?.({ method, url, action, status: 0, elapsed, success: false, error: err });
      return new ResultSet({ records: [], success: false, message: err?.message ?? 'Unknown error' });
    }
  }
}

// ---------------------------------------------------------------------------
// RestProxy
// ---------------------------------------------------------------------------

export interface RestProxyConfig extends AjaxProxyConfig {
  appendId?: boolean;
}

export class RestProxy extends AjaxProxy {
  private appendId: boolean;

  constructor(config: RestProxyConfig) {
    super(config);
    this.appendId = config.appendId ?? true;
  }

  protected override buildUrl(operation: Operation, action: string): string {
    let base = this.api[action] ?? this.url;

    // Append record ID for single-record operations
    if (this.appendId && action !== 'create' && operation.records.length === 1) {
      const id = operation.records[0].getId();
      if (id !== undefined && id !== null && id !== 0 && id !== '') {
        base = `${base}/${id}`;
      }
    }

    // Add query params for read
    const params = { ...operation.params };
    if (operation.start !== undefined) params.start = operation.start;
    if (operation.limit !== undefined) params.limit = operation.limit;
    if (operation.page !== undefined) params.page = operation.page;

    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');

    return qs ? `${base}?${qs}` : base;
  }
}
