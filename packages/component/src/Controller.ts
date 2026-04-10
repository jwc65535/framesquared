/**
 * @framesquared/component – Controller
 *
 * Base class for MVC controllers.  A Controller mediates between a Model and
 * a View: it listens to View-emitted events, issues commands to the Model, and
 * re-renders the View when the Model notifies it of state changes.
 *
 * Usage pattern
 * ─────────────
 *   class MyController extends Controller {
 *     override init(view) {
 *       super.init(view);
 *
 *       // Wire component events by reference
 *       this.control('saveBtn', { click: () => this.onSave() });
 *
 *       // Or look up a component directly
 *       const grid = this.lookupReference('mainGrid');
 *     }
 *
 *     onSave() { ... }
 *   }
 *
 *   const ctrl = new MyController({ id: 'my-ctrl' });
 *   ctrl.init(panelOrContainer);
 *
 * Notes
 * ─────
 * - The Controller owns no DOM — all rendering is done by the View.
 * - `control()` binds handler functions to `this` automatically.
 * - Call `destroy()` to detach all control listeners and release the view
 *   reference.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from './Component.js';
import type { Container } from './Container.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ControllerConfig {
  /** Optional stable identifier for this controller instance. */
  id?: string;
}

/** A map of event-name → handler used by {@link Controller.control}. */
export type EventMap = Record<string, (...args: any[]) => void>;

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

export class Controller {
  /** Stable identifier — auto-generated if not supplied in config. */
  readonly id: string;

  /** The Container (View) this controller is attached to, or null. */
  protected _view: Container | null = null;

  /** Cleanup callbacks registered by control(). */
  private _cleanups: (() => void)[] = [];

  private static _counter = 0;

  constructor(config: ControllerConfig = {}) {
    this.id = config.id ?? `ctrl-${++Controller._counter}`;
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Attach this controller to a view (Container).
   * Override in subclasses to wire up events; always call super.init(view).
   */
  init(view: Container): void {
    this._view = view;
  }

  /** Detach all control listeners and release the view reference. */
  destroy(): void {
    for (const cleanup of this._cleanups) cleanup();
    this._cleanups = [];
    this._view = null;
  }

  // -------------------------------------------------------------------------
  // View helpers
  // -------------------------------------------------------------------------

  /** Returns the attached view, or null if not yet initialised. */
  getView(): Container | null {
    return this._view;
  }

  /**
   * Find a child component within the view by its `reference` config value.
   * Returns undefined if the controller has no view or the reference is not
   * found.
   */
  lookupReference(ref: string): Component | undefined {
    return this._view?.lookupReference(ref);
  }

  /**
   * Wire one or more event handlers onto a component found by reference.
   * All handlers are bound to `this` (the controller instance).
   * The bindings are tracked so they can be removed on destroy().
   *
   * @param ref    The `reference` config value of the target component.
   * @param events A map of { eventName: handlerFn }.
   *
   * @example
   *   this.control('saveBtn', { click: this.onSave });
   *   this.control('grid',    { selectionchange: this.onSelect, itemclick: this.onItemClick });
   */
  control(ref: string, events: EventMap): void {
    const cmp = this.lookupReference(ref);
    if (!cmp) {
      console.warn(`Controller.control: no component with reference "${ref}" found in view`);
      return;
    }
    for (const [event, handler] of Object.entries(events)) {
      const bound = handler.bind(this);
      (cmp as any).on(event, bound);
      this._cleanups.push(() => (cmp as any).un?.(event, bound));
    }
  }
}
