/**
 * @framesquared/ui – TreeGridDragDrop
 *
 * Drag-and-drop plugin for TreeGrid. Enables reparenting and reordering
 * of tree nodes via pointer events.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NodeInterface } from '@framesquared/data';
import type { TreeGrid } from './TreeGrid.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DropPosition = 'before' | 'after' | 'append';

export interface DragData {
  records: NodeInterface[];
  source: TreeGrid;
  copy: boolean;
  displayText: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridDragDropConfig {
  enableDrag?: boolean;
  enableDrop?: boolean;
  ddGroup?: string;
  appendOnly?: boolean;
  sortOnDrop?: boolean;
  allowContainerDrops?: boolean;
  expandDelay?: number;
  allowParentInserts?: boolean;
  displayField?: string;
  dragText?: string;
  copy?: boolean;
  allowCopy?: boolean;
  dropHighlightCls?: string;
  dropIndicatorCls?: string;
  nodeHighlightOnDrop?: boolean;
  containerScrollOnDrag?: boolean;
  containerScrollThreshold?: number;
  containerScrollSpeed?: number;
}

// ---------------------------------------------------------------------------
// TreeGridDragDrop
// ---------------------------------------------------------------------------

export class TreeGridDragDrop {
  private treeGrid: TreeGrid | null = null;
  private config: Required<TreeGridDragDropConfig>;

  // Drag state
  private dragging = false;
  private dragData: DragData | null = null;
  private ghostEl: HTMLElement | null = null;
  private dropIndicatorEl: HTMLElement | null = null;
  private highlightedRow: HTMLElement | null = null;
  private expandTimer: ReturnType<typeof setTimeout> | null = null;

  // Captured at pointerdown so movement/scroll can't change which node is dragged
  private _pendingRecord: NodeInterface | null = null;
  private _captureTarget: Element | null = null;
  private _pointerId: number | null = null;

  private _downX = 0;
  private _downY = 0;
  private readonly _threshold = 5;

  // Bound handlers for cleanup
  private _onPointerDown: (e: PointerEvent) => void;
  private _onPointerMove: (e: PointerEvent) => void;
  private _onPointerUp: (e: PointerEvent) => void;

  constructor(config: TreeGridDragDropConfig = {}) {
    this.config = {
      enableDrag: config.enableDrag ?? true,
      enableDrop: config.enableDrop ?? true,
      ddGroup: config.ddGroup ?? 'TreeGridDD',
      appendOnly: config.appendOnly ?? false,
      sortOnDrop: config.sortOnDrop ?? false,
      allowContainerDrops: config.allowContainerDrops ?? false,
      expandDelay: config.expandDelay ?? 500,
      allowParentInserts: config.allowParentInserts ?? true,
      displayField: config.displayField ?? 'text',
      dragText: config.dragText ?? '{0} selected node(s)',
      copy: config.copy ?? false,
      allowCopy: config.allowCopy ?? true,
      dropHighlightCls: config.dropHighlightCls ?? 'x-treegrid-drop-highlight',
      dropIndicatorCls: config.dropIndicatorCls ?? 'x-treegrid-drop-indicator',
      nodeHighlightOnDrop: config.nodeHighlightOnDrop ?? true,
      containerScrollOnDrag: config.containerScrollOnDrag ?? true,
      containerScrollThreshold: config.containerScrollThreshold ?? 40,
      containerScrollSpeed: config.containerScrollSpeed ?? 10,
    };

    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
  }

  init(treeGrid: TreeGrid): void {
    this.treeGrid = treeGrid;
    const viewEl = treeGrid.getView()?.el;
    if (!viewEl) return;
    viewEl.addEventListener('pointerdown', this._onPointerDown);
  }

  destroy(): void {
    const viewEl = this.treeGrid?.getView()?.el;
    if (viewEl) viewEl.removeEventListener('pointerdown', this._onPointerDown);
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
    this._cleanup();
    this.treeGrid = null;
  }

  // -------------------------------------------------------------------------
  // Drag start
  // -------------------------------------------------------------------------

  private _handlePointerDown(e: PointerEvent): void {
    if (!this.config.enableDrag) return;
    const record = this.treeGrid?.getView().getNodeByEvent(e);
    if (!record) return;
    if (record.isRoot()) return;
    if ((record as any).get?.('allowDrag') === false) return;

    // Prevent native text-selection and browser drag-image from interfering
    e.preventDefault();

    this._downX = e.clientX;
    this._downY = e.clientY;

    // Capture record now while we're certain which node the pointer is over
    this._pendingRecord = record;

    // setPointerCapture ensures pointermove/pointerup reach us even if the
    // pointer leaves the browser window before the user releases
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
      this._captureTarget = e.target as Element;
      this._pointerId = e.pointerId;
    } catch (_) { /* ignore — older browsers */ }

    document.addEventListener('pointermove', this._onPointerMove);
    document.addEventListener('pointerup', this._onPointerUp);
  }

  private _handlePointerMove(e: PointerEvent): void {
    if (!this.dragging) {
      const dx = Math.abs(e.clientX - this._downX);
      const dy = Math.abs(e.clientY - this._downY);
      if (dx < this._threshold && dy < this._threshold) return;

      // Start drag — use the record captured at pointerdown, not a new hit-test
      // (the view may have scrolled since the press, making re-hit-test unreliable)
      const record = this._pendingRecord;
      if (!record) return;

      const selection = this.treeGrid?.getSelection() ?? [];
      const records = selection.includes(record) && selection.length > 1
        ? selection
        : [record];

      const displayText = records.length === 1
        ? String((records[0] as any).get?.(this.config.displayField) ?? '')
        : this.config.dragText.replace('{0}', String(records.length));

      const isCopy = this.config.copy || ((e.ctrlKey || e.metaKey) && this.config.allowCopy);

      this.dragData = { records, source: this.treeGrid!, copy: isCopy, displayText };
      this.dragging = true;
      this._createGhost(displayText, e.clientX, e.clientY);
      return;
    }

    // Update ghost position
    if (this.ghostEl) {
      this.ghostEl.style.left = `${e.clientX + 10}px`;
      this.ghostEl.style.top = `${e.clientY + 10}px`;
    }

    if (!this.config.enableDrop) return;

    // Hit test
    const target = this._getRecordAtPoint(e.clientX, e.clientY);
    this._clearDropIndicators();

    if (!target) {
      this._cancelExpandTimer();
      return;
    }

    // Validate drop
    if (!this._isValidDrop(target)) {
      this._cancelExpandTimer();
      return;
    }

    const position = this._computeDropPosition(e.clientY, target);
    this._showDropIndicator(target, position);

    // Auto expand on hover
    if (!target.isLeaf() && !target.isExpanded() && position === 'append') {
      this._startExpandTimer(target);
    } else {
      this._cancelExpandTimer();
    }
  }

  private _handlePointerUp(e: PointerEvent): void {
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);

    if (!this.dragging || !this.dragData) {
      this._cleanup();
      return;
    }

    const target = this._getRecordAtPoint(e.clientX, e.clientY);

    if (target && this.config.enableDrop && this._isValidDrop(target)) {
      const position = this._computeDropPosition(e.clientY, target);
      const isCopy =
        this.config.copy || ((e.ctrlKey || e.metaKey) && this.config.allowCopy);
      this.dragData.copy = isCopy;

      // Fire beforedrop
      const store = this.treeGrid?.getStore();
      if (store) {
        this._executeDrop(target, position, store);
      }
    }

    this._cleanup();
  }

  // -------------------------------------------------------------------------
  // Drop execution
  // -------------------------------------------------------------------------

  private _executeDrop(
    target: NodeInterface,
    position: DropPosition,
    store: any,
  ): void {
    if (!this.dragData) return;
    const { records, copy } = this.dragData;

    // Deduplicate: remove nodes that are descendants of other dragged nodes
    const deduplicated = records.filter(
      (r) => !records.some((other) => other !== r && other.contains(r)),
    );

    if (copy) {
      for (const rec of deduplicated) {
        const clone = (rec as any).copy?.(true) ?? rec;
        this._insertNode(clone, target, position, store);
      }
    } else {
      // Remove from old positions first
      for (const rec of deduplicated) {
        const parent = rec.parentNode;
        if (parent) parent.removeChild(rec);
      }
      // Insert at new position
      for (const rec of deduplicated) {
        this._insertNode(rec, target, position, store);
      }
    }

    if (this.config.sortOnDrop) {
      const newParent = position === 'append' ? target : target.parentNode;
      if (newParent) {
        // Re-sort children (basic sort by displayField)
        const field = this.config.displayField;
        newParent.childNodes.sort((a, b) => {
          const av = String((a as any).get?.(field) ?? '');
          const bv = String((b as any).get?.(field) ?? '');
          return av.localeCompare(bv);
        });
      }
    }

    // If dropped into a collapsed folder, expand it so the node is visible
    if (position === 'append' && !target.isExpanded()) {
      target.expanded = true;
    }

    this.treeGrid?.getView().refresh();
    (this.treeGrid as any)?.fireEvent?.('drop', target, this.dragData, target, position);
  }

  private _insertNode(
    node: NodeInterface,
    target: NodeInterface,
    position: DropPosition,
    _store: any,
  ): void {
    if (position === 'append') {
      target.appendChild(node);
    } else if (position === 'before') {
      const parent = target.parentNode;
      if (parent) parent.insertBefore(node, target);
    } else {
      // 'after'
      const parent = target.parentNode;
      if (!parent) return;
      const idx = parent.childNodes.indexOf(target);
      if (idx === parent.childNodes.length - 1) {
        parent.appendChild(node);
      } else {
        parent.insertBefore(node, parent.childNodes[idx + 1]);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  private _isValidDrop(target: NodeInterface): boolean {
    if (!this.dragData) return false;
    for (const rec of this.dragData.records) {
      if (rec === target) return false;
      if (rec.contains(target)) return false;
    }
    if ((target as any).get?.('allowDrop') === false) return false;
    return true;
  }

  private _computeDropPosition(clientY: number, target: NodeInterface): DropPosition {
    if (this.config.appendOnly) return 'append';

    const row = this.treeGrid?.getNodeRow(target);
    if (!row) return 'append';

    const rect = row.getBoundingClientRect();
    const relY = clientY - rect.top;
    const h = rect.height;

    if (target.isLeaf()) {
      return relY < h / 2 ? 'before' : 'after';
    }

    if (relY < h * 0.25) return 'before';
    if (relY > h * 0.75) return 'after';
    return 'append';
  }

  // -------------------------------------------------------------------------
  // Visual helpers
  // -------------------------------------------------------------------------

  private _createGhost(text: string, x: number, y: number): void {
    this.ghostEl = document.createElement('div');
    this.ghostEl.className = 'x-treegrid-drag-ghost';
    this.ghostEl.style.cssText =
      `position:fixed;z-index:9999;pointer-events:none;` +
      `background:#fff;border:1px solid #aaa;padding:4px 8px;` +
      `left:${x + 10}px;top:${y + 10}px;`;
    this.ghostEl.textContent = text;
    document.body.appendChild(this.ghostEl);
  }

  private _clearDropIndicators(): void {
    if (this.highlightedRow) {
      this.highlightedRow.classList.remove(this.config.dropHighlightCls);
      this.highlightedRow = null;
    }
    this.dropIndicatorEl?.remove();
    this.dropIndicatorEl = null;
  }

  private _showDropIndicator(target: NodeInterface, position: DropPosition): void {
    const row = this.treeGrid?.getNodeRow(target);
    if (!row) return;

    if (position === 'append') {
      row.classList.add(this.config.dropHighlightCls);
      this.highlightedRow = row;
    } else {
      // Use position:fixed anchored to getBoundingClientRect so the indicator
      // is always visible regardless of table/tr positioning context differences
      // across browsers (Firefox does not honour position:relative on <tr>).
      const rect = row.getBoundingClientRect();
      const y = position === 'before' ? rect.top : rect.bottom;

      this.dropIndicatorEl = document.createElement('div');
      this.dropIndicatorEl.className = this.config.dropIndicatorCls;
      this.dropIndicatorEl.style.cssText =
        `position:fixed;left:${rect.left}px;width:${rect.width}px;` +
        `top:${y - 1}px;height:2px;background:#0070C0;pointer-events:none;z-index:9999;`;
      document.body.appendChild(this.dropIndicatorEl);
    }
  }

  private _startExpandTimer(target: NodeInterface): void {
    if (this.expandTimer) return;
    this.expandTimer = setTimeout(() => {
      this.treeGrid?.expandNode(target);
      this.expandTimer = null;
    }, this.config.expandDelay);
  }

  private _cancelExpandTimer(): void {
    if (this.expandTimer !== null) {
      clearTimeout(this.expandTimer);
      this.expandTimer = null;
    }
  }

  private _cleanup(): void {
    this.dragging = false;
    this.dragData = null;
    this._pendingRecord = null;

    if (this._captureTarget !== null && this._pointerId !== null) {
      try {
        this._captureTarget.releasePointerCapture(this._pointerId);
      } catch (_) { /* ignore */ }
      this._captureTarget = null;
      this._pointerId = null;
    }

    this.ghostEl?.remove();
    this.ghostEl = null;
    this._clearDropIndicators();
    this._cancelExpandTimer();
  }

  // -------------------------------------------------------------------------
  // Hit test
  // -------------------------------------------------------------------------

  private _getRecordAtPoint(x: number, y: number): NodeInterface | null {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    return this.treeGrid?.getView().getRecord(el) ?? null;
  }
}
