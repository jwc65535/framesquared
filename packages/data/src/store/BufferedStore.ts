/**
 * @ext-ts/data – BufferedStore
 *
 * For large datasets — loads pages of data on demand via a proxy.
 * Uses a sparse page map instead of loading all records.
 * Prefetches adjacent pages based on configurable buffer zones.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Base, Observable } from '@ext-ts/core';
import type { Model } from '../Model.js';
import { Operation } from '../Operation.js';

// ---------------------------------------------------------------------------
// Observable bootstrap
// ---------------------------------------------------------------------------

const ObservableMixin: typeof Base = Observable;

function ensureObservable(instance: any): void {
  const proto = ObservableMixin.prototype;
  for (const name of Object.getOwnPropertyNames(proto)) {
    if (name === 'constructor') continue;
    if (name in instance) continue;
    const desc = Object.getOwnPropertyDescriptor(proto, name);
    if (desc && typeof desc.value === 'function') {
      instance[name] = desc.value.bind(instance);
    }
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface BufferedStoreConfig {
  model: typeof Model;
  pageSize?: number;
  leadingBufferZone?: number;
  trailingBufferZone?: number;
  proxy?: any;
}

// ---------------------------------------------------------------------------
// BufferedStore
// ---------------------------------------------------------------------------

export class BufferedStore extends Base {
  static override $className = 'Ext.data.BufferedStore';

  private pageSize: number;
  private leadingBufferZone: number;
  private trailingBufferZone: number;
  private proxyRef: any;

  /** Page number → array of Model records for that page. */
  private pageMap = new Map<number, Model[]>();

  /** Total count from the server. */
  private totalCount = 0;

  /** All loaded records in a flat sparse index. */
  private recordMap = new Map<number, Model>();

  /** Pages currently being fetched (to avoid duplicate requests). */
  private pendingPages = new Set<number>();

  $destroyHooks: (() => void)[] = [];

  constructor(config: BufferedStoreConfig) {
    super();
    ensureObservable(this);

    this.pageSize = config.pageSize ?? 25;
    this.leadingBufferZone = config.leadingBufferZone ?? 0;
    this.trailingBufferZone = config.trailingBufferZone ?? 0;
    this.proxyRef = config.proxy ?? null;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  getPageSize(): number {
    return this.pageSize;
  }

  getCount(): number {
    return this.recordMap.size;
  }

  getTotalCount(): number {
    return this.totalCount;
  }

  getAt(index: number): Model | undefined {
    return this.recordMap.get(index);
  }

  isPageLoaded(pageNumber: number): boolean {
    return this.pageMap.has(pageNumber);
  }

  /**
   * Ensures the given range [start, end] of row indices is loaded.
   * Loads missing pages from the proxy and fires 'guaranteedrange'
   * when the requested range is fully available.
   */
  async guaranteeRange(start: number, end: number): Promise<void> {
    const startPage = Math.floor(start / this.pageSize);
    const endPage = Math.floor(end / this.pageSize);

    // Collect pages that need loading
    const pagesToLoad: number[] = [];
    for (let p = startPage; p <= endPage; p++) {
      if (!this.pageMap.has(p) && !this.pendingPages.has(p)) {
        pagesToLoad.push(p);
      }
    }

    // Load missing pages
    if (pagesToLoad.length > 0) {
      await Promise.all(pagesToLoad.map((p) => this.loadPage(p)));
    }

    // Fire event with the records in the requested range
    const records: Model[] = [];
    for (let i = start; i <= end; i++) {
      const rec = this.recordMap.get(i);
      if (rec) records.push(rec);
    }
    this.fire('guaranteedrange', this, records, start, end);

    // Prefetch buffer zones (don't await — fire and forget)
    this.prefetchBufferZones(startPage, endPage);
  }

  // -----------------------------------------------------------------------
  // Page loading
  // -----------------------------------------------------------------------

  private async loadPage(pageNumber: number): Promise<void> {
    if (!this.proxyRef) return;
    if (this.pageMap.has(pageNumber)) return;

    this.pendingPages.add(pageNumber);

    try {
      const start = pageNumber * this.pageSize;
      const op = new Operation({
        action: 'read',
        start,
        limit: this.pageSize,
        page: pageNumber + 1, // 1-based page for server
      });

      const rs = await this.proxyRef.read(op);

      if (rs.success) {
        this.pageMap.set(pageNumber, rs.records);

        // Index records by their absolute position
        for (let i = 0; i < rs.records.length; i++) {
          this.recordMap.set(start + i, rs.records[i]);
        }

        // Update total count from server
        if (rs.total > 0) {
          this.totalCount = rs.total;
        }
      }
    } finally {
      this.pendingPages.delete(pageNumber);
    }
  }

  // -----------------------------------------------------------------------
  // Prefetching
  // -----------------------------------------------------------------------

  private prefetchBufferZones(startPage: number, endPage: number): void {
    if (this.leadingBufferZone <= 0 && this.trailingBufferZone <= 0) return;

    const leadingPages = Math.ceil(this.leadingBufferZone / this.pageSize);
    const trailingPages = Math.ceil(this.trailingBufferZone / this.pageSize);

    // Prefetch leading pages (before the requested range)
    for (let p = startPage - leadingPages; p < startPage; p++) {
      if (p >= 0 && !this.pageMap.has(p) && !this.pendingPages.has(p)) {
        this.loadPage(p); // fire and forget
      }
    }

    // Prefetch trailing pages (after the requested range)
    const maxPage = this.totalCount > 0
      ? Math.floor((this.totalCount - 1) / this.pageSize)
      : endPage + trailingPages;

    for (let p = endPage + 1; p <= endPage + trailingPages && p <= maxPage; p++) {
      if (!this.pageMap.has(p) && !this.pendingPages.has(p)) {
        this.loadPage(p); // fire and forget
      }
    }
  }

  // -----------------------------------------------------------------------
  // Event helper
  // -----------------------------------------------------------------------

  private fire(eventName: string, ...args: unknown[]): void {
    if (typeof (this as any).fireEvent === 'function') {
      (this as any).fireEvent(eventName, ...args);
    }
  }
}
