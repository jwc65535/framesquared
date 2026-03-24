/**
 * @ext-ts/app – ViewModel
 *
 * Provides data binding for views.  Supports nested path access,
 * computed formulas with automatic dependency tracking via get(),
 * named stores, parent→child hierarchy with inheritance, and
 * change notification.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ViewModelConfig {
  data?: Record<string, unknown>;
  formulas?: Record<string, (get: (path: string) => unknown) => unknown>;
  stores?: Record<string, { data: unknown[] }>;
  parent?: ViewModel;
}

export class ViewModel {
  private _data: Record<string, unknown>;
  private _formulas: Record<string, (get: (path: string) => unknown) => unknown>;
  private _stores: Record<string, { data: unknown[] }>;
  private _listeners: Record<string, Function[]> = {};
  private _parent: ViewModel | null;
  private _children: ViewModel[] = [];
  private _parentHandler: Function | null = null;

  constructor(config: ViewModelConfig = {}) {
    this._data = config.data ? this.deepClone(config.data) : {};
    this._formulas = config.formulas ?? {};
    this._stores = {};
    this._parent = config.parent ?? null;

    // Create stores
    if (config.stores) {
      for (const [name, storeCfg] of Object.entries(config.stores)) {
        this._stores[name] = { data: [...(storeCfg.data ?? [])] };
      }
    }

    // Register with parent
    if (this._parent) {
      this._parent._children.push(this);
      this._parentHandler = () => this.fire('datachange', this);
      this._parent.on('datachange', this._parentHandler);
    }
  }

  // -----------------------------------------------------------------------
  // Data access
  // -----------------------------------------------------------------------

  get(path: string): unknown {
    // Check formulas first (local only)
    if (path in this._formulas) {
      return this.computeFormula(path);
    }

    // Check local data
    const localVal = this.getByPath(this._data, path);
    if (localVal !== undefined) return localVal;

    // Fall back to parent
    if (this._parent) return this._parent.get(path);
    return undefined;
  }

  set(pathOrObj: string | Record<string, unknown>, value?: unknown): void {
    if (typeof pathOrObj === 'string') {
      this.setByPath(this._data, pathOrObj, value);
    } else {
      for (const [key, val] of Object.entries(pathOrObj)) {
        this.setByPath(this._data, key, val);
      }
    }
    this.fire('datachange', this);
  }

  // -----------------------------------------------------------------------
  // Formulas — get() callback reads both data and other formulas
  // -----------------------------------------------------------------------

  private computeFormula(name: string): unknown {
    const fn = this._formulas[name];
    if (!fn) return undefined;
    // The getter passed to formulas uses this.get() so formulas can
    // read other formulas and parent data transparently.
    const getter = (path: string): unknown => this.get(path);
    return fn(getter);
  }

  // -----------------------------------------------------------------------
  // Stores
  // -----------------------------------------------------------------------

  getStore(name: string): any {
    return this._stores[name] ?? null;
  }

  // -----------------------------------------------------------------------
  // Hierarchy
  // -----------------------------------------------------------------------

  getParent(): ViewModel | null {
    return this._parent;
  }

  getRoot(): ViewModel {
    let current: ViewModel = this;
    while (current._parent) current = current._parent;
    return current;
  }

  // -----------------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------------

  on(event: string, fn: Function): void {
    (this._listeners[event] ??= []).push(fn);
  }

  un(event: string, fn: Function): void {
    const list = this._listeners[event];
    if (!list) return;
    const idx = list.indexOf(fn);
    if (idx >= 0) list.splice(idx, 1);
  }

  private fire(event: string, ...args: unknown[]): void {
    (this._listeners[event] ?? []).forEach(fn => fn(...args));
  }

  // -----------------------------------------------------------------------
  // Path helpers
  // -----------------------------------------------------------------------

  private getByPath(obj: any, path: string): unknown {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  }

  private setByPath(obj: any, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] == null) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  private deepClone(obj: Record<string, unknown>): Record<string, unknown> {
    return JSON.parse(JSON.stringify(obj));
  }
}
