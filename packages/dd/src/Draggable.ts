/**
 * @framesquared/dd – Draggable
 *
 * Makes an element draggable.  Supports drag handles, axis lock,
 * snap-to-grid, constraint, and proxy modes.  Integrates with
 * DragManager for drop target detection.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { DragManager } from './DragManager.js';
import type { DragData } from './DragData.js';

export interface DraggableConfig {
  el: HTMLElement;
  handle?: string;
  constrainTo?: HTMLElement | 'parent' | 'viewport';
  axis?: 'x' | 'y';
  snap?: { x: number; y: number };
  proxy?: boolean;
  ghostCls?: string;
  groups?: string[];
  disabled?: boolean;
  threshold?: number;
  data?: Record<string, unknown>;
  onDragStart?: (data: DragData) => void;
  onDrag?: (data: DragData) => void;
  onDragEnd?: (data: DragData) => void;
}

export class Draggable {
  readonly el: HTMLElement;
  private handle: string | null;
  private constrainTo: HTMLElement | 'parent' | 'viewport' | null;
  private axis: 'x' | 'y' | null;
  private snap: { x: number; y: number } | null;
  private useProxy: boolean;
  private groups: string[];
  private disabled: boolean;
  private threshold: number;
  private userData: Record<string, unknown>;

  private onDragStartCb: ((data: DragData) => void) | null;
  private onDragCb: ((data: DragData) => void) | null;
  private onDragEndCb: ((data: DragData) => void) | null;

  private startX = 0;
  private startY = 0;
  private elStartX = 0;
  private elStartY = 0;
  private _dragging = false;
  private _started = false;
  private dragData: DragData | null = null;

  private moveHandler: ((e: PointerEvent) => void) | null = null;
  private upHandler: ((e: PointerEvent) => void) | null = null;

  constructor(config: DraggableConfig) {
    this.el = config.el;
    this.handle = config.handle ?? null;
    this.constrainTo = config.constrainTo ?? null;
    this.axis = config.axis ?? null;
    this.snap = config.snap ?? null;
    this.useProxy = config.proxy ?? true;
    this.groups = config.groups ?? [];
    this.disabled = config.disabled ?? false;
    this.threshold = config.threshold ?? 3;
    this.userData = config.data ?? {};
    this.onDragStartCb = config.onDragStart ?? null;
    this.onDragCb = config.onDrag ?? null;
    this.onDragEndCb = config.onDragEnd ?? null;

    this.el.addEventListener('pointerdown', (e: PointerEvent) => this.onPointerDown(e));
  }

  // -----------------------------------------------------------------------
  // Pointer handlers
  // -----------------------------------------------------------------------

  private onPointerDown(e: PointerEvent): void {
    if (this.disabled) return;

    // Check handle
    if (this.handle) {
      const target = e.target as HTMLElement;
      if (!target.closest(this.handle)) return;
    }

    e.preventDefault();
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.elStartX = parseInt(this.el.style.left || '0', 10);
    this.elStartY = parseInt(this.el.style.top || '0', 10);
    this._dragging = true;
    this._started = false;

    this.moveHandler = (me: PointerEvent) => this.onPointerMove(me);
    this.upHandler = (ue: PointerEvent) => this.onPointerUp(ue);
    document.addEventListener('pointermove', this.moveHandler);
    document.addEventListener('pointerup', this.upHandler);
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this._dragging) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    // Check threshold
    if (!this._started) {
      if (Math.abs(dx) < this.threshold && Math.abs(dy) < this.threshold) return;
      this._started = true;
      DragManager.setDragging(true);

      this.dragData = {
        source: this,
        sourceEl: this.el,
        groups: this.groups,
        data: this.userData,
        startX: this.startX,
        startY: this.startY,
        currentX: e.clientX,
        currentY: e.clientY,
      };

      this.onDragStartCb?.(this.dragData);
    }

    if (!this.dragData) return;
    this.dragData.currentX = e.clientX;
    this.dragData.currentY = e.clientY;

    // Compute position
    let newX = this.elStartX + dx;
    let newY = this.elStartY + dy;

    // Axis lock
    if (this.axis === 'x') newY = this.elStartY;
    if (this.axis === 'y') newX = this.elStartX;

    // Snap
    if (this.snap) {
      newX = Math.round(newX / this.snap.x) * this.snap.x;
      newY = Math.round(newY / this.snap.y) * this.snap.y;
    }

    // Constrain
    if (this.constrainTo) {
      const bounds = this.getConstrainBounds();
      if (bounds) {
        const elW = this.el.offsetWidth || parseInt(this.el.style.width || '0', 10);
        const elH = this.el.offsetHeight || parseInt(this.el.style.height || '0', 10);
        newX = Math.max(bounds.left, Math.min(newX, bounds.right - elW));
        newY = Math.max(bounds.top, Math.min(newY, bounds.bottom - elH));
      }
    }

    // Apply position (direct move when proxy:false)
    if (!this.useProxy) {
      this.el.style.left = `${newX}px`;
      this.el.style.top = `${newY}px`;
    }

    // Notify DragManager for drop targets
    DragManager.notifyMove(this.dragData, e.clientX, e.clientY);

    this.onDragCb?.(this.dragData);
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.moveHandler) document.removeEventListener('pointermove', this.moveHandler);
    if (this.upHandler) document.removeEventListener('pointerup', this.upHandler);
    this.moveHandler = null;
    this.upHandler = null;

    if (this._started && this.dragData) {
      DragManager.notifyDrop(this.dragData, e.clientX, e.clientY);
      this.onDragEndCb?.(this.dragData);
    }

    this._dragging = false;
    this._started = false;
    this.dragData = null;
    DragManager.setDragging(false);
  }

  // -----------------------------------------------------------------------
  // Constraint bounds
  // -----------------------------------------------------------------------

  private getConstrainBounds(): { left: number; top: number; right: number; bottom: number } | null {
    if (this.constrainTo === 'viewport') {
      return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    }
    if (this.constrainTo === 'parent') {
      const parent = this.el.parentElement;
      if (!parent) return null;
      const r = parent.getBoundingClientRect();
      return { left: 0, top: 0, right: r.width, bottom: r.height };
    }
    if (this.constrainTo instanceof HTMLElement) {
      const r = this.constrainTo.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }
    return null;
  }

  // -----------------------------------------------------------------------
  // Public
  // -----------------------------------------------------------------------

  setDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  destroy(): void {
    if (this.moveHandler) document.removeEventListener('pointermove', this.moveHandler);
    if (this.upHandler) document.removeEventListener('pointerup', this.upHandler);
  }
}
