/**
 * @framesquared/ui – TreeGridLockable
 *
 * Plugin enabling locked (frozen) columns in a TreeGrid.
 * Splits the grid into locked (left) and normal (right) panels.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { TreeGrid } from './TreeGrid.js';
import type { Column } from './TreeGridColumn.js';
import { TreeGridColumn } from './TreeGridColumn.js';
import { TreeGridView } from './TreeGridView.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridLockableConfig {
  syncScroll?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the pixel width to use for a column in the locked-columns layout. */
function colPx(col: Column): number {
  return col.width > 0 ? col.width : 150;
}

// ---------------------------------------------------------------------------
// TreeGridLockable
// ---------------------------------------------------------------------------

export class TreeGridLockable {
  private treeGrid: TreeGrid | null = null;
  private config: Required<TreeGridLockableConfig>;

  private lockedViewEl: HTMLElement | null = null;
  private normalViewEl: HTMLElement | null = null;
  private lockedView: TreeGridView | null = null;
  private normalView: TreeGridView | null = null;

  private _onLockedScroll: () => void;
  private _onNormalScroll: () => void;
  private _syncingScroll = false;

  constructor(config: TreeGridLockableConfig = {}) {
    this.config = {
      syncScroll: config.syncScroll ?? true,
    };
    this._onLockedScroll = this._syncScrollFromLocked.bind(this);
    this._onNormalScroll = this._syncScrollFromNormal.bind(this);
  }

  init(treeGrid: TreeGrid): void {
    this.treeGrid = treeGrid;

    const columns = treeGrid.getColumns();

    // Only split when at least one non-tree column exists that was not
    // auto-created from a config object (or is explicitly locked).
    const hasUserDefinedColumns = columns.some(
      (c) =>
        !(c instanceof TreeGridColumn) &&
        (!(c as any)._autoCreated || (c as any).locked === true),
    );
    if (!hasUserDefinedColumns) return;

    const lockedCols = columns.filter(
      (c) => c instanceof TreeGridColumn || (c as any).locked === true,
    );
    const normalCols = columns.filter(
      (c) => !(c instanceof TreeGridColumn) && (c as any).locked !== true,
    );

    if (lockedCols.length === 0 || normalCols.length === 0) return;

    const bodyEl = treeGrid.getBodyEl?.();
    if (!bodyEl) return;

    // ── Body layout ──────────────────────────────────────────────────────────
    // Make the panel body a row-flex container so the two panels sit
    // side-by-side.  Save the original cssText so destroy() can restore it.
    bodyEl.style.cssText =
      'display:flex;flex-direction:row;overflow:hidden;padding:0;gap:0;align-items:stretch;';

    // ── Locked panel ─────────────────────────────────────────────────────────
    const lockedW = lockedCols.reduce((s, c) => s + colPx(c), 0);

    this.lockedViewEl = document.createElement('div');
    this.lockedViewEl.className = 'x-treegrid-locked-panel';
    this.lockedViewEl.style.cssText =
      `display:flex;flex-direction:column;flex:0 0 ${lockedW}px;width:${lockedW}px;` +
      'overflow-x:hidden;overflow-y:auto;' +
      'border-right:2px solid var(--ext-color-border,#e0e0e0);';

    this.lockedView = new TreeGridView({
      store: treeGrid.getStore(),
      columns: lockedCols,
      rootVisible: treeGrid.isRootVisible(),
      checkable: treeGrid.isCheckable(),
    });
    this.lockedView.render(this.lockedViewEl);

    // The view must not create its own scroll viewport — the panel element
    // is the scroller so that vertical scroll-sync works correctly.
    if (this.lockedView.el) {
      this.lockedView.el.style.cssText = 'flex:1;overflow:visible;';
    }
    const lockedTable = this.lockedViewEl.querySelector(
      '.x-treegrid-table',
    ) as HTMLElement | null;
    if (lockedTable) lockedTable.style.width = lockedW + 'px';

    // ── Normal panel ─────────────────────────────────────────────────────────
    const normalW = normalCols.reduce((s, c) => s + colPx(c), 0);

    this.normalViewEl = document.createElement('div');
    this.normalViewEl.className = 'x-treegrid-normal-panel';
    this.normalViewEl.style.cssText =
      'display:flex;flex-direction:column;flex:1 1 0;min-width:0;overflow-x:auto;overflow-y:auto;';

    this.normalView = new TreeGridView({
      store: treeGrid.getStore(),
      columns: normalCols,
      rootVisible: treeGrid.isRootVisible(),
    });
    this.normalView.render(this.normalViewEl);

    if (this.normalView.el) {
      this.normalView.el.style.cssText = 'flex:1;overflow:visible;';
    }
    // Fix the table to its natural pixel width so the panel scrolls
    // horizontally when the columns are wider than the viewport.
    const normalTable = this.normalViewEl.querySelector(
      '.x-treegrid-table',
    ) as HTMLElement | null;
    if (normalTable) normalTable.style.width = normalW + 'px';

    // ── DOM assembly ─────────────────────────────────────────────────────────
    bodyEl.innerHTML = '';
    bodyEl.appendChild(this.lockedViewEl);
    bodyEl.appendChild(this.normalViewEl);

    // ── Scroll sync ───────────────────────────────────────────────────────────
    if (this.config.syncScroll) {
      this.lockedViewEl.addEventListener('scroll', this._onLockedScroll);
      this.normalViewEl.addEventListener('scroll', this._onNormalScroll);
    }

    // ── Selection wiring ──────────────────────────────────────────────────────
    const onItemClick = (node: any, e: MouseEvent) => {
      (treeGrid as any).select(node, e.ctrlKey || e.metaKey);
    };
    this.lockedView.on('itemclick', onItemClick);
    this.normalView.on('itemclick', onItemClick);

    (treeGrid as any).on('selectionchange', (_selModel: unknown, selected: any[]) => {
      const selectedSet = new Set(selected);
      const flatData = (treeGrid.getStore() as any).flattenNodes() as any[];
      for (const n of flatData) {
        this.lockedView?.markSelected(n, selectedSet.has(n));
        this.normalView?.markSelected(n, selectedSet.has(n));
      }
    });

    // ── Store event wiring ────────────────────────────────────────────────────
    const store = treeGrid.getStore() as any;
    store.on('datachanged', () => {
      this.lockedView?.refresh();
      this.normalView?.refresh();
    });
    store.on('nodeexpand', (_s: unknown, node: any) => {
      this.lockedView?.onNodeExpand(node, node.childNodes);
      this.normalView?.onNodeExpand(node, node.childNodes);
    });
    store.on('nodecollapse', (_s: unknown, node: any) => {
      this.lockedView?.onNodeCollapse(node);
      this.normalView?.onNodeCollapse(node);
    });
  }

