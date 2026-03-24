/**
 * @ext-ts/data – Session
 *
 * Manages a set of related model instances.  Tracks all CRUD
 * operations as a unit.  save() sends all changes via a BatchProxy.
 * commit()/reject() clear tracked changes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Model } from '../Model.js';
import { Operation } from '../Operation.js';
import type { BatchProxy } from '../proxy/BatchProxy.js';
import type { ResultSet } from '../ResultSet.js';

export interface SessionChanges {
  create: Model[];
  update: Model[];
  destroy: Model[];
}

export class Session {
  private created = new Map<unknown, Model>();
  private updated = new Map<unknown, Model>();
  private destroyed = new Map<unknown, Model>();

  // -----------------------------------------------------------------------
  // Track operations
  // -----------------------------------------------------------------------

  trackCreate(record: Model): void {
    const key = this.recordKey(record);
    this.created.set(key, record);
  }

  trackUpdate(record: Model): void {
    const key = this.recordKey(record);
    // If already in created, keep it there (it's still a create)
    if (this.created.has(key)) return;
    this.updated.set(key, record);
  }

  trackDestroy(record: Model): void {
    const key = this.recordKey(record);
    // If it was newly created, just remove from created
    if (this.created.has(key)) {
      this.created.delete(key);
      return;
    }
    // Remove from updated if present
    this.updated.delete(key);
    this.destroyed.set(key, record);
  }

  // -----------------------------------------------------------------------
  // Accessors
  // -----------------------------------------------------------------------

  getCreated(): Model[] { return [...this.created.values()]; }
  getUpdated(): Model[] { return [...this.updated.values()]; }
  getDestroyed(): Model[] { return [...this.destroyed.values()]; }

  getChanges(): SessionChanges {
    return {
      create: this.getCreated(),
      update: this.getUpdated(),
      destroy: this.getDestroyed(),
    };
  }

  isDirty(): boolean {
    return this.created.size > 0 || this.updated.size > 0 || this.destroyed.size > 0;
  }

  // -----------------------------------------------------------------------
  // Save via BatchProxy
  // -----------------------------------------------------------------------

  async save(proxy: BatchProxy): Promise<{ success: boolean; results: ResultSet[] }> {
    const ops: Operation[] = [];
    const creates = this.getCreated();
    const updates = this.getUpdated();
    const destroys = this.getDestroyed();

    if (creates.length > 0) {
      ops.push(new Operation({ action: 'create', records: creates }));
    }
    if (updates.length > 0) {
      ops.push(new Operation({ action: 'update', records: updates }));
    }
    if (destroys.length > 0) {
      ops.push(new Operation({ action: 'destroy', records: destroys }));
    }

    if (ops.length === 0) {
      return { success: true, results: [] };
    }

    const results = await proxy.sendBatch(ops);
    const success = results.every(r => r.success);
    return { success, results };
  }

  // -----------------------------------------------------------------------
  // Commit / Reject
  // -----------------------------------------------------------------------

  commit(): void {
    this.created.clear();
    this.updated.clear();
    this.destroyed.clear();
  }

  reject(): void {
    this.created.clear();
    this.updated.clear();
    this.destroyed.clear();
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private recordKey(record: Model): unknown {
    // Use record identity (reference) as Map key for dedup
    return record;
  }
}
