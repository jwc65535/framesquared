/**
 * @framesquared/data – BatchProxy
 *
 * Combines multiple operations into a single HTTP request.
 * Unwraps the batch response into individual ResultSets.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Operation } from '../Operation.js';
import type { Model } from '../Model.js';
import { ResultSet } from '../ResultSet.js';
import { Proxy } from './Proxy.js';
import type { ProxyConfig } from './Proxy.js';

export interface BatchProxyConfig extends ProxyConfig {
  url: string;
  headers?: Record<string, string>;
}

export class BatchProxy extends Proxy {
  private url: string;
  private headers: Record<string, string>;

  constructor(config: BatchProxyConfig) {
    super(config);
    this.url = config.url;
    this.headers = config.headers ?? {};
  }

  /**
   * Send multiple operations as a single batched request.
   * Returns an array of ResultSets, one per operation.
   */
  async sendBatch(operations: Operation[]): Promise<ResultSet[]> {
    const body = {
      operations: operations.map((op) => ({
        action:  op.action,
        records: op.records.map((r) => r.getData()),
        params:  op.params,
      })),
    };

    try {
      const response = await fetch(this.url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...this.headers },
        body:    JSON.stringify(body),
      });

      const data    = await response.json();
      const results: ResultSet[] = [];

      if (data.results && Array.isArray(data.results)) {
        for (const r of data.results) {
          const records = (r.records ?? []).map((item: any) => this.model.create(item));
          results.push(new ResultSet({ records, success: r.success ?? false, message: r.message }));
        }
      }

      return results;
    } catch (err: any) {
      return operations.map(() =>
        new ResultSet({ records: [], success: false, message: err?.message ?? 'Batch request failed' }),
      );
    }
  }

  // Proxy interface — delegate to sendBatch with a single operation
  async read(records: Model[] = [], options: { params?: Record<string, unknown> } = {}): Promise<ResultSet> {
    const results = await this.sendBatch([new Operation({ action: 'read', records, params: options.params })]);
    return results[0] ?? new ResultSet({ records: [], success: false });
  }

  async create(records: Model[]): Promise<ResultSet> {
    const results = await this.sendBatch([new Operation({ action: 'create', records })]);
    return results[0] ?? new ResultSet({ records: [], success: false });
  }

  async update(records: Model[]): Promise<ResultSet> {
    const results = await this.sendBatch([new Operation({ action: 'update', records })]);
    return results[0] ?? new ResultSet({ records: [], success: false });
  }

  async patch(records: Model[]): Promise<ResultSet> {
    const results = await this.sendBatch([new Operation({ action: 'patch', records })]);
    return results[0] ?? new ResultSet({ records: [], success: false });
  }

  async destroy(records: Model[]): Promise<ResultSet> {
    const results = await this.sendBatch([new Operation({ action: 'destroy', records })]);
    return results[0] ?? new ResultSet({ records: [], success: false });
  }
}
