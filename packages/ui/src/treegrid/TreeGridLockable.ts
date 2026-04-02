/**
 * @framesquared/ui – TreeGridLockable
 *
 * Mixin/plugin enabling locked (frozen) columns in a TreeGrid.
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

    // Only split if at least one non-tree column is user-defined (not auto-created from config)
    // or has an explicit locked flag set
    const hasUserDefinedColumns = columns.some(
      (c) =>
        !(c instanceof TreeGridColumn) && (!(c as any)._autoCreated || (c as any).locked === true),
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

    // Build locked panel
    this.lockedViewEl = document.createElement('div');
    this.lockedViewEl.className = 'x-treegrid-locked-panel';
    this.lockedViewEl.style.cssText =
      'display:inline-block;overflow-x:hidden;overflow-y:auto;vertical-align:top;';

    this.lockedView = new TreeGridView({
      store: treeGrid.getStore(),
      columns: lockedCols,
      rootVisible: treeGrid.isRootVisible(),
      checkable: treeGrid.isCheckable(),
    });
    this.lockedView.render(this.lockedViewEl);

    // Build normal panel
    this.normalViewEl = document.createElement('div');
    this.normalViewEl.className = 'x-treegrid-normal-panel';
    this.normalViewEl.style.cssText =
      'display:inline-block;overflow-x:auto;overflow-y:auto;vertical-align:top;';

    this.normalView = new TreeGridView({
      store: treeGrid.getStore(),
      columns: normalCols,
      rootVisible: treeGrid.isRootVisible(),
    });
    this.normalView.render(this.normalViewEl);

    bodyEl.innerHTML = '';
    bodyEl.appendChild(this.lockedViewEl);
    bodyEl.appendChild(this.normalViewEl);

    if (this.config.syncScroll) {
      this.lockedViewEl.addEventListener('scroll', this._onLockedScroll);
      this.normalViewEl.addEventListener('scroll', this._onNormalScroll);
    }

    // Wire store events to both views
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
    if (col instanceof TreeGridColumn) return; // Tree col always locked
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
