/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * panel-messagebox-demo — app.spec.ts
 *
 * TDD test suite for the MessageBox demonstration.
 * Tests are written against the exported factory/refs before
 * the production Application wiring runs.
 *
 * Coverage:
 *   1. View structure  — Panel, Submit button, Cancel button
 *   2. Submit → MessageBox.confirm  — dialog shown, Yes/No callbacks
 *   3. Cancel → MessageBox.alert    — dialog shown, OK callback
 *   4. Console logging              — choice logged after each dialog button
 *   5. Dialog behavior              — modal mask, self-close on button click
 *   6. State tracking               — lastButtonId / lastDialogType refs
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import '@framesquared/layout';
import { Button, MessageBox } from '@framesquared/ui';
import { createMessageBoxDemo } from './app.js';
import type { MessageBoxDemoRefs } from './app.js';

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

/** Fires a synthetic click on an element (mirrors how the framework tests work). */
function click(el: Element): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

/** Returns the first .x-msgbox-btn-<id> element currently in the DOM. */
function msgBtn(id: string): HTMLElement {
  return document.querySelector(`.x-msgbox-btn-${id}`) as HTMLElement;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let host: HTMLDivElement;
let refs: MessageBoxDemoRefs;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  refs = createMessageBoxDemo(host);
});

afterEach(() => {
  // Destroy any open dialogs and their modal masks
  document.querySelectorAll('.x-msgbox, .x-mask, .x-window').forEach((el) => {
    if (el.parentNode) el.parentNode.removeChild(el);
  });
  if (host.parentNode) host.parentNode.removeChild(host);
});

// ═══════════════════════════════════════════════════════════════════════════
// 1 · View structure
// ═══════════════════════════════════════════════════════════════════════════

