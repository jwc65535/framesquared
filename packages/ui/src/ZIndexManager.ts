/**
 * @ext-ts/ui – ZIndexManager
 *
 * Manages z-index stack for floating components (Windows, menus, etc.).
 * Tracks registration order; bringToFront/sendToBack reorder and
 * reassign z-indices.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@ext-ts/component';

const BASE_Z = 9000;

export class ZIndexManager {
  private static instance: ZIndexManager | null = null;

  /** Ordered stack, lowest first, highest last. */
  private stack: Component[] = [];

  private constructor() {}

  static getInstance(): ZIndexManager {
    if (!ZIndexManager.instance) {
      ZIndexManager.instance = new ZIndexManager();
    }
    return ZIndexManager.instance;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  register(component: Component): void {
    if (!this.stack.includes(component)) {
      this.stack.push(component);
      this.syncZIndices();
    }
  }

  unregister(component: Component): void {
    const idx = this.stack.indexOf(component);
    if (idx !== -1) {
      this.stack.splice(idx, 1);
      this.syncZIndices();
    }
  }

  bringToFront(component: Component): void {
    const idx = this.stack.indexOf(component);
    if (idx === -1) return;
    this.stack.splice(idx, 1);
    this.stack.push(component);
    this.syncZIndices();

    // Fire activate on the component
    if (typeof (component as any).fireEvent === 'function') {
      (component as any).fireEvent('activate', component);
    }
  }

  sendToBack(component: Component): void {
    const idx = this.stack.indexOf(component);
    if (idx === -1) return;
    this.stack.splice(idx, 1);
    this.stack.unshift(component);
    this.syncZIndices();
  }

  /** Returns the topmost (active) component. */
  getActive(): Component | undefined {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : undefined;
  }

  /** Iterates from highest z to lowest. */
  eachTopDown(fn: (component: Component) => void): void {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      fn(this.stack[i]);
    }
  }

  clear(): void {
    this.stack.length = 0;
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private syncZIndices(): void {
    for (let i = 0; i < this.stack.length; i++) {
      const cmp = this.stack[i];
      if (cmp.el) {
        cmp.el.style.zIndex = String(BASE_Z + i * 10);
      }
    }
  }
}
