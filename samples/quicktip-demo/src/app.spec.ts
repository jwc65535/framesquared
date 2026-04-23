/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * quicktip-demo — app.spec.ts
 *
 * TDD test suite for the QuickTip demonstration.
 * Tests are written against the exported factory/refs before
 * the production Application wiring runs.
 *
 * Coverage:
 *   1. View structure        — Panel, all six Button refs present
 *   2. QuickTipManager state — init, enable, disable, isEnabled
 *   3. Component qtip config — data attributes set by qtip/qtitle/qwidth/qdismissdelay
 *   4. register / unregister — QuickTipManager.register sets attributes; unregister removes them
 *   5. Tooltip appearance    — mouseover + fake timers; content, header, width
 *   6. Toggle button         — enable/disable + text changes + statusLabel update
 *   7. Auto-dismiss          — qdismissdelay auto-hides the tooltip
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import '@framesquared/layout';
import { Button, QuickTipManager } from '@framesquared/ui';
import { createQuickTipDemo } from './app.js';
import type { QuickTipDemoRefs } from './app.js';

// ---------------------------------------------------------------------------
// PointerEvent polyfill — jsdom 24 does not include PointerEvent
// ---------------------------------------------------------------------------

beforeAll(() => {
  if (typeof globalThis.PointerEvent === 'undefined') {
    class PointerEvent extends MouseEvent {
      constructor(type: string, init?: PointerEventInit) {
        super(type, init);
      }
    }
    (globalThis as any).PointerEvent = PointerEvent;
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function click(el: Element): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function hover(el: Element): void {
  el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
}

function leave(el: Element): void {
  el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let host: HTMLDivElement;
let refs: QuickTipDemoRefs;

beforeEach(() => {
  vi.useFakeTimers();
  host = document.createElement('div');
  document.body.appendChild(host);
  refs = createQuickTipDemo(host);
});

afterEach(() => {
  vi.useRealTimers();
  QuickTipManager.disable();
  document.querySelectorAll('.x-tooltip').forEach((el) => el.parentNode?.removeChild(el));
  if (host.parentNode) host.parentNode.removeChild(host);
});

// ═══════════════════════════════════════════════════════════════════════════
// 1 · View structure
// ═══════════════════════════════════════════════════════════════════════════

describe('View structure', () => {
  it('createQuickTipDemo returns a refs object', () => {
    expect(refs).toBeDefined();
  });

  it('simpleBtn is a Button instance', () => {
    expect(refs.simpleBtn).toBeInstanceOf(Button);
  });

  it('complexBtn is a Button instance', () => {
    expect(refs.complexBtn).toBeInstanceOf(Button);
  });

  it('dismissBtn is a Button instance', () => {
    expect(refs.dismissBtn).toBeInstanceOf(Button);
  });

  it('registerBtn is a Button instance', () => {
    expect(refs.registerBtn).toBeInstanceOf(Button);
  });

  it('toggleBtn is a Button instance', () => {
    expect(refs.toggleBtn).toBeInstanceOf(Button);
  });

  it('statusLabel is a Button instance', () => {
    expect(refs.statusLabel).toBeInstanceOf(Button);
  });

  it('a top-level Panel renders inside host', () => {
    expect(host.querySelector('.x-panel')).toBeTruthy();
  });

  it('simpleBtn renders inside host', () => {
    expect(host.contains(refs.simpleBtn.el)).toBe(true);
  });

  it('complexBtn renders inside host', () => {
    expect(host.contains(refs.complexBtn.el)).toBe(true);
  });

  it('dismissBtn renders inside host', () => {
    expect(host.contains(refs.dismissBtn.el)).toBe(true);
  });

  it('registerBtn renders inside host', () => {
    expect(host.contains(refs.registerBtn.el)).toBe(true);
  });

  it('toggleBtn renders with text "Disable Tips"', () => {
    expect(refs.toggleBtn.el!.textContent).toContain('Disable Tips');
  });

  it('statusLabel renders with initial enabled text', () => {
    expect(refs.statusLabel.el!.textContent).toContain('enabled');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · QuickTipManager state
// ═══════════════════════════════════════════════════════════════════════════

describe('QuickTipManager state', () => {
  it('createQuickTipDemo calls init() — isEnabled is true', () => {
    expect(QuickTipManager.isEnabled()).toBe(true);
  });

  it('disable() sets isEnabled to false', () => {
    QuickTipManager.disable();
    expect(QuickTipManager.isEnabled()).toBe(false);
  });

  it('enable() restores isEnabled to true', () => {
    QuickTipManager.disable();
    QuickTipManager.enable();
    expect(QuickTipManager.isEnabled()).toBe(true);
  });

  it('init() re-enables after disable()', () => {
    QuickTipManager.disable();
    QuickTipManager.init();
    expect(QuickTipManager.isEnabled()).toBe(true);
    QuickTipManager.disable();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Component qtip config → DOM data attributes
// ═══════════════════════════════════════════════════════════════════════════

describe('Component qtip config', () => {
  it('simpleBtn.el has data-qtip set', () => {
    expect(refs.simpleBtn.el!.getAttribute('data-qtip')).toBeTruthy();
  });

  it('simpleBtn data-qtip contains meaningful text', () => {
    expect(refs.simpleBtn.el!.getAttribute('data-qtip')!.length).toBeGreaterThan(0);
  });

  it('complexBtn.el has data-qtip set', () => {
    expect(refs.complexBtn.el!.getAttribute('data-qtip')).toBeTruthy();
  });

  it('complexBtn.el has data-qtitle set', () => {
    expect(refs.complexBtn.el!.getAttribute('data-qtitle')).toBe('Button Details');
  });

  it('complexBtn.el has data-qwidth set to 220', () => {
    expect(refs.complexBtn.el!.getAttribute('data-qwidth')).toBe('220');
  });

  it('dismissBtn.el has data-qdismissdelay set to 1500', () => {
    expect(refs.dismissBtn.el!.getAttribute('data-qdismissdelay')).toBe('1500');
  });

  it('registerBtn.el does NOT have data-qtip before register() is called directly', () => {
    // The factory already called register(); unregister first, then test
    QuickTipManager.unregister(refs.registerBtn.el!);
    expect(refs.registerBtn.el!.getAttribute('data-qtip')).toBeNull();
  });

  it('registerBtn.el has data-qtip after register() is called by the factory', () => {
    expect(refs.registerBtn.el!.getAttribute('data-qtip')).toBeTruthy();
  });

  it('registerBtn.el has data-qtitle after register() is called by the factory', () => {
    expect(refs.registerBtn.el!.getAttribute('data-qtitle')).toBe('Registered Tip');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4 · QuickTipManager.register() / unregister()
// ═══════════════════════════════════════════════════════════════════════════

describe('QuickTipManager.register() and unregister()', () => {
  it('register() sets data-qtip on an arbitrary element', () => {
    const el = document.createElement('div');
    QuickTipManager.register({ target: el, text: 'Hello' });
    expect(el.getAttribute('data-qtip')).toBe('Hello');
  });

  it('register() sets data-qtitle when provided', () => {
    const el = document.createElement('div');
    QuickTipManager.register({ target: el, text: 'Body', title: 'My Title' });
    expect(el.getAttribute('data-qtitle')).toBe('My Title');
  });

  it('register() sets data-qwidth when provided', () => {
    const el = document.createElement('div');
    QuickTipManager.register({ target: el, text: 'Body', width: 300 });
    expect(el.getAttribute('data-qwidth')).toBe('300');
  });

  it('register() sets data-qdismissdelay when provided', () => {
    const el = document.createElement('div');
    QuickTipManager.register({ target: el, text: 'Body', dismissDelay: 2000 });
    expect(el.getAttribute('data-qdismissdelay')).toBe('2000');
  });

  it('register() without optional fields does not set those attributes', () => {
    const el = document.createElement('div');
    QuickTipManager.register({ target: el, text: 'Body' });
    expect(el.getAttribute('data-qtitle')).toBeNull();
    expect(el.getAttribute('data-qwidth')).toBeNull();
    expect(el.getAttribute('data-qdismissdelay')).toBeNull();
  });

  it('unregister() removes data-qtip', () => {
    const el = document.createElement('div');
    QuickTipManager.register({ target: el, text: 'Tip' });
    QuickTipManager.unregister(el);
    expect(el.getAttribute('data-qtip')).toBeNull();
  });

  it('unregister() removes data-qtitle', () => {
    const el = document.createElement('div');
    QuickTipManager.register({ target: el, text: 'Tip', title: 'T' });
    QuickTipManager.unregister(el);
    expect(el.getAttribute('data-qtitle')).toBeNull();
  });

  it('unregister() removes data-qwidth', () => {
    const el = document.createElement('div');
    QuickTipManager.register({ target: el, text: 'Tip', width: 200 });
    QuickTipManager.unregister(el);
    expect(el.getAttribute('data-qwidth')).toBeNull();
  });

  it('unregister() removes data-qdismissdelay', () => {
    const el = document.createElement('div');
    QuickTipManager.register({ target: el, text: 'Tip', dismissDelay: 500 });
    QuickTipManager.unregister(el);
    expect(el.getAttribute('data-qdismissdelay')).toBeNull();
  });

  it('element is no longer a tooltip target after unregister()', () => {
    QuickTipManager.unregister(refs.registerBtn.el!);
    expect(refs.registerBtn.el!.getAttribute('data-qtip')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5 · Tooltip appearance
// ═══════════════════════════════════════════════════════════════════════════

describe('Tooltip appearance', () => {
  it('mouseover + 500ms shows .x-tooltip in the DOM', () => {
    hover(refs.simpleBtn.el!);
    vi.advanceTimersByTime(600);
    expect(document.querySelector('.x-tooltip')).toBeTruthy();
  });

  it('tooltip body text matches data-qtip value', () => {
    hover(refs.simpleBtn.el!);
    vi.advanceTimersByTime(600);
    const tip = document.querySelector('.x-tip-body');
    expect(tip).toBeTruthy();
    expect(tip!.textContent).toContain(refs.simpleBtn.el!.getAttribute('data-qtip')!);
  });

  it('tooltip does not appear before the 500ms show delay', () => {
    hover(refs.simpleBtn.el!);
    vi.advanceTimersByTime(499);
    const tip = document.querySelector('.x-tooltip');
    const isHidden = !tip || tip.classList.contains('x-tip-hidden') || (tip as HTMLElement).style.display === 'none';
    expect(isHidden).toBe(true);
  });

  it('complexBtn tooltip shows data-qtitle in header', () => {
    hover(refs.complexBtn.el!);
    vi.advanceTimersByTime(600);
    const header = document.querySelector('.x-tip-header');
    expect(header).toBeTruthy();
    expect(header!.textContent).toBe('Button Details');
  });

  it('complexBtn tooltip respects data-qwidth', () => {
    hover(refs.complexBtn.el!);
    vi.advanceTimersByTime(600);
    const tip = document.querySelector('.x-tooltip') as HTMLElement;
    expect(tip).toBeTruthy();
    expect(tip.style.maxWidth).toBe('220px');
  });

  it('mouseout hides the tooltip after hide delay', () => {
    hover(refs.simpleBtn.el!);
    vi.advanceTimersByTime(600);
    leave(refs.simpleBtn.el!);
    vi.advanceTimersByTime(300);
    const tip = document.querySelector('.x-tooltip');
    const isHidden = !tip || tip.classList.contains('x-tip-hidden') || (tip as HTMLElement).style.display === 'none';
    expect(isHidden).toBe(true);
  });

  it('tooltip does NOT show when QuickTipManager is disabled', () => {
    QuickTipManager.disable();
    hover(refs.simpleBtn.el!);
    vi.advanceTimersByTime(600);
    const tip = document.querySelector('.x-tooltip');
    const isVisible = tip && !tip.classList.contains('x-tip-hidden') && (tip as HTMLElement).style.display !== 'none';
    expect(isVisible).toBeFalsy();
  });

  it('registerBtn tooltip appears (registered via register())', () => {
    hover(refs.registerBtn.el!);
    vi.advanceTimersByTime(600);
    const tip = document.querySelector('.x-tip-body');
    expect(tip!.textContent).toContain('Dynamically registered tooltip');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6 · Toggle button — enable / disable
// ═══════════════════════════════════════════════════════════════════════════

describe('Toggle button', () => {
  it('clicking toggleBtn disables QuickTipManager', () => {
    click(refs.toggleBtn.el!);
    expect(QuickTipManager.isEnabled()).toBe(false);
  });

  it('clicking toggleBtn changes its text to "Enable Tips"', () => {
    click(refs.toggleBtn.el!);
    expect(refs.toggleBtn.el!.textContent).toContain('Enable Tips');
  });

  it('clicking toggleBtn updates statusLabel to show "disabled"', () => {
    click(refs.toggleBtn.el!);
    expect(refs.statusLabel.el!.textContent).toContain('disabled');
  });

  it('clicking toggleBtn a second time re-enables QuickTipManager', () => {
    click(refs.toggleBtn.el!);
    click(refs.toggleBtn.el!);
    expect(QuickTipManager.isEnabled()).toBe(true);
  });

  it('clicking toggleBtn twice restores text to "Disable Tips"', () => {
    click(refs.toggleBtn.el!);
    click(refs.toggleBtn.el!);
    expect(refs.toggleBtn.el!.textContent).toContain('Disable Tips');
  });

  it('clicking toggleBtn twice restores statusLabel to "enabled"', () => {
    click(refs.toggleBtn.el!);
    click(refs.toggleBtn.el!);
    expect(refs.statusLabel.el!.textContent).toContain('enabled');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7 · Auto-dismiss (qdismissdelay)
// ═══════════════════════════════════════════════════════════════════════════

describe('Auto-dismiss (qdismissdelay)', () => {
  it('dismissBtn tooltip appears after 500ms', () => {
    hover(refs.dismissBtn.el!);
    vi.advanceTimersByTime(600);
    const tip = document.querySelector('.x-tooltip') as HTMLElement | null;
    expect(tip).toBeTruthy();
    expect(tip!.style.display).not.toBe('none');
  });

  it('dismissBtn tooltip auto-hides after qdismissdelay (1500ms)', () => {
    hover(refs.dismissBtn.el!);
    vi.advanceTimersByTime(600);  // show delay
    vi.advanceTimersByTime(1500); // dismiss delay
    const tip = document.querySelector('.x-tooltip');
    const isHidden = !tip || tip.classList.contains('x-tip-hidden') || (tip as HTMLElement).style.display === 'none';
    expect(isHidden).toBe(true);
  });

  it('simpleBtn tooltip does NOT auto-hide before mouseleave', () => {
    hover(refs.simpleBtn.el!);
    vi.advanceTimersByTime(600);
    vi.advanceTimersByTime(5000);
    const tip = document.querySelector('.x-tooltip');
    expect(tip).toBeTruthy();
    expect(tip!.classList.contains('x-tip-hidden')).toBe(false);
  });
});
