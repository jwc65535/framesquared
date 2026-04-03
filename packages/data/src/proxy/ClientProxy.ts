/**
 * @framesquared/data – Client Proxies
 *
 * MemoryProxy, LocalStorageProxy, SessionStorageProxy
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Operation } from '../Operation.js';
import { ResultSet } from '../ResultSet.js';
import { Proxy } from './Proxy.js';
import type { ProxyConfig } from './Proxy.js';

// ---------------------------------------------------------------------------
// MemoryProxy
// ---------------------------------------------------------------------------

export interface MemoryProxyConfig extends ProxyConfig {
  data?: Record<string, unknown>[];
}

export class MemoryProxy extends Proxy {
  private store: Record<string, unknown>[];

  constructor(config: MemoryProxyConfig) {
    super(config);
    this.store = config.data ? [...config.data] : [];
  }

  async read(operation: Operation): Promise<ResultSet> {
    let data = [...this.store];

    // Local filtering
    if (operation.filters && operation.filters.length > 0) {
      data = data.filter((raw) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return operation.filters!.every((f: any) => {
          const fieldVal = raw[f.property];
          const op = f.operator ?? '=';
          switch (op) {
            case '=':
              return fieldVal === f.value;
            case '!=':
              return fieldVal !== f.value;
            case '<':
              return (fieldVal as number) < f.value;
            case '<=':
              return (fieldVal as number) <= f.value;
            case '>':
              return (fieldVal as number) > f.value;
            case '>=':
              return (fieldVal as number) >= f.value;
            default:
              return true;
          }
        });
      });
    }

    // Local sorting
    if (operation.sorters && operation.sorters.length > 0) {
      data.sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        for (const sorter of operation.sorters!) {
          const va = a[sorter.property] as string | number;
          const vb = b[sorter.property] as string | number;
          const dir = sorter.direction === 'DESC' ? -1 : 1;
          if (va < vb) return -1 * dir;
          if (va > vb) return 1 * dir;
        }
        return 0;
      });
    }

    const total = data.length;

    // Local paging
    if (operation.start !== undefined || operation.limit !== undefined) {
      const start = operation.start ?? 0;
      const limit = operation.limit ?? data.length;
      data = data.slice(start, start + limit);
    }

    const records = data.map((raw) => this.model.create(raw));
    return new ResultSet({ records, total, success: true });
  }

  async create(operation: Operation): Promise<ResultSet> {
    for (const record of operation.records) {
      this.store.push(record.getData());
    }
    return new ResultSet({ records: operation.records, success: true });
  }

  async update(operation: Operation): Promise<ResultSet> {
    for (const record of operation.records) {
      const id = record.getId();
      const idProp = (this.model as any).idProperty ?? 'id';
      const idx = this.store.findIndex((r) => r[idProp] === id);
      if (idx !== -1) {
        this.store[idx] = record.getData();
      }
    }
    return new ResultSet({ records: operation.records, success: true });
  }

  async destroy(operation: Operation): Promise<ResultSet> {
    for (const record of operation.records) {
      const id = record.getId();
      const idProp = (this.model as any).idProperty ?? 'id';
      const idx = this.store.findIndex((r) => r[idProp] === id);
      if (idx !== -1) {
        this.store.splice(idx, 1);
      }
    }
    return new ResultSet({ records: operation.records, success: true });
  }
}

// ---------------------------------------------------------------------------
// WebStorageProxy (shared logic for localStorage / sessionStorage)
// ---------------------------------------------------------------------------

export interface WebStorageProxyConfig extends ProxyConfig {
  id: string;
}

abstract class WebStorageProxy extends Proxy {
  protected storageId: string;
  protected abstract getStorage(): Storage;

  constructor(config: WebStorageProxyConfig) {
    super(config);
    this.storageId = config.id;
  }

  private loadAll(): Record<string, unknown>[] {
    const raw = this.getStorage().getItem(this.storageId);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Record<string, unknown>[];
    } catch {
      return [];
    }
  }

  private saveAll(data: Record<string, unknown>[]): void {
    this.getStorage().setItem(this.storageId, JSON.stringify(data));
  }

  async read(_operation: Operation): Promise<ResultSet> {
    const data = this.loadAll();
    const records = data.map((raw) => this.model.create(raw));
    return new ResultSet({ records, success: true });
  }

  async create(operation: Operation): Promise<ResultSet> {
    const data = this.loadAll();
    for (const record of operation.records) {
      data.push(record.getData({ serialize: true }));
    }
    this.saveAll(data);
    return new ResultSet({ records: operation.records, success: true });
  }

  async update(operation: Operation): Promise<ResultSet> {
    const data = this.loadAll();
    const idProp = (this.model as any).idProperty ?? 'id';
    for (const record of operation.records) {
      const id = record.getId();
      const idx = data.findIndex((r) => r[idProp] === id);
      if (idx !== -1) {
        data[idx] = record.getData({ serialize: true });
      }
    }
    this.saveAll(data);
    return new ResultSet({ records: operation.records, success: true });
  }

  async destroy(operation: Operation): Promise<ResultSet> {
    let data = this.loadAll();
    const idProp = (this.model as any).idProperty ?? 'id';
    for (const record of operation.records) {
      const id = record.getId();
      data = data.filter((r) => r[idProp] !== id);
    }
    this.saveAll(data);
    return new ResultSet({ records: operation.records, success: true });
  }
}

// ---------------------------------------------------------------------------
// LocalStorageProxy
// ---------------------------------------------------------------------------

export class LocalStorageProxy extends WebStorageProxy {
  protected getStorage(): Storage {
    return localStorage;
  }
}

// ---------------------------------------------------------------------------
// SessionStorageProxy
// ---------------------------------------------------------------------------

export class SessionStorageProxy extends WebStorageProxy {
  protected getStorage(): Storage {
    return sessionStorage;
  }
}
