/**
 * @framesquared/data – Server Proxies
 *
 * AjaxProxy (fetch-based) and RestProxy (RESTful URL patterns).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Operation } from '../Operation.js';
import { ResultSet } from '../ResultSet.js';
import { JsonReader } from '../reader/Reader.js';
import { JsonWriter } from '../writer/Writer.js';
import { Proxy } from './Proxy.js';
import type { ProxyConfig } from './Proxy.js';

// ---------------------------------------------------------------------------
// AjaxProxy
// ---------------------------------------------------------------------------

export interface AjaxProxyConfig extends ProxyConfig {
  url: string;
  api?: Partial<Record<string, string>>;
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
}

const ACTION_METHODS: Record<string, string> = {
  read: 'GET',
  create: 'POST',
  update: 'PUT',
  destroy: 'DELETE',
};

export class AjaxProxy extends Proxy {
  protected url: string;
  protected api: Partial<Record<string, string>>;
  protected headers: Record<string, string>;
  protected timeout: number;
  protected withCredentials: boolean;
  protected reader: JsonReader;
  protected writer: JsonWriter;

  constructor(config: AjaxProxyConfig) {
    super(config);
    this.url = config.url;
    this.api = config.api ?? {};
    this.headers = config.headers ?? {};
    this.timeout = config.timeout ?? 30000;
    this.withCredentials = config.withCredentials ?? false;
    this.reader = new JsonReader({ model: config.model });
    this.writer = new JsonWriter({});
  }

  async read(operation: Operation, signal?: AbortSignal): Promise<ResultSet> {
    return this.doRequest(operation, 'read', signal);
  }

  async create(operation: Operation): Promise<ResultSet> {
    return this.doRequest(operation, 'create');
  }

  async update(operation: Operation): Promise<ResultSet> {
    return this.doRequest(operation, 'update');
  }

  async destroy(operation: Operation): Promise<ResultSet> {
    return this.doRequest(operation, 'destroy');
  }

  protected buildUrl(operation: Operation, action: string): string {
    const base = this.api[action] ?? this.url;
    const params = { ...operation.params };

    // Add paging params
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

    const init: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      credentials: this.withCredentials ? 'include' : 'same-origin',
      signal,
    };

    if (method !== 'GET' && operation.records.length > 0) {
      init.body = JSON.stringify(this.writer.write(operation.records));
    }

    try {
      const response = await fetch(url, init);

      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
          const body = await response.json();
          if (body?.message) message = body.message;
        } catch {
          /* ignore */
        }
        return new ResultSet({ records: [], success: false, message });
      }

      const data = await response.json();

      // For read, parse through reader
      if (action === 'read') {
        return this.reader.read(data);
      }

      // For CUD, build a simple result
      const records = Array.isArray(data)
        ? data.map((d: any) => this.model.create(d))
        : data && typeof data === 'object' && 'id' in data
          ? [this.model.create(data)]
          : operation.records;

      return new ResultSet({ records, success: true });
    } catch (err: any) {
      return new ResultSet({
        records: [],
        success: false,
        message: err?.message ?? 'Unknown error',
      });
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
