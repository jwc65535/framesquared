/**
 * @framesquared/data – ResultSet
 */

import type { Model } from './Model.js';

export interface ResultSetConfig {
  records: Model[];
  total?: number;
  success: boolean;
  message?: string;
}

export class ResultSet {
  readonly records: Model[];
  readonly total: number;
  readonly success: boolean;
  readonly message: string | undefined;

  constructor(config: ResultSetConfig) {
    this.records = config.records;
    this.total = config.total ?? config.records.length;
    this.success = config.success;
    this.message = config.message;
  }
}
