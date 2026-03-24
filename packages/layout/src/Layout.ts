/**
 * @framesquared/layout – Layout (base class)
 *
 * Abstract base for all layout managers.  Manages the lifecycle
 * (beginLayout → calculate → completeLayout → afterLayout), size
 * policy determination, and item rendering into a target element.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@framesquared/component';
import type { LayoutContext } from './LayoutContext.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SizePolicy {
  width: 'shrinkWrap' | 'configured' | 'natural';
  height: 'shrinkWrap' | 'configured' | 'natural';
}

export interface LayoutConfig {
  type?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export class Layout {
  readonly type: string;
  owner: Component | null = null;
  isRunning = false;
  needsLayout = true;

  constructor(config: LayoutConfig = {}) {
    this.type = config.type ?? 'auto';
  }

  /**
   * Sets the Container that owns this layout.
   */
  setOwner(owner: Component): void {
    this.owner = owner;
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Called at the start of a layout run.  Sets isRunning flag.
   * Override to gather initial measurements.
   */
  beginLayout(_context: LayoutContext): void {
    this.isRunning = true;
  }

  /**
   * Main calculation phase.  Override in subclasses to compute
   * child sizes and positions.
   */
  calculate(_context: LayoutContext): void {
    // Base implementation is a no-op
  }

  /**
   * Called after calculation is complete.  Clears flags.
   * Override to finalize DOM writes.
   */
  completeLayout(_context: LayoutContext): void {
    this.isRunning = false;
    this.needsLayout = false;
  }

  /**
   * Called after the entire layout pass is done.
   * Override for post-layout work (e.g., firing events).
   */
  afterLayout(): void {
    // Base implementation is a no-op
  }

  // -----------------------------------------------------------------------
  // Size policy
  // -----------------------------------------------------------------------

  /**
   * Returns the size policy for a child item.
   * 'configured' = the item has an explicit width/height config.
   * 'natural' = the item uses its natural content size.
   * 'shrinkWrap' = the item wraps its content.
   */
  getItemSizePolicy(item: Component): SizePolicy {
    const cfg = (item as any)._config ?? {};
    return {
      width: cfg.width !== undefined ? 'configured' : 'natural',
      height: cfg.height !== undefined ? 'configured' : 'natural',
    };
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  /**
   * Renders child components into the target element.
   * Base implementation renders each item sequentially.
   */
  renderItems(items: Component[], target: Element): void {
    for (const item of items) {
      if (!item.rendered) {
        item.render(target);
      }
    }
  }
}
