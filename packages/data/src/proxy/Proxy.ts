/**
 * @framesquared/data – Proxy (abstract base)
 */

import type { Model } from '../Model.js';
import type { Operation } from '../Operation.js';
import type { ResultSet } from '../ResultSet.js';

export interface BatchOptions {
  create?: Model[];
  update?: Model[];
  destroy?: Model[];
}

export interface Batch {
  success: boolean;
  results: ResultSet[];
}

export interface ProxyConfig {
  model: typeof Model;
  [key: string]: unknown;
}

export abstract class Proxy {
  readonly model: typeof Model;

  constructor(config: ProxyConfig) {
    this.model = config.model;
  }

  abstract read(
    records?: Model[],
    options?: { params?: Record<string, unknown>; start?: number; limit?: number; page?: number },
    signal?: AbortSignal,
  ): Promise<ResultSet>;

  abstract create(records: Model[]): Promise<ResultSet>;
  abstract update(records: Model[]): Promise<ResultSet>;
  abstract patch(records: Model[]): Promise<ResultSet>;
  abstract destroy(records: Model[]): Promise<ResultSet>;

  async batch(options: BatchOptions): Promise<Batch> {
    const results: ResultSet[] = [];
    let allSuccess = true;

    if (options.create?.length) {
      const rs = await this.create(options.create);
      results.push(rs);
      if (!rs.success) allSuccess = false;
    }

    if (options.update?.length) {
      const rs = await this.update(options.update);
      results.push(rs);
      if (!rs.success) allSuccess = false;
    }

    if (options.destroy?.length) {
      const rs = await this.destroy(options.destroy);
      results.push(rs);
      if (!rs.success) allSuccess = false;
    }

    return { success: allSuccess, results };
  }
}

// Re-export Operation so callers that still need it (e.g. advanced store integration)
// can import from a single place.
export type { Operation };