describe('View structure', () => {
  it('createMessageBoxDemo returns a refs object', () => {
    expect(refs).toBeDefined();
    expect(refs.submitBtn).toBeDefined();
    expect(refs.cancelBtn).toBeDefined();
  });

  it('submitBtn is a Button instance', () => {
    expect(refs.submitBtn).toBeInstanceOf(Button);
  });

  it('cancelBtn is a Button instance', () => {
    expect(refs.cancelBtn).toBeInstanceOf(Button);
  });

  it('Submit button renders with text "Submit"', () => {
    expect(refs.submitBtn.el!.textContent).toContain('Submit');
  });

  it('Cancel button renders with text "Cancel"', () => {
    expect(refs.cancelBtn.el!.textContent).toContain('Cancel');
  });

  it('a Panel element renders inside host', () => {
    expect(host.querySelector('.x-panel')).toBeTruthy();
  });

  it('the Panel contains both buttons', () => {
    const panel = host.querySelector('.x-panel')!;
    expect(panel.contains(refs.submitBtn.el)).toBe(true);
    expect(panel.contains(refs.cancelBtn.el)).toBe(true);
  });

  it('lastButtonId starts empty', () => {
    expect(refs.lastButtonId.value).toBe('');
  });

  it('lastDialogType starts empty', () => {
    expect(refs.lastDialogType.value).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Submit button → MessageBox.confirm
// ═══════════════════════════════════════════════════════════════════════════

describe('Submit button — MessageBox.confirm', () => {
  it('clicking Submit calls MessageBox.confirm', () => {
    const spy = vi.spyOn(MessageBox, 'confirm').mockReturnValue(null as any);
    click(refs.submitBtn.el!);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('MessageBox.confirm is called with a title string', () => {
    const spy = vi.spyOn(MessageBox, 'confirm').mockReturnValue(null as any);
    click(refs.submitBtn.el!);
    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Function),
    );
    spy.mockRestore();
  });

  it('clicking Submit sets lastDialogType to "confirm"', () => {
    const spy = vi.spyOn(MessageBox, 'confirm').mockReturnValue(null as any);
    click(refs.submitBtn.el!);
    expect(refs.lastDialogType.value).toBe('confirm');
    spy.mockRestore();
  });

  it('confirm dialog appears in the DOM after clicking Submit', () => {
    click(refs.submitBtn.el!);
    expect(document.querySelector('.x-msgbox')).toBeTruthy();
  });

  it('confirm dialog has a Yes button', () => {
    click(refs.submitBtn.el!);
    expect(msgBtn('yes')).toBeTruthy();
  });

  it('confirm dialog has a No button', () => {
    click(refs.submitBtn.el!);
    expect(msgBtn('no')).toBeTruthy();
  });

  it('confirm dialog does NOT have an OK button', () => {
    click(refs.submitBtn.el!);
    expect(msgBtn('ok')).toBeFalsy();
  });

  it('clicking Yes sets lastButtonId to "yes"', () => {
    click(refs.submitBtn.el!);
    click(msgBtn('yes'));
    expect(refs.lastButtonId.value).toBe('yes');
  });

  it('clicking No sets lastButtonId to "no"', () => {
    click(refs.submitBtn.el!);
    click(msgBtn('no'));
    expect(refs.lastButtonId.value).toBe('no');
  });

  it('clicking Yes closes the confirm dialog', () => {
    click(refs.submitBtn.el!);
    click(msgBtn('yes'));
    expect(document.querySelector('.x-msgbox-btn-yes')).toBeFalsy();
  });

  it('clicking No closes the confirm dialog', () => {
    click(refs.submitBtn.el!);
    click(msgBtn('no'));
    expect(document.querySelector('.x-msgbox-btn-no')).toBeFalsy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Cancel button → MessageBox.alert
// ═══════════════════════════════════════════════════════════════════════════

describe('Cancel button — MessageBox.alert', () => {
  it('clicking Cancel calls MessageBox.alert', () => {
    const spy = vi.spyOn(MessageBox, 'alert').mockReturnValue(null as any);
    click(refs.cancelBtn.el!);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('MessageBox.alert is called with a title string', () => {
    const spy = vi.spyOn(MessageBox, 'alert').mockReturnValue(null as any);
    click(refs.cancelBtn.el!);
    expect(spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Function),
    );
    spy.mockRestore();
  });

  it('clicking Cancel sets lastDialogType to "alert"', () => {
    const spy = vi.spyOn(MessageBox, 'alert').mockReturnValue(null as any);
    click(refs.cancelBtn.el!);
    expect(refs.lastDialogType.value).toBe('alert');
    spy.mockRestore();
  });

  it('alert dialog appears in the DOM after clicking Cancel', () => {
    click(refs.cancelBtn.el!);
    expect(document.querySelector('.x-msgbox')).toBeTruthy();
  });

  it('alert dialog has an OK button', () => {
    click(refs.cancelBtn.el!);
    expect(msgBtn('ok')).toBeTruthy();
  });

  it('alert dialog does NOT have Yes/No buttons', () => {
    click(refs.cancelBtn.el!);
    expect(msgBtn('yes')).toBeFalsy();
    expect(msgBtn('no')).toBeFalsy();
  });

  it('clicking OK sets lastButtonId to "ok"', () => {
    click(refs.cancelBtn.el!);
    click(msgBtn('ok'));
    expect(refs.lastButtonId.value).toBe('ok');
  });

  it('clicking OK closes the alert dialog', () => {
    click(refs.cancelBtn.el!);
    click(msgBtn('ok'));
    expect(document.querySelector('.x-msgbox-btn-ok')).toBeFalsy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Console logging
// ═══════════════════════════════════════════════════════════════════════════

describe('Console logging', () => {
  it('logs "yes" to console when confirm Yes is clicked', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    click(refs.submitBtn.el!);
    click(msgBtn('yes'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('yes'));
    spy.mockRestore();
  });

  it('logs "no" to console when confirm No is clicked', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    click(refs.submitBtn.el!);
    click(msgBtn('no'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('no'));
    spy.mockRestore();
  });

  it('logs "ok" to console when alert OK is clicked', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    click(refs.cancelBtn.el!);
    click(msgBtn('ok'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('ok'));
    spy.mockRestore();
  });

  it('console.log is NOT called before any dialog button is clicked', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    click(refs.submitBtn.el!);
    // Dialog is open but no button clicked yet
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5 · Dialog behavior
// ═══════════════════════════════════════════════════════════════════════════

describe('Dialog behavior', () => {
  it('confirm dialog is modal — mask element exists after Submit click', () => {
    click(refs.submitBtn.el!);
    expect(document.querySelector('.x-mask')).toBeTruthy();
  });

  it('alert dialog is modal — mask element exists after Cancel click', () => {
    click(refs.cancelBtn.el!);
    expect(document.querySelector('.x-mask')).toBeTruthy();
  });

  it('confirm dialog message text is visible', () => {
    click(refs.submitBtn.el!);
    const msgEl = document.querySelector('.x-msgbox-text');
    expect(msgEl).toBeTruthy();
    expect(msgEl!.textContent!.length).toBeGreaterThan(0);
  });

  it('alert dialog message text is visible', () => {
    click(refs.cancelBtn.el!);
    const msgEl = document.querySelector('.x-msgbox-text');
    expect(msgEl).toBeTruthy();
    expect(msgEl!.textContent!.length).toBeGreaterThan(0);
  });

  it('confirm dialog has a title in the header', () => {
    click(refs.submitBtn.el!);
    const header = document.querySelector('.x-panel-header-text');
    expect(header).toBeTruthy();
    expect(header!.textContent!.length).toBeGreaterThan(0);
  });

  it('alert dialog has a title in the header', () => {
    click(refs.cancelBtn.el!);
    const header = document.querySelector('.x-panel-header-text');
    expect(header).toBeTruthy();
    expect(header!.textContent!.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6 · State tracking across interactions
// ═══════════════════════════════════════════════════════════════════════════

describe('State tracking', () => {
  it('lastDialogType is "confirm" after Submit, "alert" after Cancel', () => {
    const confirmSpy = vi.spyOn(MessageBox, 'confirm').mockReturnValue(null as any);
    click(refs.submitBtn.el!);
    expect(refs.lastDialogType.value).toBe('confirm');
    confirmSpy.mockRestore();

    const alertSpy = vi.spyOn(MessageBox, 'alert').mockReturnValue(null as any);
    click(refs.cancelBtn.el!);
    expect(refs.lastDialogType.value).toBe('alert');
    alertSpy.mockRestore();
  });

  it('lastButtonId updates on each subsequent dialog button click', () => {
    click(refs.submitBtn.el!);
    click(msgBtn('yes'));
    expect(refs.lastButtonId.value).toBe('yes');

    click(refs.cancelBtn.el!);
    click(msgBtn('ok'));
    expect(refs.lastButtonId.value).toBe('ok');
  });

  it('Submit can be clicked more than once producing fresh dialogs', () => {
    const spy = vi.spyOn(MessageBox, 'confirm').mockReturnValue(null as any);
    click(refs.submitBtn.el!);
    click(refs.submitBtn.el!);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
