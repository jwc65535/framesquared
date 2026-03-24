/**
 * @ext-ts/ui – PagingToolbar
 *
 * A Toolbar bound to a data Store that provides page navigation:
 * first, prev, page input, "of N", next, last, refresh.
 * Optionally displays "Showing X - Y of Z".
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Toolbar } from './Toolbar.js';
import type { ToolbarConfig } from './Toolbar.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface PagingToolbarConfig extends ToolbarConfig {
  store?: any;
  displayInfo?: boolean;
}

// ---------------------------------------------------------------------------
// PagingToolbar
// ---------------------------------------------------------------------------

export class PagingToolbar extends Toolbar {
  static override $className = 'Ext.toolbar.Paging';

  declare private _store: any;
  declare private _displayInfo: boolean;
  declare private _pageInput: HTMLInputElement | null;
  declare private _totalEl: HTMLElement | null;
  declare private _infoEl: HTMLElement | null;

  constructor(config: PagingToolbarConfig = {}) {
    super({ xtype: 'pagingtoolbar', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as PagingToolbarConfig;
    this._store = cfg.store ?? null;
    this._displayInfo = cfg.displayInfo ?? false;
    this._pageInput = null;
    this._totalEl = null;
    this._infoEl = null;
  }

  protected override afterRender(): void {
    super.afterRender();

    this.el!.classList.add('x-paging-toolbar');
    const body = this.getBodyEl();

    // Build paging controls directly into body
    const first = this.createBtn('x-paging-first', '⟨⟨', () => this.moveFirst());
    const prev = this.createBtn('x-paging-prev', '⟨', () => this.movePrevious());

    // Page input
    this._pageInput = document.createElement('input');
    this._pageInput.classList.add('x-paging-page');
    this._pageInput.type = 'text';
    this._pageInput.size = 3;
    this._pageInput.value = String(this._store?.currentPage ?? 1);
    this._pageInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const page = parseInt(this._pageInput!.value, 10);
        if (!isNaN(page) && page >= 1 && page <= this.getTotalPages()) {
          this.loadPage(page);
        }
      }
    });

    // "of N" text
    const ofText = document.createElement('span');
    ofText.classList.add('x-paging-of');
    ofText.textContent = ' of ';

    this._totalEl = document.createElement('span');
    this._totalEl.classList.add('x-paging-total');
    this._totalEl.textContent = String(this.getTotalPages());

    const next = this.createBtn('x-paging-next', '⟩', () => this.moveNext());
    const last = this.createBtn('x-paging-last', '⟩⟩', () => this.moveLast());
    const refresh = this.createBtn('x-paging-refresh', '↻', () => this.doRefresh());

    body.appendChild(first);
    body.appendChild(prev);
    body.appendChild(this._pageInput);
    body.appendChild(ofText);
    body.appendChild(this._totalEl);
    body.appendChild(next);
    body.appendChild(last);
    body.appendChild(refresh);

    // Display info
    if (this._displayInfo) {
      this._infoEl = document.createElement('span');
      this._infoEl.classList.add('x-paging-info');
      this._infoEl.style.marginLeft = 'auto';
      this.updateInfo();
      body.appendChild(this._infoEl);
    }
  }

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  private moveFirst(): void { this.loadPage(1); }

  private movePrevious(): void {
    const page = Math.max(1, (this._store?.currentPage ?? 1) - 1);
    this.loadPage(page);
  }

  private moveNext(): void {
    const page = Math.min(this.getTotalPages(), (this._store?.currentPage ?? 1) + 1);
    this.loadPage(page);
  }

  private moveLast(): void { this.loadPage(this.getTotalPages()); }

  private doRefresh(): void {
    this.loadPage(this._store?.currentPage ?? 1);
  }

  private loadPage(page: number): void {
    this.fire('beforechange', this, page);
    if (this._store?.loadPage) {
      this._store.loadPage(page);
    }
    if (this._pageInput) this._pageInput.value = String(page);
    this.fire('change', this, page);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private getTotalPages(): number {
    if (!this._store) return 1;
    const total = this._store.getTotalCount?.() ?? this._store.totalCount ?? 0;
    const pageSize = this._store.pageSize ?? 25;
    return Math.max(1, Math.ceil(total / pageSize));
  }

  private updateInfo(): void {
    if (!this._infoEl || !this._store) return;
    const page = this._store.currentPage ?? 1;
    const pageSize = this._store.pageSize ?? 25;
    const total = this._store.getTotalCount?.() ?? this._store.totalCount ?? 0;
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    this._infoEl.textContent = `Displaying ${start} - ${end} of ${total}`;
  }

  private createBtn(cls: string, label: string, handler: () => void): HTMLElement {
    const btn = document.createElement('button');
    btn.classList.add(cls, 'x-paging-btn');
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', handler);
    return btn;
  }
}
