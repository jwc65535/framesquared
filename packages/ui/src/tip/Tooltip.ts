/**
 * @framesquared/ui – Tooltip
 *
 * A floating tip that appears near a target element on mouseenter.
 * Supports show/hide delays, mouse tracking, anchor positioning,
 * event delegation, dismissDelay, and closable mode.
 */

 

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TooltipConfig extends ComponentConfig {
  target?: Element | string;
  html?: string;
  title?: string;
  anchor?: 'top' | 'bottom' | 'left' | 'right';
  autoHide?: boolean;
  showDelay?: number;
  hideDelay?: number;
  dismissDelay?: number;
  trackMouse?: boolean;
  mouseOffset?: [number, number];
  delegate?: string;
  maxWidth?: number;
  closable?: boolean;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

export class Tooltip extends Component {
  static override $className = 'Ext.tip.Tooltip';

  // Config
  declare private _targetEl: Element | null;
  declare private _showDelay: number;
  declare private _hideDelay: number;
  declare private _dismissDelay: number;
  declare private _autoHide: boolean;
  declare private _trackMouse: boolean;
  declare private _mouseOffset: [number, number];
  declare private _delegate: string | null;
  declare private _anchor: string | null;
  declare private _maxWidth: number;
  declare private _closable: boolean;
  declare private _tipTitle: string;
  declare private _tipHtml: string;

  // State
  declare private _visible: boolean;
  declare private _showTimer: ReturnType<typeof setTimeout> | null;
  declare private _hideTimer: ReturnType<typeof setTimeout> | null;
  declare private _dismissTimer: ReturnType<typeof setTimeout> | null;
  declare private _lastMouseX: number;
  declare private _lastMouseY: number;

  // Listener cleanup
  declare private _cleanupFns: (() => void)[];

  constructor(config: TooltipConfig = {}) {
    super({ xtype: 'tooltip', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as TooltipConfig;

    this._showDelay = cfg.showDelay ?? 500;
    this._hideDelay = cfg.hideDelay ?? 200;
    this._dismissDelay = cfg.dismissDelay ?? 5000;
    this._autoHide = cfg.autoHide ?? true;
    this._trackMouse = cfg.trackMouse ?? false;
    this._mouseOffset = cfg.mouseOffset ?? [15, 15];
    this._delegate = cfg.delegate ?? null;
    this._anchor = cfg.anchor ?? null;
    this._maxWidth = cfg.maxWidth ?? 0;
    this._closable = cfg.closable ?? false;
    this._tipTitle = cfg.title ?? '';
    this._tipHtml = cfg.html ?? '';

    this._visible = false;
    this._showTimer = null;
    this._hideTimer = null;
    this._dismissTimer = null;
    this._lastMouseX = 0;
    this._lastMouseY = 0;
    this._cleanupFns = [];

    // Resolve and attach to target
    let targetEl: Element | null = null;
    if (cfg.target) {
      targetEl = typeof cfg.target === 'string' ? document.querySelector(cfg.target) : cfg.target;
    }
    this._targetEl = targetEl;

    if (targetEl) {
      this.attachTargetListeners(targetEl);
    }
  }

  // -----------------------------------------------------------------------
  // Target event attachment
  // -----------------------------------------------------------------------

  private attachTargetListeners(el: Element): void {
    const onEnter = (e: Event) => this.onTargetEnter(e as MouseEvent);
    const onLeave = (e: Event) => this.onTargetLeave(e as MouseEvent);
    const onMove = (e: Event) => this.onTargetMove(e as MouseEvent);

    el.addEventListener('mouseenter', onEnter, true);
    el.addEventListener('mouseleave', onLeave, true);
    if (this._trackMouse) {
      el.addEventListener('mousemove', onMove, true);
    }

    this._cleanupFns.push(() => {
      el.removeEventListener('mouseenter', onEnter, true);
      el.removeEventListener('mouseleave', onLeave, true);
      el.removeEventListener('mousemove', onMove, true);
    });
  }

  // -----------------------------------------------------------------------
  // Mouse event handlers
  // -----------------------------------------------------------------------

  private onTargetEnter(e: MouseEvent): void {
    if (this.isDestroyed) return;

    // Delegation: check if the entered element matches delegate selector
    if (this._delegate) {
      const delegateTarget = (e.target as Element)?.closest?.(this._delegate);
      if (!delegateTarget) return;
      // Update content from delegate target's data attributes
      const qtip = delegateTarget.getAttribute('data-qtip');
      if (qtip) this._tipHtml = qtip;
    }

    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;

    this.clearHideTimer();
    this.clearShowTimer();

    this._showTimer = setTimeout(() => {
      this._showTimer = null;
      this.showTip();
    }, this._showDelay);
  }

  private onTargetLeave(_e: MouseEvent): void {
    if (this.isDestroyed) return;

    this.clearShowTimer();

    if (!this._autoHide) return;

    this.clearHideTimer();
    this._hideTimer = setTimeout(() => {
      this._hideTimer = null;
      this.hide();
    }, this._hideDelay);
  }

  private onTargetMove(e: MouseEvent): void {
    if (this.isDestroyed) return;
    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;
    if (this._visible && this._trackMouse) {
      this.positionAtMouse();
    }
  }

  // -----------------------------------------------------------------------
  // Show / Hide
  // -----------------------------------------------------------------------

  private showTip(): void {
    if (this.isDestroyed) return;

    this.fire('beforeshow', this);

    if (!this.rendered) {
      this.renderTip();
    }

    // Update content (for delegation)
    this.updateContent();

    this.el!.style.display = '';
    this.el!.classList.remove('x-tip-hidden');
    this._visible = true;
    this.positionAtMouse();

    this.fire('show', this);

    // DismissDelay
    this.clearDismissTimer();
    if (this._dismissDelay > 0) {
      this._dismissTimer = setTimeout(() => {
        this._dismissTimer = null;
        this.hide();
      }, this._dismissDelay);
    }
  }

  override hide(): void {
    if (!this._visible) return;

    this.fire('beforehide', this);

    this._visible = false;
    if (this.el) {
      this.el.classList.add('x-tip-hidden');
      this.el.style.display = 'none';
    }
    this.clearDismissTimer();

    this.fire('hide', this);
  }

  override isVisible(): boolean {
    return this._visible;
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  private renderTip(): void {
    this.render(document.body);

    const el = this.el!;
    el.classList.add('x-tooltip');
    el.setAttribute('role', 'tooltip');
    el.style.position = 'fixed';
    el.style.zIndex = '99999';

    if (this._anchor) {
      el.classList.add(`x-tip-anchor-${this._anchor}`);
    }

    if (this._maxWidth > 0) {
      el.style.maxWidth = `${this._maxWidth}px`;
    }

    this.updateContent();
  }

  private updateContent(): void {
    if (!this.el) return;
    const el = this.el;

    // Clear previous content
    el.innerHTML = '';

    // Close button
    if (this._closable) {
      const closeBtn = document.createElement('div');
      closeBtn.classList.add('x-tip-close');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', () => this.hide());
      el.appendChild(closeBtn);
    }

    // Header
    if (this._tipTitle) {
      const header = document.createElement('div');
      header.classList.add('x-tip-header');
      header.textContent = this._tipTitle;
      el.appendChild(header);
    }

    // Body
    const body = document.createElement('div');
    body.classList.add('x-tip-body');
    body.innerHTML = this._tipHtml;
    el.appendChild(body);
  }

  // -----------------------------------------------------------------------
  // Positioning
  // -----------------------------------------------------------------------

  private positionAtMouse(): void {
    if (!this.el) return;
    const [offX, offY] = this._mouseOffset;
    this.el.style.left = `${this._lastMouseX + offX}px`;
    this.el.style.top = `${this._lastMouseY + offY}px`;
  }

  // -----------------------------------------------------------------------
  // Timer management
  // -----------------------------------------------------------------------

  private clearShowTimer(): void {
    if (this._showTimer !== null) {
      clearTimeout(this._showTimer);
      this._showTimer = null;
    }
  }

  private clearHideTimer(): void {
    if (this._hideTimer !== null) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  }

  private clearDismissTimer(): void {
    if (this._dismissTimer !== null) {
      clearTimeout(this._dismissTimer);
      this._dismissTimer = null;
    }
  }

  // -----------------------------------------------------------------------
  // Destroy
  // -----------------------------------------------------------------------

  override destroy(): void {
    this.clearShowTimer();
    this.clearHideTimer();
    this.clearDismissTimer();

    for (const fn of this._cleanupFns) fn();
    this._cleanupFns.length = 0;

    this._visible = false;
    super.destroy();
  }
}
