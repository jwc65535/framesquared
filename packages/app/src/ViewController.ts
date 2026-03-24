/**
 * @framesquared/app – ViewController
 *
 * Tied to a specific view (Component).  Provides `control` config
 * for auto-wiring DOM event handlers via CSS selectors, view reference
 * lookup, and lifecycle management.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ViewControllerConfig {
  id?: string;
  control?: Record<string, Record<string, string>>;
  listen?: Record<string, any>;
  routes?: Record<string, string>;
}

export class ViewController {
  private _id: string;
  private _view: any = null;
  private _control: Record<string, Record<string, string>>;
  private _cleanups: (() => void)[] = [];

  constructor(config: ViewControllerConfig = {}) {
    this._id = config.id ?? '';
    this._control = config.control ?? {};
  }

  getId(): string {
    return this._id;
  }

  // -----------------------------------------------------------------------
  // View lifecycle
  // -----------------------------------------------------------------------

  init(view: any): void {
    this._view = view;
  }

  destroy(): void {
    for (const cleanup of this._cleanups) cleanup();
    this._cleanups = [];
    this._view = null;
  }

  getView(): any {
    return this._view;
  }

  // -----------------------------------------------------------------------
  // References
  // -----------------------------------------------------------------------

  lookupReference(ref: string): any {
    return this._view?.lookupReference?.(ref) ?? null;
  }

  // -----------------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------------

  fireViewEvent(eventName: string, ...args: unknown[]): void {
    const view = this._view;
    if (!view) return;
    if (typeof view.fireEvent === 'function') {
      view.fireEvent(eventName, ...args);
    } else if (typeof view.fire === 'function') {
      view.fire(eventName, ...args);
    }
  }

  // -----------------------------------------------------------------------
  // Control — auto-wire DOM events
  // -----------------------------------------------------------------------

  applyControl(): void {
    if (!this._view?.el) return;

    for (const [selector, events] of Object.entries(this._control)) {
      // Convert ExtJS-style selectors to CSS
      const cssSelector = this.toCssSelector(selector);
      const elements = this._view.el.querySelectorAll(cssSelector);

      for (const el of elements) {
        for (const [eventName, methodName] of Object.entries(events)) {
          const method = (this as any)[methodName];
          if (typeof method !== 'function') continue;
          const handler = (...args: unknown[]) => method.call(this, ...args);
          (el as HTMLElement).addEventListener(eventName, handler);
          this._cleanups.push(() => (el as HTMLElement).removeEventListener(eventName, handler));
        }
      }
    }
  }

  private toCssSelector(sel: string): string {
    // Convert #id to [id="id"], keep other selectors as-is
    return sel.replace(/#(\w+)/g, '[id="$1"]');
  }

  // -----------------------------------------------------------------------
  // Routing
  // -----------------------------------------------------------------------

  redirectTo(hash: string, _force?: boolean): void {
    window.location.hash = hash;
  }
}
