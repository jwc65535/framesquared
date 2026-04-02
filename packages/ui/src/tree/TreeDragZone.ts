/**
 * @framesquared/ui – TreeDragZone
 *
 * Drag source for tree nodes.
 */

 

import type { NodeInterface } from '@framesquared/data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DragData {
  records: NodeInterface[];
  sourceTree: TreePanelLike;
  ddGroup: string;
}

/** Minimal interface TreeDragZone needs from TreePanel */
export interface TreePanelLike {
  getView(): { el: HTMLElement | null };
  getSelection(): NodeInterface[];
}

// ---------------------------------------------------------------------------
// TreeDragZone
// ---------------------------------------------------------------------------

export class TreeDragZone {
  private tree: TreePanelLike;
  ddGroup: string;
  private dragging = false;
  private ghostEl: HTMLElement | null = null;
  dragData: DragData | null = null;
  private startX = 0;
  private startY = 0;
  private dragThreshold = 5;

  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;

  constructor(tree: TreePanelLike, config?: { ddGroup?: string }) {
    this.tree = tree;
    this.ddGroup = config?.ddGroup ?? 'TreeDD';
    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerUp = this.onPointerUp.bind(this);
    this.init();
  }

  private init(): void {
    const el = this.tree.getView().el;
    if (!el) return;
    el.addEventListener('pointerdown', this.boundPointerDown);
  }

  private onPointerDown(e: PointerEvent): void {
    const target = e.target as HTMLElement;
    // Only start drag on tree rows
    let row: HTMLElement | null = target;
    while (row && !row.hasAttribute('data-node-id')) {
      row = row.parentElement;
    }
    if (!row) return;

    this.startX = e.clientX;
    this.startY = e.clientY;

    document.addEventListener('pointermove', this.boundPointerMove);
    document.addEventListener('pointerup', this.boundPointerUp);
  }

  private onPointerMove(e: PointerEvent): void {
    const dx = Math.abs(e.clientX - this.startX);
    const dy = Math.abs(e.clientY - this.startY);

    if (!this.dragging && (dx > this.dragThreshold || dy > this.dragThreshold)) {
      this.dragging = true;
      const selected = this.tree.getSelection();
      this.dragData = {
        records: selected.length > 0 ? selected : [],
        sourceTree: this.tree,
        ddGroup: this.ddGroup,
      };
      this.createGhost();
    }

    if (this.dragging && this.ghostEl) {
      this.ghostEl.style.left = `${e.clientX + 10}px`;
      this.ghostEl.style.top = `${e.clientY + 10}px`;
    }
  }

  private onPointerUp(_e: PointerEvent): void {
    this.dragging = false;
    this.removeGhost();
    this.dragData = null;
    document.removeEventListener('pointermove', this.boundPointerMove);
    document.removeEventListener('pointerup', this.boundPointerUp);
  }

  private createGhost(): void {
    this.ghostEl = document.createElement('div');
    this.ghostEl.className = 'x-dd-drag-ghost';
    this.ghostEl.style.cssText =
      'position:fixed;pointer-events:none;z-index:99999;background:#fff;border:1px solid #aaa;padding:4px 8px;';
    const count = this.dragData?.records.length ?? 0;
    this.ghostEl.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    document.body.appendChild(this.ghostEl);
  }

  private removeGhost(): void {
    if (this.ghostEl?.parentNode) {
      this.ghostEl.parentNode.removeChild(this.ghostEl);
    }
    this.ghostEl = null;
  }

  isDragging(): boolean {
    return this.dragging;
  }

  destroy(): void {
    const el = this.tree.getView().el;
    if (el) {
      el.removeEventListener('pointerdown', this.boundPointerDown);
    }
    document.removeEventListener('pointermove', this.boundPointerMove);
    document.removeEventListener('pointerup', this.boundPointerUp);
    this.removeGhost();
    this.dragData = null;
  }
}
