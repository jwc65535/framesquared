/**
 * @framesquared/data – Proxy (abstract base)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Model } from '../Model.js';
import type { Operation } from '../Operation.js';
import { ResultSet } from '../ResultSet.js';

export interface BatchOptions {
  create?: Model[];
  update?: Model[];
  destroy?: Model[];
}

export interface Batch {
  success: boolean;
  operations: Operation[];
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

  abstract read(operation: Operation, signal?: AbortSignal): Promise<ResultSet>;
  abstract create(operation: Operation): Promise<ResultSet>;
  abstract update(operation: Operation): Promise<ResultSet>;
  abstract destroy(operation: Operation): Promise<ResultSet>;

  async batch(options: BatchOptions): Promise<Batch> {
    const { Operation: OpClass } = await import('../Operation.js');
    const operations: Operation[] = [];
    let allSuccess = true;

    if (options.create && options.create.length > 0) {
      const op = new OpClass({ action: 'create', records: options.create });
      const rs = await this.create(op);
      op.setResult(rs);
      operations.push(op);
      if (!rs.success) allSuccess = false;
    }

    if (options.update && options.update.length > 0) {
      const op = new OpClass({ action: 'update', records: options.update });
      const rs = await this.update(op);
      op.setResult(rs);
      operations.push(op);
      if (!rs.success) allSuccess = false;
    }

    if (options.destroy && options.destroy.length > 0) {
      const op = new OpClass({ action: 'destroy', records: options.destroy });
      const rs = await this.destroy(op);
      op.setResult(rs);
      operations.push(op);
      if (!rs.success) allSuccess = false;
    }

    return { success: allSuccess, operations };
  }
}
