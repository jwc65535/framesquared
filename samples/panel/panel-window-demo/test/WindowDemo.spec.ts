/**
 * WindowDemo.spec.ts
 *
 * TDD test suite — Window Capabilities Demo
 *
 * Spec axes covered:
 *  1.  Application lifecycle        — name, singleton, hook order, launch override
 *  2.  Window configuration         — config properties before rendering
 *  3.  Window DOM after show()      — element presence, classes, ARIA, position
 *  4.  Lifecycle events             — show, hide, beforeclose, close, maximize,
 *                                     restore, minimize, move
 *  5.  Header tools                 — rendered tool elements, click handlers
 *  6.  Resizable capability         — handles present after first show()
 *  7.  Draggable capability         — header cursor, move event on pointer cycle
 *  8.  Maximize / restore cycle     — CSS class toggling, event sequence
 *  9.  Close behaviour (hide mode)  — fires events, hides without destroying
 * 10.  Nested content               — child panel + toolbar rendered within win.el
 * 11.  Modal window                 — backdrop mask, aria-modal attribute
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Window, Panel, Toolbar } from '@framesquared/ui';
import { createWindowDemo, type WindowDemoRefs } from '../src/WindowDemo.js';

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let refs: WindowDemoRefs;

beforeEach(() => {
  (globalThis as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
  Application.clearInstance();
  refs = createWindowDemo();
});

afterEach(() => {
  // Destroy only if the window was actually rendered; unrendered windows
  // have no DOM to clean up, but destroy() is safe either way.
  try { refs.win.destroy(); } catch { /* already destroyed by a test */ }
  document.body.innerHTML = '';
  Application.clearInstance();
});

// ════════════════════════════════════════════════════════════════════════════
// 1. Application lifecycle
// ════════════════════════════════════════════════════════════════════════════