  destroy(): void {
    if (this.config.syncScroll) {
      this.lockedViewEl?.removeEventListener('scroll', this._onLockedScroll);
      this.normalViewEl?.removeEventListener('scroll', this._onNormalScroll);
    }
    this.lockedViewEl?.remove();
    this.normalViewEl?.remove();
    this.lockedView = null;
    this.normalView = null;
    this.lockedViewEl = null;
    this.normalViewEl = null;
    this.treeGrid = null;
  }

  getLockedView(): TreeGridView | null {
    return this.lockedView;
  }

  getNormalView(): TreeGridView | null {
    return this.normalView;
  }

  lockColumn(col: Column): void {
    (col as any).locked = true;
    this._rebuild();
  }

  unlockColumn(col: Column): void {
    if (col instanceof TreeGridColumn) return; // tree column always locked
    (col as any).locked = false;
    this._rebuild();
  }

  private _rebuild(): void {
    const grid = this.treeGrid;
    if (grid) {
      this.destroy();
      this.init(grid);
    }
  }

  private _syncScrollFromLocked(): void {
    if (this._syncingScroll) return;
    this._syncingScroll = true;
    if (this.normalViewEl && this.lockedViewEl) {
      this.normalViewEl.scrollTop = this.lockedViewEl.scrollTop;
    }
    this._syncingScroll = false;
  }

  private _syncScrollFromNormal(): void {
    if (this._syncingScroll) return;
    this._syncingScroll = true;
    if (this.lockedViewEl && this.normalViewEl) {
      this.lockedViewEl.scrollTop = this.normalViewEl.scrollTop;
    }
    this._syncingScroll = false;
  }
}
