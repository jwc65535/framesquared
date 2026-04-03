/**
 * @framesquared/dd – DragManager
 *
 * Singleton that manages all drag operations globally.
 * Tracks registered Droppables and coordinates hit-testing
 * during active drags.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { DragData } from './DragData.js';

export interface DropTarget {
  el: HTMLElement;
  accept: string[];
  disabled: boolean;
  overCls: string;
  onDragEnter?: (data: DragData) => boolean | void;
  onDragOver?: (data: DragData) => void;
  onDragLeave?: (data: DragData) => void;
  onDrop?: (data: DragData) => boolean | void;
}

let dragging = false;
const dropTargets: DropTarget[] = [];
let currentOverTarget: DropTarget | null = null;

function hitTest(target: DropTarget, x: number, y: number): boolean {
  const rect = target.el.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function groupsMatch(dragGroups: string[], acceptGroups: string[]): boolean {
  if (acceptGroups.length === 0) return true;
  return dragGroups.some((g) => acceptGroups.includes(g));
}

export const DragManager = {
  isDragging(): boolean {
    return dragging;
  },

  setDragging(value: boolean): void {
    dragging = value;
  },

  registerDropTarget(target: DropTarget): void {
    if (!dropTargets.includes(target)) dropTargets.push(target);
  },

  unregisterDropTarget(target: DropTarget): void {
    const idx = dropTargets.indexOf(target);
    if (idx >= 0) dropTargets.splice(idx, 1);
  },

  /** Called during pointermove to check drop targets. */
  notifyMove(data: DragData, x: number, y: number): void {
    let overTarget: DropTarget | null = null;

    for (const target of dropTargets) {
      if (target.disabled) continue;
      if (!groupsMatch(data.groups, target.accept)) continue;
      if (hitTest(target, x, y)) {
        overTarget = target;
        break;
      }
    }

    // Leave previous target
    if (currentOverTarget && currentOverTarget !== overTarget) {
      if (currentOverTarget.overCls) {
        currentOverTarget.el.classList.remove(currentOverTarget.overCls);
      }
      currentOverTarget.onDragLeave?.(data);
      currentOverTarget = null;
    }

    // Enter new target
    if (overTarget && overTarget !== currentOverTarget) {
      currentOverTarget = overTarget;
      if (overTarget.overCls) {
        overTarget.el.classList.add(overTarget.overCls);
      }
      overTarget.onDragEnter?.(data);
    }

    // Over current target
    if (currentOverTarget) {
      currentOverTarget.onDragOver?.(data);
    }
  },

  /** Called on pointerup to finalize drop. */
  notifyDrop(data: DragData, _x: number, _y: number): boolean {
    let dropped = false;

    if (currentOverTarget) {
      if (currentOverTarget.overCls) {
        currentOverTarget.el.classList.remove(currentOverTarget.overCls);
      }
      currentOverTarget.onDrop?.(data);
      dropped = true;
      currentOverTarget = null;
    }

    return dropped;
  },

  reset(): void {
    dragging = false;
    currentOverTarget = null;
    dropTargets.length = 0;
  },
};
