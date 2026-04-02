/**
 * @framesquared/ui – Window
 *
 * A floating Panel rendered into document.body.  Supports dragging
 * (by header), modal mask, maximize/minimize/restore, constrain to
 * viewport, and z-index management via ZIndexManager.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Panel } from '../panel/Panel.js';
import type { PanelConfig } from '../panel/Panel.js';
import { ZIndexManager } from '../ZIndexManager.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WindowConfig extends PanelConfig {
  modal?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  constrain?: boolean;
  constrainTo?: Element;
  maximizable?: boolean;
  minimizable?: boolean;
  maximized?: boolean;
  x?: number;
  y?: number;
  defaultFocus?: string;
  closeAction?: 'destroy' | 'hide';
  ghost?: boolean;
  autoShow?: boolean;
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

export class Window extends Panel {
  static override $className = 'Ext.window.Window';

  // State
  declare private _modal: boolean;
  declare private _maskEl: HTMLElement | null;
  declare private _maximized: boolean;
  declare private _restoreState: {
    left: string;
    top: string;
    width: string;
    height: string;
  } | null;
  declare private _closeAction: 'destroy' | 'hide';
  declare private _draggable: boolean;
  declare private _dragCleanup: (() => void) | null;

  constructor(config: WindowConfig = {}) {
    // Ensure closable by default
    const merged: WindowConfig = {
      closable: true,
      ...config,
    };
    super(merged);

    // Auto-show
    if (merged.autoShow !== false && merged.autoShow !== undefined) {
      if (merged.autoShow) this.show();
    }
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as WindowConfig;
    this._modal = cfg.modal ?? false;
    this._maskEl = null;
    this._maximized = false;
    this._restoreState = null;
    this._closeAction = cfg.closeAction ?? 'destroy';
    this._draggable = cfg.draggable ?? true;
    this._dragCleanup = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as WindowConfig;

    // Window classes
    this.el!.classList.add('x-window');
    this.el!.style.position = 'fixed';

    // Initial position
    if (cfg.x !== undefined) this.el!.style.left = `${cfg.x}px`;
    if (cfg.y !== undefined) this.el!.style.top = `${cfg.y}px`;

    // Auto tools
    if (cfg.maximizable) {
      this.addTool({ type: 'maximize', handler: () => this.toggleMaximize() });
    }
    if (cfg.minimizable) {
      this.addTool({ type: 'minimize', handler: () => this.minimize() });
    }

    // Dragging
    if (this._draggable) {
      this.setupDrag();
    }

    // Modal
    if (this._modal) {
      this.showMask();
    }

    // Register with ZIndexManager
    ZIndexManager.getInstance().register(this);

    // Maximized config
    if (cfg.maximized) {
      this.maximize();
    }

    // ARIA
    this.el!.setAttribute('role', 'dialog');
    if (this._modal) {
      this.el!.setAttribute('aria-modal', 'true');
    }
    // Link to title element via aria-labelledby
    const titleEl = this.el!.querySelector('.x-panel-header-text');
    if (titleEl && titleEl.id) {
      this.el!.setAttribute('aria-labelledby', titleEl.id);
    }
  }

  // -----------------------------------------------------------------------
  // Show / render into body
  // -----------------------------------------------------------------------

  override show(): void {
    if (!this.rendered) {
      this.render(document.body);
    }
    super.show();
    if (this._modal && !this._maskEl) {
      this.showMask();
    }
  }

  // -----------------------------------------------------------------------
  // Close (override Panel)
  // -----------------------------------------------------------------------

  override close(): void {
    this.fire('beforeclose', this);
    this.fire('close', this);

    if (this._closeAction === 'hide') {
      this.hide();
      this.hideMask();
    } else {
      this.destroy();
    }
  }

  // -----------------------------------------------------------------------
  // Modal mask
  // -----------------------------------------------------------------------

  private showMask(): void {
    if (this._maskEl) return;
    this._maskEl = document.createElement('div');
    this._maskEl.classList.add('x-mask');
    this._maskEl.style.position = 'fixed';
    this._maskEl.style.top = '0';
    this._maskEl.style.left = '0';
    this._maskEl.style.width = '100%';
    this._maskEl.style.height = '100%';
    this._maskEl.style.zIndex = String(parseInt(this.el?.style.zIndex ?? '9000', 10) - 1);
    document.body.appendChild(this._maskEl);
  }

  private hideMask(): void {
    if (this._maskEl && this._maskEl.parentNode) {
      this._maskEl.parentNode.removeChild(this._maskEl);
    }
    this._maskEl = null;
  }

  // -----------------------------------------------------------------------
  // Positioning
  // -----------------------------------------------------------------------

  center(): void {
    if (!this.el) return;
    const vw = window.innerWidth || 0;
    const vh = window.innerHeight || 0;
    const w = this.el.offsetWidth || 0;
    const h = this.el.offsetHeight || 0;
    this.el.style.left = `${Math.max(0, (vw - w) / 2)}px`;
    this.el.style.top = `${Math.max(0, (vh - h) / 2)}px`;
  }

  // -----------------------------------------------------------------------
  // Maximize / Minimize / Restore
  // -----------------------------------------------------------------------

  maximize(): void {
    if (this._maximized || !this.el) return;

    // Save restore state
    this._restoreState = {
      left: this.el.style.left,
      top: this.el.style.top,
      width: this.el.style.width,
      height: this.el.style.height,
    };

    this.el.style.left = '0px';
    this.el.style.top = '0px';
    this.el.style.width = '100%';
    this.el.style.height = '100%';
    this.el.classList.add('x-window-maximized');
    this._maximized = true;
    this.fire('maximize', this);
  }

  restore(): void {
    if (!this._maximized || !this.el || !this._restoreState) return;

    this.el.style.left = this._restoreState.left;
    this.el.style.top = this._restoreState.top;
    this.el.style.width = this._restoreState.width;
    this.el.style.height = this._restoreState.height;
    this.el.classList.remove('x-window-maximized');
    this._maximized = false;
    this._restoreState = null;
    this.fire('restore', this);
  }

  toggleMaximize(): void {
    if (this._maximized) this.restore();
    else this.maximize();
  }

  minimize(): void {
    this.hide();
    this.fire('minimize', this);
  }

  // -----------------------------------------------------------------------
  // Z-index
  // -----------------------------------------------------------------------

  toFront(): void {
    ZIndexManager.getInstance().bringToFront(this);
  }

  toBack(): void {
    ZIndexManager.getInstance().sendToBack(this);
  }

  // -----------------------------------------------------------------------
  // Drag
  // -----------------------------------------------------------------------

  private setupDrag(): void {
    const header = this.el!.querySelector('.x-panel-header') as HTMLElement | null;
    if (!header) return;

    header.style.cursor = 'move';

    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;
    let dragging = false;

    const onPointerDown = (e: MouseEvent) => {
      if (this._maximized) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origLeft = parseInt(this.el!.style.left, 10) || 0;
      origTop = parseInt(this.el!.style.top, 10) || 0;
      e.preventDefault();
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.el!.style.left = `${origLeft + dx}px`;
      this.el!.style.top = `${origTop + dy}px`;
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      this.fire('move', this, parseInt(this.el!.style.left, 10), parseInt(this.el!.style.top, 10));
    };

    header.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    this._dragCleanup = () => {
      header.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }

  // -----------------------------------------------------------------------
  // Destroy
  // -----------------------------------------------------------------------

  protected override onDestroy(): void {
    // Remove drag listeners
    if (this._dragCleanup) {
      this._dragCleanup();
      this._dragCleanup = null;
    }

    // Remove mask
    this.hideMask();

    // Unregister from ZIndexManager
    ZIndexManager.getInstance().unregister(this);

    super.onDestroy();
  }
}
