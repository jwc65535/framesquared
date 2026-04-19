/**
 * @framesquared/component – Container
 *
 * A Component that manages an ordered collection of child Components.
 * Provides add/insert/remove, Component Query (CQ) selectors,
 * layout integration, defaults, reference handling, and destroy cascade.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from './Component.js';
import type { ComponentConfig } from './Component.js';
import { ComponentQuery, matchesCQ } from './ComponentQuery.js';
import { type Layout, resolveLayout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';
import { ClassManager } from '@framesquared/core';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface ContainerConfig extends ComponentConfig {
  items?: (Component | Record<string, unknown>)[];
  layout?: string | LayoutConfig;
  defaults?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export class Container extends Component {
  static override $className = 'Ext.Container';

  // These are declared as types only — NOT as class fields.
  // Actual initialization happens in initialize() to avoid
  // ES2022 field declarations overwriting values set during super().
  declare private _items: Component[];
  declare private _layout: Layout | null;
  declare private _bodyEl: HTMLElement | null;

  constructor(config: ContainerConfig = {}) {
    super(config);
  }

  // -----------------------------------------------------------------------
  // Lifecycle overrides
  // -----------------------------------------------------------------------

  protected override initialize(): void {
    super.initialize();
    this._items = [];
    this._layout = null;
    this._bodyEl = null;
  }

  protected override afterRender(): void {
    super.afterRender();

    // Create body element inside el for child rendering
    this._bodyEl = document.createElement('div');
    this._bodyEl.classList.add('x-container-body');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.appendChild(this._bodyEl);

    // Apply layout CSS (e.g. display:flex for hbox/vbox)
    this.getLayout().configureContainer(this._bodyEl);

    // Render any items that were added before this container was rendered
    for (const child of this._items) {
      if (!child.rendered) {
        child.render(this._bodyEl);
      }
    }

    // Add initial items from config
    const config = this._config as ContainerConfig;
    if (config.items && config.items.length > 0) {
      this.add(...config.items);
    }

    // Give the layout a chance to apply per-item styles (e.g. flex-grow for
    // BoxLayout) now that every child has an el. renderItems() skips children
    // that are already rendered, so this is a no-op for non-box layouts.
    this.getLayout().renderItems(this.getItems(), this._bodyEl);
  }

  protected override onDestroy(): void {
    // Destroy all children
    const items = [...this._items];
    for (const child of items) {
      child.destroy();
    }
    this._items.length = 0;
    super.onDestroy();
  }

  // -----------------------------------------------------------------------
  // Body element
  // -----------------------------------------------------------------------

  /**
   * Returns the inner element where children are rendered.
   * Falls back to el if body hasn't been created yet.
   */
  getBodyEl(): HTMLElement {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._bodyEl ?? this.el!;
  }

  // -----------------------------------------------------------------------
  // Child management
  // -----------------------------------------------------------------------

  add(...items: (Component | Record<string, unknown>)[]): Component[] {
    const added: Component[] = [];
    for (const item of items) {
      const child = this.resolveItem(item);
      const index = this._items.length;

      // Fire beforeadd — if cancelled, skip
      if (this.fireReturning('beforeadd', this, child, index) === false) continue;

      this._items.push(child);
      child.ownerCt = this;

      // Render child into body, then let the layout apply per-item styles
      if (this.rendered && this._bodyEl) {
        child.render(this._bodyEl);
        this.getLayout().renderItems([child], this._bodyEl);
      }

      child.onAdded(this, index);
      this.fire('add', this, child, index);
      added.push(child);
    }
    return added;
  }

  insert(index: number, item: Component | Record<string, unknown>): Component {
    const child = this.resolveItem(item);

    if (this.fireReturning('beforeadd', this, child, index) === false) {
      return child;
    }

    // Clamp index
    const i = Math.max(0, Math.min(index, this._items.length));
    this._items.splice(i, 0, child);
    child.ownerCt = this;

    // Render into DOM at correct position
    if (this.rendered && this._bodyEl) {
      const refEl = this._bodyEl.children[i] as Element | undefined;
      if (refEl) {
        child.render(this._bodyEl, refEl);
      } else {
        child.render(this._bodyEl);
      }
    }

    child.onAdded(this, i);
    this.fire('add', this, child, i);
    return child;
  }

  remove(item: Component, destroy = true): Component {
    const index = this._items.indexOf(item);
    if (index === -1) return item;

    if (this.fireReturning('beforeremove', this, item, index) === false) {
      return item;
    }

    this._items.splice(index, 1);
    item.ownerCt = null;

    // Detach from DOM (without destroying yet)
    if (item.el && item.el.parentNode) {
      item.el.parentNode.removeChild(item.el);
    }

    item.onRemoved(destroy);
    this.fire('remove', this, item, index);

    if (destroy) {
      item.destroy();
    }

    return item;
  }

  removeAll(destroy = true): Component[] {
    const removed = [...this._items];
    // Iterate in reverse to avoid index shifting issues
    for (let i = removed.length - 1; i >= 0; i--) {
      this.remove(removed[i], destroy);
    }
    return removed;
  }

  removeAt(index: number): Component {
    const item = this._items[index];
    if (!item) throw new Error(`No item at index ${index}`);
    return this.remove(item, true);
  }

  // -----------------------------------------------------------------------
  // Lookup
  // -----------------------------------------------------------------------

  getItems(): Component[] {
    return [...this._items];
  }

  getAt(index: number): Component | undefined {
    return this._items[index];
  }

  getComponent(id: string): Component | undefined {
    return this._items.find((c) => c.componentId === id);
  }

  indexOf(item: Component): number {
    return this._items.indexOf(item);
  }

  contains(item: Component, deep = false): boolean {
    if (this._items.includes(item)) return true;
    if (deep) {
      for (const child of this._items) {
        if (child instanceof Container && child.contains(item, true)) {
          return true;
        }
      }
    }
    return false;
  }

  getCount(): number {
    return this._items.length;
  }

  // -----------------------------------------------------------------------
  // Layout
  // -----------------------------------------------------------------------

  getLayout(): Layout {
    if (!this._layout) {
      const config = this._config as ContainerConfig;
      this._layout = resolveLayout(config.layout);
      this._layout.setOwner(this);
    }
    return this._layout;
  }

  doLayout(): void {
    this.getLayout().doLayout(this);
  }

  // -----------------------------------------------------------------------
  // Component Query
  // -----------------------------------------------------------------------

  query(selector: string): Component[] {
    return ComponentQuery.query(this, selector);
  }

  down(selector: string): Component | undefined {
    const results = this.query(selector);
    return results.length > 0 ? results[0] : undefined;
  }

  child(selector: string): Component | undefined {
    return this._items.find((c) => matchesCQ(c, selector));
  }

  queryById(id: string): Component | undefined {
    return this.query(`#${id}`)[0];
  }

  queryBy(fn: (item: Component) => boolean): Component[] {
    const all = this.collectAllDescendants();
    return all.filter(fn);
  }

  // -----------------------------------------------------------------------
  // Reference
  // -----------------------------------------------------------------------

  lookupReference(ref: string): Component | undefined {
    return this.query(`[reference=${ref}]`)[0];
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private resolveItem(item: Component | Record<string, unknown>): Component {
    if (item instanceof Component) return item;

    // Merge defaults
    const config = this._config as ContainerConfig;
    const merged = config.defaults ? { ...config.defaults, ...item } : { ...item };

    // Resolve xtype via ClassManager if registered, otherwise create generic Component
    const xtype = (merged as any).xtype;
    if (xtype) {
      const Ctor = ClassManager.getByAlias(`widget.${xtype}`) as
        | (new (cfg: any) => Component)
        | undefined;
      if (Ctor) return new Ctor(merged);
    }
    return new Component(merged);
  }

  private collectAllDescendants(): Component[] {
    const results: Component[] = [];
    for (const child of this._items) {
      results.push(child);
      if (child instanceof Container) {
        results.push(...child.collectAllDescendants());
      }
    }
    return results;
  }

  /**
   * Fires an event and returns false if any listener returned false.
   */
  private fireReturning(eventName: string, ...args: unknown[]): boolean {
    if (typeof (this as any).fireEvent === 'function') {
      return (this as any).fireEvent(eventName, ...args);
    }
    return true;
  }
}
