/**
 * @framesquared/data – ModelCollection
 *
 * A lightweight collection of Model instances, used by HasMany and
 * ManyToMany associations.  Provides add/remove/filter/getById.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Model } from './Model.js';

export class ModelCollection {
  private items: Model[] = [];

  getCount(): number {
    return this.items.length;
  }

  getAll(): Model[] {
    return [...this.items];
  }

  add(record: Model): void {
    if (!this.items.includes(record)) {
      this.items.push(record);
    }
  }

  remove(record: Model): void {
    const idx = this.items.indexOf(record);
    if (idx !== -1) this.items.splice(idx, 1);
  }

  getById(id: string | number): Model | undefined {
    return this.items.find((r) => r.getId() === id);
  }

  filter(fn: (record: Model) => boolean): Model[] {
    return this.items.filter(fn);
  }

  destroyAll(): void {
    for (const item of this.items) {
      if (!item.isDestroyed) item.destroy();
    }
    this.items.length = 0;
  }
}

/**
 * Extended collection for ManyToMany that exposes link/unlink semantics.
 */
export class ManyToManyCollection extends ModelCollection {
  private junctions: Map<Model, any> = new Map();

  link(record: Model, _junctionData?: Record<string, unknown>): void {
    this.add(record);
    this.junctions.set(record, _junctionData ?? {});
  }

  unlink(record: Model): void {
    this.remove(record);
    this.junctions.delete(record);
  }
}
