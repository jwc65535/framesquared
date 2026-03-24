/**
 * @ext-ts/data – Operation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Model } from './Model.js';
import type { ResultSet } from './ResultSet.js';

export type OperationAction = 'create' | 'read' | 'update' | 'destroy';

export interface OperationConfig {
  action: OperationAction;
  records?: Model[];
  params?: Record<string, unknown>;
  filters?: any[];
  sorters?: any[];
  start?: number;
  limit?: number;
  page?: number;
}

export class Operation {
  readonly action: OperationAction;
  readonly records: Model[];
  readonly params: Record<string, unknown>;
  readonly filters: any[] | undefined;
  readonly sorters: any[] | undefined;
  readonly start: number | undefined;
  readonly limit: number | undefined;
  readonly page: number | undefined;

  result: ResultSet | null = null;

  constructor(config: OperationConfig) {
    this.action = config.action;
    this.records = config.records ?? [];
    this.params = config.params ?? {};
    this.filters = config.filters;
    this.sorters = config.sorters;
    this.start = config.start;
    this.limit = config.limit;
    this.page = config.page;
  }

  setResult(rs: ResultSet): void {
    this.result = rs;
  }
}
