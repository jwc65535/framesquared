/**
 * @framesquared/component – Component
 *
 * The base for all UI widgets.  Provides a complete lifecycle,
 * DOM element management, CSS operations, sizing with ResizeObserver,
 * template rendering, focus management, and deterministic destruction.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Base, Observable, generateId } from '@framesquared/core';
import type { TemplateInterface } from './TemplateInterface.js';

// ---------------------------------------------------------------------------
// Observable bootstrap
// ---------------------------------------------------------------------------

const ObservableMixin: typeof Base = Observable;

function ensureObservable(instance: any): void {
  const proto = ObservableMixin.prototype;
  for (const name of Object.getOwnPropertyNames(proto)) {
    if (name === 'constructor') continue;
    if (name in instance) continue;
    const desc = Object.getOwnPropertyDescriptor(proto, name);
    if (desc && typeof desc.value === 'function') {
      instance[name] = desc.value.bind(instance);
    }
  }
}

// ---------------------------------------------------------------------------
// Config interface
// ---------------------------------------------------------------------------

export interface ComponentConfig {
  xtype?: string;
  id?: string;
  cls?: string | string[];
  style?: Partial<CSSStyleDeclaration> | string;
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  margin?: number | string;
  padding?: number | string;
  hidden?: boolean;
  disabled?: boolean;
  html?: string;
  tpl?: TemplateInterface;
  data?: Record<string, unknown>;
  renderTo?: Element | string;
  floating?: boolean;

  listeners?: Record<string, (...args: any[]) => void>;
  reference?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCssValue(v: number | string): string {
  return typeof v === 'number' ? `${v}px` : v;
}

// ---------------------------------------------------------------------------
// Simple CQ match (used by up() — full CQ in ComponentQuery.ts)
// ---------------------------------------------------------------------------

function matchesCQSimple(cmp: any, selector: string): boolean {
  selector = selector.trim();
  if (selector.startsWith('#')) {
    return cmp.componentId === selector.slice(1);
  }
  if (selector.startsWith('.')) {
    return cmp.el?.classList?.contains(selector.slice(1)) ?? false;
  }
  // xtype match
  return cmp._config?.xtype === selector;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export class Component extends Base {
  static override $className = 'Ext.Component';

  // -- Public state --
  el: HTMLElement | null = null;
  rendered = false;

  /** The Container that owns this Component (set by Container.add). */
  ownerCt: Component | null = null;

  // -- Internal state --
  private _hidden = false;
  private _disabled = false;
  private _tpl: TemplateInterface | null = null;
  private _data: Record<string, unknown> | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _lastWidth = 0;
  private _lastHeight = 0;
  protected _config: ComponentConfig;

  /** Unique component id */
  readonly componentId: string;

  $destroyHooks: (() => void)[] = [];

  // -----------------------------------------------------------------------
  // Construction
  // -----------------------------------------------------------------------

  constructor(config: ComponentConfig = {}) {
    super();
    this._config = config;
    this.componentId = config.id ?? generateId('ext-cmp');

    ensureObservable(this);

    // Apply listeners from config early so lifecycle events can be caught
    if (config.listeners) {
      for (const [event, handler] of Object.entries(config.listeners)) {
        (this as any).on(event, handler);
      }
    }

    // Store template & data
    this._tpl = config.tpl ?? null;
    this._data = config.data ?? null;
    this._hidden = config.hidden ?? false;
    this._disabled = config.disabled ?? false;

    // Initialization lifecycle
    this.beforeInitialize();
    this.initialize();
    this.afterInitialize();

    // Auto-render if renderTo is specified
    if (config.renderTo) {
      this.render(config.renderTo);
    }
  }

  // -----------------------------------------------------------------------
  // Lifecycle hooks (override in subclasses)
  // -----------------------------------------------------------------------

  /* eslint-disable @typescript-eslint/no-empty-function */
  /** Called before initialize(). Override in subclasses. */
  protected beforeInitialize(): void {}
  /** Main initialization. Override in subclasses. */
  protected initialize(): void {}
  /** Called after initialize(). Override in subclasses. */
  protected afterInitialize(): void {}
  /** Called before render(). Override in subclasses. */
  protected beforeRender(): void {}
  /** Called after render(). Override in subclasses. */
  protected afterRender(): void {}
  /** Called before destroy(). Override in subclasses. */
  protected beforeDestroy(): void {}
  /** Called during destroy(). Override in subclasses. */
  protected onDestroy(): void {}
  /** Called after destroy(). Override in subclasses. */
  protected afterDestroy(): void {}
  /* eslint-enable @typescript-eslint/no-empty-function */

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  render(container?: Element | string, position?: number | Element): void {
    if (this.rendered || this.isDestroyed) return;

    this.fire('beforerender', this);
    this.beforeRender();

    // Create the root element
    this.el = document.createElement('div');
    this.el.id = this.componentId;
    this.el.classList.add('x-component');

    // Apply configs to DOM
    this.applyConfigs();

    // Insert into DOM
    const target = this.resolveElement(container);
    if (target) {
      if (typeof position === 'number') {
        const ref = target.children[position];
        if (ref) {
          target.insertBefore(this.el, ref);
        } else {
          target.appendChild(this.el);
        }
      } else if (position instanceof Element) {
        target.insertBefore(this.el, position);
      } else {
        target.appendChild(this.el);
      }
    }

    // Set up ResizeObserver
    this.setupResizeObserver();

    this.rendered = true;

    this.fire('render', this);
    this.afterRender();
    this.fire('afterrender', this);
  }

  private resolveElement(target?: Element | string): Element | null {
    if (!target) return null;
    if (typeof target === 'string') {
      return document.querySelector(target);
    }
    return target;
  }

  // -----------------------------------------------------------------------
  // Config application to DOM
  // -----------------------------------------------------------------------

  private applyConfigs(): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const el = this.el!;
    const cfg = this._config;

    // cls
    if (cfg.cls) {
      const classes = Array.isArray(cfg.cls) ? cfg.cls : cfg.cls.split(/\s+/);
      for (const c of classes) {
        if (c) el.classList.add(c);
      }
    }

    // style
    if (cfg.style) {
      if (typeof cfg.style === 'string') {
        el.style.cssText += cfg.style;
      } else {
        const styleObj = cfg.style as Record<string, string>;
        for (const [prop, value] of Object.entries(styleObj)) {
          (el.style as any)[prop] = value;
        }
      }
    }

    // Size
    if (cfg.width !== undefined) el.style.width = toCssValue(cfg.width);
    if (cfg.height !== undefined) el.style.height = toCssValue(cfg.height);
    if (cfg.minWidth !== undefined) el.style.minWidth = toCssValue(cfg.minWidth);
    if (cfg.maxWidth !== undefined) el.style.maxWidth = toCssValue(cfg.maxWidth);
    if (cfg.minHeight !== undefined) el.style.minHeight = toCssValue(cfg.minHeight);
    if (cfg.maxHeight !== undefined) el.style.maxHeight = toCssValue(cfg.maxHeight);

    // Spacing
    if (cfg.margin !== undefined) el.style.margin = toCssValue(cfg.margin);
    if (cfg.padding !== undefined) el.style.padding = toCssValue(cfg.padding);

    // Content
    if (this._tpl && this._data) {
      el.innerHTML = this._tpl.apply(this._data);
    } else if (cfg.html !== undefined) {
      el.innerHTML = cfg.html;
    }

    // Hidden
    if (this._hidden) {
      el.style.display = 'none';
    }

    // Disabled
    if (this._disabled) {
      el.classList.add('x-disabled');
      el.setAttribute('aria-disabled', 'true');
    }

    // Floating
    if (cfg.floating) {
      el.style.position = 'absolute';
      el.classList.add('x-floating');
    }
  }

  // -----------------------------------------------------------------------
  // Visibility
  // -----------------------------------------------------------------------

  isVisible(): boolean {
    return !this._hidden;
  }

  setVisible(visible: boolean): void {
    if (visible) this.show();
    else this.hide();
  }

  show(): void {
    if (this.isDestroyed) return;
    this._hidden = false;
    if (this.el) {
      this.el.style.display = '';
    }
    this.fire('show', this);
  }

  hide(): void {
    if (this.isDestroyed) return;
    this._hidden = true;
    if (this.el) {
      this.el.style.display = 'none';
    }
    this.fire('hide', this);
  }

  // -----------------------------------------------------------------------
  // Enable / Disable
  // -----------------------------------------------------------------------

  isDisabled(): boolean {
    return this._disabled;
  }

  enable(): void {
    if (this.isDestroyed) return;
    this._disabled = false;
    if (this.el) {
      this.el.classList.remove('x-disabled');
      this.el.removeAttribute('aria-disabled');
    }
    this.fire('enable', this);
  }

  disable(): void {
    if (this.isDestroyed) return;
    this._disabled = true;
    if (this.el) {
      this.el.classList.add('x-disabled');
      this.el.setAttribute('aria-disabled', 'true');
    }
    this.fire('disable', this);
  }

  // -----------------------------------------------------------------------
  // Size & Position
  // -----------------------------------------------------------------------

  getWidth(): number {
    return this.el?.offsetWidth ?? 0;
  }

  getHeight(): number {
    return this.el?.offsetHeight ?? 0;
  }

  getSize(): { width: number; height: number } {
    return { width: this.getWidth(), height: this.getHeight() };
  }

  setWidth(width: number | string): void {
    if (this.el) this.el.style.width = toCssValue(width);
  }

  setHeight(height: number | string): void {
    if (this.el) this.el.style.height = toCssValue(height);
  }

  setSize(width: number | string, height: number | string): void {
    this.setWidth(width);
    this.setHeight(height);
  }

  getX(): number {
    return this.el?.offsetLeft ?? 0;
  }

  getY(): number {
    return this.el?.offsetTop ?? 0;
  }

  setX(x: number): void {
    if (this.el) this.el.style.left = `${x}px`;
  }

  setY(y: number): void {
    if (this.el) this.el.style.top = `${y}px`;
  }

  setPosition(x: number, y: number): void {
    this.setX(x);
    this.setY(y);
  }

  getBox(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.getX(),
      y: this.getY(),
      width: this.getWidth(),
      height: this.getHeight(),
    };
  }

  // -----------------------------------------------------------------------
  // ResizeObserver
  // -----------------------------------------------------------------------

  private setupResizeObserver(): void {
    if (!this.el || typeof ResizeObserver === 'undefined') return;

    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const oldWidth = this._lastWidth;
        const oldHeight = this._lastHeight;
        this._lastWidth = width;
        this._lastHeight = height;
        this.fire('resize', this, width, height, oldWidth, oldHeight);
      }
    });
    this._resizeObserver.observe(this.el);
  }

  // -----------------------------------------------------------------------
  // CSS operations
  // -----------------------------------------------------------------------

  addCls(...classes: string[]): void {
    if (!this.el) return;
    for (const c of classes) {
      if (c) this.el.classList.add(c);
    }
  }

  removeCls(...classes: string[]): void {
    if (!this.el) return;
    for (const c of classes) {
      if (c) this.el.classList.remove(c);
    }
  }

  toggleCls(cls: string, state?: boolean): void {
    if (!this.el) return;
    if (state !== undefined) {
      this.el.classList.toggle(cls, state);
    } else {
      this.el.classList.toggle(cls);
    }
  }

  hasCls(cls: string): boolean {
    return this.el?.classList.contains(cls) ?? false;
  }

  setStyle(propOrObj: string | Record<string, string>, value?: string): void {
    if (!this.el) return;
    if (typeof propOrObj === 'string') {
      (this.el.style as any)[propOrObj] = value;
    } else {
      for (const [prop, val] of Object.entries(propOrObj)) {
        (this.el.style as any)[prop] = val;
      }
    }
  }

  getStyle(prop: string): string {
    if (!this.el) return '';
    return (this.el.style as any)[prop] ?? '';
  }

  // -----------------------------------------------------------------------
  // Content update
  // -----------------------------------------------------------------------

  update(htmlOrData: string | Record<string, unknown>): void {
    if (typeof htmlOrData === 'string') {
      this.setHtml(htmlOrData);
    } else {
      this.setData(htmlOrData);
    }
  }

  setHtml(html: string): void {
    if (this.el) {
      this.el.innerHTML = html;
    }
  }

  setData(data: Record<string, unknown>): void {
    this._data = data;
    if (this.el && this._tpl) {
      this.el.innerHTML = this._tpl.apply(data);
    }
  }

  // -----------------------------------------------------------------------
  // Element access
  // -----------------------------------------------------------------------

  getEl(): HTMLElement | null {
    return this.el;
  }

  getElement(): HTMLElement | null {
    return this.el;
  }

  // -----------------------------------------------------------------------
  // Focus management
  // -----------------------------------------------------------------------

  focus(): void {
    const target = this.getFocusEl();
    if (target) target.focus();
  }

  blur(): void {
    const target = this.getFocusEl();
    if (target) target.blur();
  }

  isFocusable(): boolean {
    if (this._disabled || this.isDestroyed || !this.rendered) return false;
    const el = this.getFocusEl();
    if (!el) return false;
    return el.tabIndex >= 0;
  }

  /** Returns the element that receives focus. Override for inner focus targets. */
  protected getFocusEl(): HTMLElement | null {
    return this.el;
  }

  // -----------------------------------------------------------------------
  // Owner lifecycle hooks
  // -----------------------------------------------------------------------

  /** Called when added to a Container. */
  onAdded(_owner: Component, _index: number): void {
    this.fire('added', this, _owner, _index);
  }

  /** Called when removed from a Container. */
  onRemoved(_destroying: boolean): void {
    this.fire('removed', this, _destroying);
  }

  // -----------------------------------------------------------------------
  // Ancestor traversal
  // -----------------------------------------------------------------------

  /**
   * Walks up the ownerCt chain and returns the first Component whose
   * xtype matches the given selector string.
   */
  up(selector: string): Component | undefined {
    let current = this.ownerCt;
    while (current) {
      if (matchesCQSimple(current, selector)) return current;
      current = current.ownerCt;
    }
    return undefined;
  }

  // -----------------------------------------------------------------------
  // Destroy
  // -----------------------------------------------------------------------

  override destroy(): void {
    if (this.isDestroyed) return;

    this.fire('beforedestroy', this);
    this.beforeDestroy();

    // Disconnect ResizeObserver
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    // Remove from DOM
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }

    this.onDestroy();

    this.el = null;
    this.isDestroyed = true;

    this.afterDestroy();

    // Fire 'destroy' event BEFORE clearing listeners
    this.fire('destroy', this);

    // Run destroy hooks from mixins (Observable's hook clears listeners)
    for (const hook of this.$destroyHooks) {
      hook();
    }

    // Final cleanup — clear any remaining listeners
    if (typeof (this as any).clearListeners === 'function') {
      (this as any).clearListeners();
    }
  }

  // -----------------------------------------------------------------------
  // Event helper
  // -----------------------------------------------------------------------

  protected fire(eventName: string, ...args: unknown[]): boolean {
    if (typeof (this as any).fireEvent === 'function') {
      return (this as any).fireEvent(eventName, ...args) !== false;
    }
    return true;
  }
}