describe('Application lifecycle', () => {
  it('instantiates with name "WindowCapabilitiesDemo"', () => {
    const app = new Application({ name: 'WindowCapabilitiesDemo' });
    expect(app.getName()).toBe('WindowCapabilitiesDemo');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'WindowCapabilitiesDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'WindowCapabilitiesDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'WindowCapabilitiesDemo',
      launch: () => order.push('launch'),
    });
    app.onInit        = () => order.push('onInit');
    app.onBeforeLaunch = () => order.push('onBeforeLaunch');
    app.onLaunch      = () => order.push('onLaunch');
    app.start();
    expect(order).toEqual(['onInit', 'onBeforeLaunch', 'launch', 'onLaunch']);
  });

  it('launch() override in a subclass is called by start()', () => {
    let launched = false;
    class DemoApp extends Application {
      constructor() { super({ name: 'WindowCapabilitiesDemo' }); }
      override launch(): void { launched = true; }
    }
    new DemoApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Window configuration (pre-render — no show() called)
// ════════════════════════════════════════════════════════════════════════════

describe('Window configuration (pre-render)', () => {
  it('win is a Window instance', () => {
    expect(refs.win).toBeInstanceOf(Window);
  });

  it('has title "Window Capabilities Demo"', () => {
    expect((refs.win as any)._config.title).toBe('Window Capabilities Demo');
  });

  it('has width: 520 in config', () => {
    expect((refs.win as any)._config.width).toBe(520);
  });

  it('has height: 400 in config', () => {
    expect((refs.win as any)._config.height).toBe(400);
  });

  it('has draggable: true in config', () => {
    expect((refs.win as any)._config.draggable).toBe(true);
  });

  it('has resizable: true in config', () => {
    expect((refs.win as any)._config.resizable).toBe(true);
  });

  it('has maximizable: true in config', () => {
    expect((refs.win as any)._config.maximizable).toBe(true);
  });

  it('has minimizable: true in config', () => {
    expect((refs.win as any)._config.minimizable).toBe(true);
  });

  it('has closeAction: "hide" in config', () => {
    expect((refs.win as any)._closeAction).toBe('hide');
  });

  it('is not rendered before show() is called', () => {
    expect(refs.win.rendered).toBe(false);
  });

  it('contentPanel is a Panel instance', () => {
    expect(refs.contentPanel).toBeInstanceOf(Panel);
  });

  it('innerToolbar is a Toolbar instance', () => {
    expect(refs.innerToolbar).toBeInstanceOf(Toolbar);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Window DOM after show()
// ════════════════════════════════════════════════════════════════════════════

describe('Window DOM after show()', () => {
  beforeEach(() => refs.win.show());

  it('el is not null after show()', () => {
    expect(refs.win.el).not.toBeNull();
  });

  it('document.body contains win.el', () => {
    expect(document.body.contains(refs.win.el!)).toBe(true);
  });

  it('el has the x-window class', () => {
    expect(refs.win.el!.classList.contains('x-window')).toBe(true);
  });

  it('el has role="dialog" for accessibility', () => {
    expect(refs.win.el!.getAttribute('role')).toBe('dialog');
  });

  it('el is position: fixed', () => {
    expect(refs.win.el!.style.position).toBe('fixed');
  });

  it('x position is set from config (left: 80px)', () => {
    expect(refs.win.el!.style.left).toBe('80px');
  });

  it('y position is set from config (top: 60px)', () => {
    expect(refs.win.el!.style.top).toBe('60px');
  });

  it('does not carry x-window-maximized class on initial render', () => {
    expect(refs.win.el!.classList.contains('x-window-maximized')).toBe(false);
  });

  it('rendered flag is true after show()', () => {
    expect(refs.win.rendered).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Lifecycle events
// ════════════════════════════════════════════════════════════════════════════

describe('Lifecycle events', () => {
  it('"show" fires when show() is called', () => {
    let fired = false;
    refs.win.on('show', () => { fired = true; });
    refs.win.show();
    expect(fired).toBe(true);
  });

  it('"hide" fires when hide() is called', () => {
    refs.win.show();
    let fired = false;
    refs.win.on('hide', () => { fired = true; });
    refs.win.hide();
    expect(fired).toBe(true);
  });

  it('"beforeclose" fires when close() is called', () => {
    refs.win.show();
    let fired = false;
    refs.win.on('beforeclose', () => { fired = true; });
    refs.win.close();
    expect(fired).toBe(true);
  });

  it('"close" fires when close() is called', () => {
    refs.win.show();
    let fired = false;
    refs.win.on('close', () => { fired = true; });
    refs.win.close();
    expect(fired).toBe(true);
  });

  it('"beforeclose" fires before "close"', () => {
    refs.win.show();
    const order: string[] = [];
    refs.win.on('beforeclose', () => order.push('beforeclose'));
    refs.win.on('close',       () => order.push('close'));
    refs.win.close();
    expect(order).toEqual(['beforeclose', 'close']);
  });

  it('"maximize" fires when maximize() is called', () => {
    refs.win.show();
    let fired = false;
    refs.win.on('maximize', () => { fired = true; });
    refs.win.maximize();
    expect(fired).toBe(true);
  });

  it('"restore" fires when restore() is called after maximize()', () => {
    refs.win.show();
    refs.win.maximize();
    let fired = false;
    refs.win.on('restore', () => { fired = true; });
    refs.win.restore();
    expect(fired).toBe(true);
  });

  it('"minimize" fires when minimize() is called', () => {
    refs.win.show();
    let fired = false;
    refs.win.on('minimize', () => { fired = true; });
    refs.win.minimize();
    expect(fired).toBe(true);
  });

  it('"hide" also fires when minimize() is called', () => {
    refs.win.show();
    let fired = false;
    refs.win.on('hide', () => { fired = true; });
    refs.win.minimize();
    expect(fired).toBe(true);
  });

  it('"move" fires after a simulated header drag-and-release', () => {
    refs.win.show();
    let fired = false;
    refs.win.on('move', () => { fired = true; });

    const header = refs.win.el!.querySelector('.x-panel-header') as HTMLElement;
    header.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 100 }));
    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 250, clientY: 130 }));
    document.dispatchEvent(new MouseEvent('pointerup',   { bubbles: true }));

    expect(fired).toBe(true);
  });

  it('"move" event delivers the updated x and y coordinates', () => {
    refs.win.show();
    let movedX = 0;
    let movedY = 0;
    refs.win.on('move', (_win: unknown, x: unknown, y: unknown) => {
      movedX = x as number;
      movedY = y as number;
    });

    const header = refs.win.el!.querySelector('.x-panel-header') as HTMLElement;
    header.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }));
    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 40, clientY: 20 }));
    document.dispatchEvent(new MouseEvent('pointerup',   { bubbles: true }));

    // drag offset (40, 20) applied to initial position (80, 60)
    expect(movedX).toBe(120);
    expect(movedY).toBe(80);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Header tools
// ════════════════════════════════════════════════════════════════════════════

describe('Header tools', () => {
  beforeEach(() => refs.win.show());

  it('refresh tool is rendered in the header (.x-tool-refresh)', () => {
    expect(refs.win.el!.querySelector('.x-tool-refresh')).not.toBeNull();
  });

  it('gear tool is rendered in the header (.x-tool-gear)', () => {
    expect(refs.win.el!.querySelector('.x-tool-gear')).not.toBeNull();
  });

  it('close tool is rendered (auto-generated from closable default)', () => {
    expect(refs.win.el!.querySelector('.x-tool-close')).not.toBeNull();
  });

  it('maximize tool is rendered (maximizable: true)', () => {
    expect(refs.win.el!.querySelector('.x-tool-maximize')).not.toBeNull();
  });

  it('minimize tool is rendered (minimizable: true)', () => {
    expect(refs.win.el!.querySelector('.x-tool-minimize')).not.toBeNull();
  });

  it('clicking the refresh tool increments refreshCallCount', () => {
    const toolEl = refs.win.el!.querySelector<HTMLElement>('.x-tool-refresh')!;
    toolEl.click();
    expect(refs.refreshCallCount.value).toBe(1);
  });

  it('clicking the refresh tool twice increments refreshCallCount to 2', () => {
    const toolEl = refs.win.el!.querySelector<HTMLElement>('.x-tool-refresh')!;
    toolEl.click();
    toolEl.click();
    expect(refs.refreshCallCount.value).toBe(2);
  });

  it('clicking the gear tool increments gearCallCount', () => {
    const toolEl = refs.win.el!.querySelector<HTMLElement>('.x-tool-gear')!;
    toolEl.click();
    expect(refs.gearCallCount.value).toBe(1);
  });

  it('gear and refresh counters are independent', () => {
    refs.win.el!.querySelector<HTMLElement>('.x-tool-refresh')!.click();
    refs.win.el!.querySelector<HTMLElement>('.x-tool-gear')!.click();
    refs.win.el!.querySelector<HTMLElement>('.x-tool-gear')!.click();
    expect(refs.refreshCallCount.value).toBe(1);
    expect(refs.gearCallCount.value).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Resizable capability (via @framesquared/dd Resizable, wired on show)
// ════════════════════════════════════════════════════════════════════════════

describe('Resizable capability', () => {
  beforeEach(() => refs.win.show());

  it('south-east resize handle is present after show()', () => {
    expect(refs.win.el!.querySelector('.x-resizable-handle-se')).not.toBeNull();
  });

  it('south resize handle is present after show()', () => {
    expect(refs.win.el!.querySelector('.x-resizable-handle-s')).not.toBeNull();
  });

  it('east resize handle is present after show()', () => {
    expect(refs.win.el!.querySelector('.x-resizable-handle-e')).not.toBeNull();
  });

  it('wireResizable is idempotent — calling show() again does not duplicate handles', () => {
    refs.win.hide();
    refs.win.show();
    const handles = refs.win.el!.querySelectorAll('.x-resizable-handle-se');
    expect(handles.length).toBe(1);
  });

  it('resize handles carry the x-resizable-handle base class', () => {
    const handles = refs.win.el!.querySelectorAll('.x-resizable-handle');
    expect(handles.length).toBeGreaterThanOrEqual(3);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Draggable capability
// ════════════════════════════════════════════════════════════════════════════

describe('Draggable capability', () => {
  beforeEach(() => refs.win.show());

  it('header has cursor: move style (drag affordance)', () => {
    const header = refs.win.el!.querySelector<HTMLElement>('.x-panel-header')!;
    expect(header.style.cursor).toBe('move');
  });

  it('dragging the header updates left position', () => {
    const header = refs.win.el!.querySelector('.x-panel-header') as HTMLElement;
    const initialLeft = parseInt(refs.win.el!.style.left, 10);

    header.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }));
    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 60, clientY: 0 }));
    document.dispatchEvent(new MouseEvent('pointerup',   { bubbles: true }));

    expect(parseInt(refs.win.el!.style.left, 10)).toBe(initialLeft + 60);
  });

  it('dragging the header updates top position', () => {
    const header = refs.win.el!.querySelector('.x-panel-header') as HTMLElement;
    const initialTop = parseInt(refs.win.el!.style.top, 10);

    header.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }));
    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 0, clientY: 30 }));
    document.dispatchEvent(new MouseEvent('pointerup',   { bubbles: true }));

    expect(parseInt(refs.win.el!.style.top, 10)).toBe(initialTop + 30);
  });

  it('drag does not move the window when maximized', () => {
    refs.win.maximize();
    const header = refs.win.el!.querySelector('.x-panel-header') as HTMLElement;

    header.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }));
    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 100, clientY: 0 }));
    document.dispatchEvent(new MouseEvent('pointerup',   { bubbles: true }));

    // Position remains at maximized state (0px)
    expect(refs.win.el!.style.left).toBe('0px');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Maximize / restore cycle
