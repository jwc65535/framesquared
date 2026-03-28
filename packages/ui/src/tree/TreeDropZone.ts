/**
 * @framesquared/ui – TreeDropZone
 *
 * Drop target for tree drag-and-drop.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import type { DragData, TreePanelLike } from './TreeDragZone.js';

// ---------------------------------------------------------------------------
// TreeDropZone
// ---------------------------------------------------------------------------

export class TreeDropZone {
  private tree: TreePanelLike & { getStore(): { insertBefore: Function; appendChild: Function } };
  ddGroup: string;
  private appendOnly: boolean;
  private sortOnDrop: boolean;
  private indicatorEl: HTMLElement | null = null;
  private expandTimer: ReturnType<typeof setTimeout> | null = null;
  expandDelay: number;

  private boundDragOver: (e: DragEvent) => void;
  private boundDrop: (e: DragEvent) => void;

  constructor(
    tree: TreePanelLike & { getStore(): { insertBefore: Function; appendChild: Function } },
    config?: {
      ddGroup?: string;
      appendOnly?: boolean;
      sortOnDrop?: boolean;
      expandDelay?: number;
    },
  ) {
    this.tree = tree;
    this.ddGroup = config?.ddGroup ?? 'TreeDD';
    this.appendOnly = config?.appendOnly ?? false;
    this.sortOnDrop = config?.sortOnDrop ?? false;
    this.expandDelay = config?.expandDelay ?? 500;
    this.boundDragOver = this.onDragOver.bind(this);
    this.boundDrop = this.onDrop.bind(this);
    this.init();
  }

  private init(): void {
    const el = this.tree.getView().el;
    if (!el) return;
    el.addEventListener('dragover', this.boundDragOver);
    el.addEventListener('drop', this.boundDrop);
  }

  // -------------------------------------------------------------------------
  // Drop position calculation
  // -------------------------------------------------------------------------

  getDropPosition(
    targetEl: HTMLElement,
    clientY: number,
  ): 'before' | 'after' | 'append' {
    if (this.appendOnly) return 'append';

    const rect = targetEl.getBoundingClientRect();
    const relY = clientY - rect.top;
    const height = rect.height;

    if (relY < height * 0.25) return 'before';
    if (relY > height * 0.75) return 'after';
    return 'append';
  }

  // -------------------------------------------------------------------------
  // Execute drop
  // -------------------------------------------------------------------------

  executeDrop(
    dragData: DragData,
    targetNode: NodeInterface,
    position: 'before' | 'after' | 'append',
  ): void {
    const store = this.tree.getStore();

    for (const record of dragData.records) {
      if (position === 'append') {
        store.appendChild(targetNode, record);
      } else if (position === 'before') {
        if (targetNode.parentNode) {
          store.insertBefore(record, targetNode);
        }
      } else {
        // 'after' — insert before next sibling or append
        if (targetNode.nextSibling) {
          store.insertBefore(record, targetNode.nextSibling);
        } else if (targetNode.parentNode) {
          store.appendChild(targetNode.parentNode, record);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  private onDragOver(e: DragEvent): void {
    e.preventDefault();
  }

  private onDrop(e: DragEvent): void {
    e.preventDefault();
    this.clearExpandTimer();
  }

  private clearExpandTimer(): void {
    if (this.expandTimer !== null) {
      clearTimeout(this.expandTimer);
      this.expandTimer = null;
    }
  }

  private removeIndicator(): void {
    if (this.indicatorEl?.parentNode) {
      this.indicatorEl.parentNode.removeChild(this.indicatorEl);
    }
    this.indicatorEl = null;
  }

  destroy(): void {
    const el = this.tree.getView().el;
    if (el) {
      el.removeEventListener('dragover', this.boundDragOver);
      el.removeEventListener('drop', this.boundDrop);
    }
    this.clearExpandTimer();
    this.removeIndicator();
  }
}
