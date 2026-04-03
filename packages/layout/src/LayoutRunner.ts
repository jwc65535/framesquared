/**
 * @framesquared/layout – LayoutRunner
 *
 * Singleton that orchestrates layout runs.  Collects invalidation
 * requests and processes them in batch.  Detects and breaks layout
 * cycles to prevent infinite loops.
 *
 * Integrates with ResizeObserver to automatically invalidate
 * components when their container elements resize.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@framesquared/component';
import { Layout } from './Layout.js';
import { LayoutContext } from './LayoutContext.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum iterations before declaring a cycle. */
const MAX_ITERATIONS = 10;

// ---------------------------------------------------------------------------
// LayoutRunner
// ---------------------------------------------------------------------------

export class LayoutRunner {
  private static instance: LayoutRunner | null = null;

  /** Set of components that need a layout pass. */
  private pending = new Set<Component>();

  /** Whether a run is currently scheduled. */
  private scheduled = false;

  /** Map of element → { observer, component } for ResizeObserver tracking. */
  private observed = new Map<Element, { observer: ResizeObserver; component: Component }>();

  /** Component → ResizeObserver for cleanup. */
  private componentObservers = new Map<Component, { observer: ResizeObserver; element: Element }>();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getInstance(): LayoutRunner {
    if (!LayoutRunner.instance) {
      LayoutRunner.instance = new LayoutRunner();
    }
    return LayoutRunner.instance;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Marks a component for re-layout.
   */
  invalidate(component: Component): void {
    this.pending.add(component);
  }

  /**
   * Returns true if the component is in the pending queue.
   */
  isPending(component: Component): boolean {
    return this.pending.has(component);
  }

  /**
   * Performs a complete layout pass on all pending components.
   * Uses iterative processing with cycle detection.
   */
  run(): void {
    let iteration = 0;

    while (this.pending.size > 0 && iteration < MAX_ITERATIONS) {
      iteration++;

      // Snapshot current pending set and clear it
      const batch = [...this.pending];
      this.pending.clear();

      const ctx = new LayoutContext();

      for (const component of batch) {
        const layout = this.getLayout(component);
        if (!layout || !layout.needsLayout) continue;

        // Full lifecycle
        layout.beginLayout(ctx);
        layout.calculate(ctx);
        layout.completeLayout(ctx);
        layout.afterLayout();
      }
    }

    // If we hit MAX_ITERATIONS, clear remaining to prevent future infinite loops
    this.pending.clear();
    this.scheduled = false;
  }

  /**
   * Schedules a layout run on the next animation frame.
   * Multiple calls before the frame coalesce into a single run.
   */
  scheduleRun(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => this.run());
    } else {
      // Fallback for environments without rAF (e.g., tests)
      Promise.resolve().then(() => this.run());
    }
  }

  /**
   * Clears all pending items without running them.
   */
  clear(): void {
    this.pending.clear();
    this.scheduled = false;
  }

  // -----------------------------------------------------------------------
  // ResizeObserver integration
  // -----------------------------------------------------------------------

  /**
   * Starts watching an element for size changes.
   * When the element resizes, the associated component is invalidated.
   */
  observe(component: Component, element: Element): void {
    if (typeof ResizeObserver === 'undefined') return;

    // Don't double-observe the same component+element
    const existing = this.componentObservers.get(component);
    if (existing && existing.element === element) return;

    const observer = new ResizeObserver((_entries) => {
      this.invalidate(component);
    });

    observer.observe(element);
    this.observed.set(element, { observer, component });
    this.componentObservers.set(component, { observer, element });
  }

  /**
   * Stops watching an element for size changes.
   */
  unobserve(component: Component, element: Element): void {
    const entry = this.observed.get(element);
    if (entry && entry.component === component) {
      entry.observer.unobserve(element);
      entry.observer.disconnect();
      this.observed.delete(element);
      this.componentObservers.delete(component);
    }
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private getLayout(component: Component): Layout | null {
    // The component stores its layout instance (set by Container integration)
    const layout = (component as any)._layoutInstance;
    if (layout instanceof Layout) return layout;
    return null;
  }
}