// ════════════════════════════════════════════════════════════════════════════

describe('Maximize / restore cycle', () => {
  beforeEach(() => refs.win.show());

  it('maximize() adds x-window-maximized class', () => {
    refs.win.maximize();
    expect(refs.win.el!.classList.contains('x-window-maximized')).toBe(true);
  });

  it('maximize() sets left/top to 0 and width/height to 100%', () => {
    refs.win.maximize();
    expect(refs.win.el!.style.left).toBe('0px');
    expect(refs.win.el!.style.top).toBe('0px');
    expect(refs.win.el!.style.width).toBe('100%');
    expect(refs.win.el!.style.height).toBe('100%');
  });

  it('restore() removes x-window-maximized class', () => {
    refs.win.maximize();
    refs.win.restore();
    expect(refs.win.el!.classList.contains('x-window-maximized')).toBe(false);
  });

  it('restore() reverts to pre-maximize position', () => {
    refs.win.maximize();
    refs.win.restore();
    expect(refs.win.el!.style.left).toBe('80px');
    expect(refs.win.el!.style.top).toBe('60px');
  });

  it('toggleMaximize() maximizes when not maximized', () => {
    refs.win.toggleMaximize();
    expect(refs.win.el!.classList.contains('x-window-maximized')).toBe(true);
  });

  it('toggleMaximize() restores when maximized', () => {
    refs.win.maximize();
    refs.win.toggleMaximize();
    expect(refs.win.el!.classList.contains('x-window-maximized')).toBe(false);
  });

  it('maximize() is a no-op when already maximized', () => {
    refs.win.maximize();
    let count = 0;
    refs.win.on('maximize', () => { count++; });
    refs.win.maximize();
    expect(count).toBe(0);
  });

  it('restore() is a no-op when not maximized', () => {
    let count = 0;
    refs.win.on('restore', () => { count++; });
    refs.win.restore();
    expect(count).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. Close behaviour — closeAction: 'hide'
// ════════════════════════════════════════════════════════════════════════════

describe('Close behaviour (closeAction: "hide")', () => {
  beforeEach(() => refs.win.show());

  it('close() fires "beforeclose"', () => {
    let fired = false;
    refs.win.on('beforeclose', () => { fired = true; });
    refs.win.close();
    expect(fired).toBe(true);
  });

  it('close() fires "close"', () => {
    let fired = false;
    refs.win.on('close', () => { fired = true; });
    refs.win.close();
    expect(fired).toBe(true);
  });

  it('close() hides but does not destroy the window', () => {
    refs.win.close();
    expect(refs.win.rendered).toBe(true);
    expect(refs.win.el).not.toBeNull();
  });

  it('window can be re-shown after close()', () => {
    refs.win.close();
    let showFired = false;
    refs.win.on('show', () => { showFired = true; });
    refs.win.show();
    expect(showFired).toBe(true);
  });

  it('closing the window via the close tool fires "close"', () => {
    let fired = false;
    refs.win.on('close', () => { fired = true; });
    const closeToolEl = refs.win.el!.querySelector<HTMLElement>('.x-tool-close')!;
    closeToolEl.click();
    expect(fired).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. Nested content
// ════════════════════════════════════════════════════════════════════════════

describe('Nested content', () => {
  beforeEach(() => refs.win.show());

  it('contentPanel is rendered after window.show()', () => {
    expect(refs.contentPanel.rendered).toBe(true);
  });

  it('contentPanel.el is contained within win.el', () => {
    expect(refs.win.el!.contains(refs.contentPanel.el!)).toBe(true);
  });

  it('contentPanel has 3 child items (Action A, B, Danger)', () => {
    expect(refs.contentPanel.getItems().length).toBe(3);
  });

  it('innerToolbar is rendered after window.show()', () => {
    expect(refs.innerToolbar.rendered).toBe(true);
  });

  it('innerToolbar.el is contained within win.el', () => {
    expect(refs.win.el!.contains(refs.innerToolbar.el!)).toBe(true);
  });

  it('showModalBtn.el is contained within innerToolbar.el', () => {
    expect(refs.innerToolbar.el!.contains(refs.showModalBtn.el!)).toBe(true);
  });

  it('centerBtn.el is contained within innerToolbar.el', () => {
    expect(refs.innerToolbar.el!.contains(refs.centerBtn.el!)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 11. Modal window (opened via showModalBtn)
// ════════════════════════════════════════════════════════════════════════════

describe('Modal window', () => {
  beforeEach(() => refs.win.show());

  it('clicking showModalBtn appends an .x-mask to document.body', () => {
    refs.showModalBtn.el!.click();
    expect(document.body.querySelector('.x-mask')).not.toBeNull();
  });

  it('clicking showModalBtn renders a second .x-window into document.body', () => {
    refs.showModalBtn.el!.click();
    const windows = document.body.querySelectorAll('.x-window');
    expect(windows.length).toBe(2);
  });

  it('the modal window carries aria-modal="true"', () => {
    refs.showModalBtn.el!.click();
    const windows = document.body.querySelectorAll<HTMLElement>('.x-window');
    const modalEl = Array.from(windows).find((el) => el.getAttribute('aria-modal') === 'true');
    expect(modalEl).not.toBeUndefined();
  });

  it('.x-mask is removed when the modal window is closed', () => {
    refs.showModalBtn.el!.click();
    const closeBtn = document.body.querySelector<HTMLElement>(
      '.x-window[aria-modal="true"] .x-tool-close',
    )!;
    closeBtn.click();
    expect(document.body.querySelector('.x-mask')).toBeNull();
  });
});
