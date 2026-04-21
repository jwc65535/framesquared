/**
 * WindowDemo.ts
 *
 * Factory that constructs the main Window and all of its child components.
 * Returns a refs object so both App.ts (live) and WindowDemo.spec.ts (tests)
 * share the same component instances without code duplication.
 *
 * Framework note — resizable:
 *   WindowConfig.resizable is declared but not internally wired by Window.
 *   Resize behaviour is attached manually inside the 'show' listener via
 *   Resizable from @framesquared/dd.  This is the established framework
 *   pattern (identical to the border-layout-demo splitters) and remains
 *   correct until Window internalises the wiring.
 */

import '@framesquared/layout';
import { Window, Panel, Toolbar, Button } from '@framesquared/ui';
import { Resizable } from '@framesquared/dd';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface WindowDemoRefs {
  /** The main floating Window */
  win: Window;
  /** Button that opens the modal confirmation dialog */
  showModalBtn: Button;
  /** Button that centres the window in the viewport */
  centerBtn: Button;
  /** Toolbar docked inside the window body */
  innerToolbar: Toolbar;
  /** Nested Panel that hosts the action buttons */
  contentPanel: Panel;
  /**
   * Mutable counters incremented by the 'refresh' and 'gear' tool handlers.
   * Tests read these to assert that tool click handlers fire correctly.
   */
  refreshCallCount: { value: number };
  gearCallCount: { value: number };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createWindowDemo(): WindowDemoRefs {
  const refreshCallCount = { value: 0 };
  const gearCallCount   = { value: 0 };

  // ── Inner action toolbar ─────────────────────────────────────────────────
  const showModalBtn = new Button({
    text: 'Show Modal Window',
    ui: 'primary',
    handler: () => openModalWindow(),
  });

  const centerBtn = new Button({
    text: 'Center',
    ui: 'default',
    handler: () => win.center(),
  });

  const innerToolbar = new Toolbar({
    items: [showModalBtn, '->', centerBtn],
  });

  // ── Nested content panel — fulfils the "child component hosting" spec ─────
  const contentPanel = new Panel({
    title: 'Nested Content Panel',
    flex: 1,
    bodyPadding: 12,
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new Button({ text: 'Action A', ui: 'default' }),
      new Button({ text: 'Action B', ui: 'default' }),
      new Button({ text: 'Danger Action', ui: 'danger' }),
    ],
  });

  // ── Main Window ───────────────────────────────────────────────────────────
  const win = new Window({
    title: 'Window Capabilities Demo',
    width: 520,
    height: 400,
    x: 80,
    y: 60,
    draggable: true,
    resizable: true,      // config declared; Resizable wired via 'show' listener
    maximizable: true,
    minimizable: true,
    closeAction: 'hide',
    tools: [
      { type: 'refresh', handler: () => { refreshCallCount.value++; } },
      { type: 'gear',    handler: () => { gearCallCount.value++; } },
    ],
    layout: { type: 'vbox', align: 'stretch' },
    items: [innerToolbar, contentPanel],
    listeners: {
      show: () => wireResizable(win),
    },
  });

  return {
    win,
    showModalBtn,
    centerBtn,
    innerToolbar,
    contentPanel,
    refreshCallCount,
    gearCallCount,
  };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Attach Resizable handles to the window's root element on first show.
 * Idempotent — guards against duplicate attachment on show/hide/show cycles.
 */
function wireResizable(target: Window): void {
  if (!target.el) return;
  if (target.el.querySelector('.x-resizable-handle-se')) return;
  new Resizable({
    el: target.el,
    handles: 'se s e',
    minWidth: 300,
    minHeight: 200,
  });
}

/**
 * Create and immediately show a modal confirmation Window.
 * Demonstrates modal: true — a fixed backdrop mask is inserted into body
 * at a z-index one step below the dialog, blocking interaction behind it.
 */
function openModalWindow(): void {
  let modalDialog: Window;

  const closeBtn = new Button({
    text: 'Close',
    ui: 'primary',
    handler: () => modalDialog.close(),
  });

  modalDialog = new Window({
    title: 'Confirmation Required',
    modal: true,
    width: 360,
    height: 200,
    closeAction: 'destroy',
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new Panel({
        border: false,
        header: false,
        bodyPadding: 16,
        layout: { type: 'vbox', align: 'stretch' },
        items: [closeBtn],
      }),
    ],
  });

  modalDialog.show();
}
