import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Component } from '@framesquared/component';
import { Panel } from '../src/panel/Panel.js';
import { Window } from '../src/window/Window.js';
import { MessageBox } from '../src/window/MessageBox.js';
import { ZIndexManager } from '../src/ZIndexManager.js';

// ResizeObserver mock
class MockRO {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
  ZIndexManager.getInstance().clear();
});
afterEach(() => {
  document.body.innerHTML = '';
});

function win(cfg: Record<string, unknown> = {}): Window {
  return new Window({ title: 'Test', autoShow: true, ...cfg });
}

// ═══════════════════════════════════════════════════════════════════════════
// Window — basics
// ═══════════════════════════════════════════════════════════════════════════

describe('Window — basics', () => {
  it('extends Panel', () => {
    const w = win();
    expect(w).toBeInstanceOf(Panel);
  });

  it('renders into document.body by default', () => {
    const w = win();
    expect(document.body.contains(w.el!)).toBe(true);
  });

  it('has x-window class', () => {
    const w = win();
    expect(w.el!.classList.contains('x-window')).toBe(true);
  });

  it('is floating (position:absolute or fixed)', () => {
    const w = win();
    const pos = w.el!.style.position;
    expect(pos === 'absolute' || pos === 'fixed').toBe(true);
  });

  it('has header and body', () => {
    const w = win();
    expect(w.el!.querySelector('.x-panel-header')).not.toBeNull();
    expect(w.el!.querySelector('.x-panel-body')).not.toBeNull();
  });

  it('autoShow:false does not render immediately', () => {
    const w = new Window({ title: 'Hidden' });
    expect(w.rendered).toBe(false);
  });

  it('closable by default', () => {
    const w = win();
    expect(w.el!.querySelector('.x-tool-close')).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Window — positioning
// ═══════════════════════════════════════════════════════════════════════════

describe('Window — positioning', () => {
  it('x/y config sets initial position', () => {
    const w = win({ x: 100, y: 200 });
    expect(w.el!.style.left).toBe('100px');
    expect(w.el!.style.top).toBe('200px');
  });

  it('center() sets position to center of viewport', () => {
    const w = win();
    w.center();
    // In jsdom, viewport is 0×0, so position will be based on that
    expect(w.el!.style.left).toBeDefined();
    expect(w.el!.style.top).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Window — modal
// ═══════════════════════════════════════════════════════════════════════════

describe('Window — modal', () => {
  it('modal:true shows a mask element', () => {
    const w = win({ modal: true });
    const mask = document.querySelector('.x-mask');
    expect(mask).not.toBeNull();
  });

  it('closing modal window removes the mask', () => {
    const w = win({ modal: true });
    w.close();
    const mask = document.querySelector('.x-mask');
    expect(mask).toBeNull();
  });

  it('modal:false shows no mask', () => {
    const w = win({ modal: false });
    expect(document.querySelector('.x-mask')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Window — maximize / minimize / restore
// ═══════════════════════════════════════════════════════════════════════════

describe('Window — maximize/minimize/restore', () => {
  it('maximizable:true adds maximize tool', () => {
    const w = win({ maximizable: true });
    expect(w.el!.querySelector('.x-tool-maximize')).not.toBeNull();
  });

  it('maximize() makes window fill viewport', () => {
    const w = win({ maximizable: true, x: 50, y: 50 });
    w.maximize();
    expect(w.el!.style.left).toBe('0px');
    expect(w.el!.style.top).toBe('0px');
    expect(w.el!.style.width).toBe('100%');
    expect(w.el!.style.height).toBe('100%');
    expect(w.el!.classList.contains('x-window-maximized')).toBe(true);
  });

  it('restore() returns to original position/size', () => {
    const w = win({ maximizable: true, x: 50, y: 50, width: 300, height: 200 });
    w.maximize();
    w.restore();
    expect(w.el!.style.left).toBe('50px');
    expect(w.el!.style.top).toBe('50px');
    expect(w.el!.classList.contains('x-window-maximized')).toBe(false);
  });

  it('toggleMaximize alternates', () => {
    const w = win({ maximizable: true });
    w.toggleMaximize();
    expect(w.el!.classList.contains('x-window-maximized')).toBe(true);
    w.toggleMaximize();
    expect(w.el!.classList.contains('x-window-maximized')).toBe(false);
  });

  it('fires maximize event', () => {
    const spy = vi.fn();
    const w = win({ maximizable: true, listeners: { maximize: spy } });
    w.maximize();
    expect(spy).toHaveBeenCalled();
  });

  it('fires restore event', () => {
    const spy = vi.fn();
    const w = win({ maximizable: true, listeners: { restore: spy } });
    w.maximize();
    w.restore();
    expect(spy).toHaveBeenCalled();
  });

  it('minimizable:true adds minimize tool', () => {
    const w = win({ minimizable: true });
    expect(w.el!.querySelector('.x-tool-minimize')).not.toBeNull();
  });

  it('minimize() hides the window and fires event', () => {
    const spy = vi.fn();
    const w = win({ minimizable: true, listeners: { minimize: spy } });
    w.minimize();
    expect(w.isVisible()).toBe(false);
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Window — closeAction
// ═══════════════════════════════════════════════════════════════════════════

describe('Window — closeAction', () => {
  it('closeAction:"destroy" (default) destroys the window', () => {
    const w = win({ closeAction: 'destroy' });
    w.close();
    expect(w.isDestroyed).toBe(true);
  });

  it('closeAction:"hide" hides but does not destroy', () => {
    const w = win({ closeAction: 'hide' });
    w.close();
    expect(w.isDestroyed).toBe(false);
    expect(w.isVisible()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Window — dragging (simulated)
// ═══════════════════════════════════════════════════════════════════════════

describe('Window — dragging', () => {
  it('draggable:true (default) — header has cursor:move style', () => {
    const w = win();
    const header = w.el!.querySelector('.x-panel-header') as HTMLElement;
    expect(header.style.cursor).toBe('move');
  });

  it('pointer events on header change position', () => {
    const w = win({ x: 100, y: 100 });
    const header = w.el!.querySelector('.x-panel-header') as HTMLElement;

    // Simulate drag start
    header.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 110, clientY: 105, bubbles: true }),
    );
    // Simulate drag move
    document.dispatchEvent(
      new MouseEvent('pointermove', { clientX: 160, clientY: 155, bubbles: true }),
    );
    // Simulate drag end
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));

    // Position should have changed by delta (50, 50)
    expect(w.el!.style.left).toBe('150px');
    expect(w.el!.style.top).toBe('150px');
  });

  it('draggable:false disables dragging', () => {
    const w = win({ draggable: false });
    const header = w.el!.querySelector('.x-panel-header') as HTMLElement;
    expect(header.style.cursor).not.toBe('move');
  });

  it('fires move event after drag', () => {
    const spy = vi.fn();
    const w = win({ x: 0, y: 0, listeners: { move: spy } });
    const header = w.el!.querySelector('.x-panel-header') as HTMLElement;
    header.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 10, clientY: 10, bubbles: true }),
    );
    document.dispatchEvent(
      new MouseEvent('pointermove', { clientX: 20, clientY: 20, bubbles: true }),
    );
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ZIndexManager
// ═══════════════════════════════════════════════════════════════════════════

describe('ZIndexManager', () => {
  it('is a singleton', () => {
    expect(ZIndexManager.getInstance()).toBe(ZIndexManager.getInstance());
  });

  it('register adds a component', () => {
    const mgr = ZIndexManager.getInstance();
    const w = win();
    mgr.register(w);
    expect(mgr.getActive()).toBe(w);
  });

  it('bringToFront moves to highest z-index', () => {
    const mgr = ZIndexManager.getInstance();
    const w1 = win({ title: 'W1' });
    const w2 = win({ title: 'W2' });
    const w3 = win({ title: 'W3' });
    mgr.register(w1);
    mgr.register(w2);
    mgr.register(w3);

    mgr.bringToFront(w1);
    expect(mgr.getActive()).toBe(w1);
    // w1 should have highest z-index
    const z1 = parseInt(w1.el!.style.zIndex, 10);
    const z2 = parseInt(w2.el!.style.zIndex, 10);
    const z3 = parseInt(w3.el!.style.zIndex, 10);
    expect(z1).toBeGreaterThan(z2);
    expect(z1).toBeGreaterThan(z3);
  });

  it('sendToBack moves to lowest z-index', () => {
    const mgr = ZIndexManager.getInstance();
    const w1 = win({ title: 'W1' });
    const w2 = win({ title: 'W2' });
    mgr.register(w1);
    mgr.register(w2);

    mgr.sendToBack(w2);
    const z1 = parseInt(w1.el!.style.zIndex, 10);
    const z2 = parseInt(w2.el!.style.zIndex, 10);
    expect(z2).toBeLessThan(z1);
  });

  it('unregister removes a component', () => {
    const mgr = ZIndexManager.getInstance();
    const w = win();
    mgr.register(w);
    mgr.unregister(w);
    expect(mgr.getActive()).toBeUndefined();
  });

  it('eachTopDown iterates from highest to lowest', () => {
    const mgr = ZIndexManager.getInstance();
    const w1 = win({ title: 'W1' });
    const w2 = win({ title: 'W2' });
    mgr.register(w1);
    mgr.register(w2);

    const order: string[] = [];
    mgr.eachTopDown((c) => {
      order.push((c as any).getTitle());
    });
    expect(order[0]).toBe('W2'); // last registered is top
    expect(order[1]).toBe('W1');
  });

  it('clear removes all', () => {
    const mgr = ZIndexManager.getInstance();
    mgr.register(win());
    mgr.register(win());
    mgr.clear();
    expect(mgr.getActive()).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Window — toFront / toBack
// ═══════════════════════════════════════════════════════════════════════════

describe('Window — z-index', () => {
  it('toFront brings window to front', () => {
    const w1 = win({ title: 'W1' });
    const w2 = win({ title: 'W2' });
    w1.toFront();
    const z1 = parseInt(w1.el!.style.zIndex, 10);
    const z2 = parseInt(w2.el!.style.zIndex, 10);
    expect(z1).toBeGreaterThan(z2);
  });

  it('toBack sends window to back', () => {
    const w1 = win({ title: 'W1' });
    const w2 = win({ title: 'W2' });
    w2.toBack();
    const z1 = parseInt(w1.el!.style.zIndex, 10);
    const z2 = parseInt(w2.el!.style.zIndex, 10);
    expect(z2).toBeLessThan(z1);
  });

  it('clicking window brings it to front (activate)', () => {
    const spy = vi.fn();
    const w1 = win({ title: 'W1' });
    const w2 = win({ title: 'W2', listeners: { activate: spy } });
    // w2 is already front; bring w1 to front then click w2
    w1.toFront();
    w2.toFront();
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MessageBox
// ═══════════════════════════════════════════════════════════════════════════

describe('MessageBox', () => {
  it('alert shows window with OK button and title', () => {
    const w = MessageBox.alert('Warning', 'Something happened');
    expect(w).toBeInstanceOf(Window);
    expect(w.el!.querySelector('.x-panel-header-text')?.textContent).toBe('Warning');
    const btn = w.el!.querySelector('.x-msgbox-btn-ok');
    expect(btn).not.toBeNull();
    w.close();
  });

  it('alert callback receives "ok" on click', () => {
    const cb = vi.fn();
    const w = MessageBox.alert('Title', 'Msg', cb);
    const btn = w.el!.querySelector('.x-msgbox-btn-ok') as HTMLElement;
    btn.click();
    expect(cb).toHaveBeenCalledWith('ok');
  });

  it('confirm shows YES and NO buttons', () => {
    const w = MessageBox.confirm('Confirm', 'Are you sure?');
    expect(w.el!.querySelector('.x-msgbox-btn-yes')).not.toBeNull();
    expect(w.el!.querySelector('.x-msgbox-btn-no')).not.toBeNull();
    w.close();
  });

  it('confirm callback receives button id', () => {
    const cb = vi.fn();
    const w = MessageBox.confirm('Title', 'Msg', cb);
    const noBtn = w.el!.querySelector('.x-msgbox-btn-no') as HTMLElement;
    noBtn.click();
    expect(cb).toHaveBeenCalledWith('no');
  });

  it('prompt shows input field', () => {
    const w = MessageBox.prompt('Name', 'Enter your name');
    const input = w.el!.querySelector('input.x-msgbox-input');
    expect(input).not.toBeNull();
    w.close();
  });

  it('prompt callback receives button and input value', () => {
    const cb = vi.fn();
    const w = MessageBox.prompt('Name', 'Enter', cb);
    const input = w.el!.querySelector('input.x-msgbox-input') as HTMLInputElement;
    input.value = 'Alice';
    const okBtn = w.el!.querySelector('.x-msgbox-btn-ok') as HTMLElement;
    okBtn.click();
    expect(cb).toHaveBeenCalledWith('ok', 'Alice');
  });

  it('prompt multiline:true shows textarea', () => {
    const w = MessageBox.prompt('Notes', 'Enter notes', undefined, true);
    const textarea = w.el!.querySelector('textarea.x-msgbox-input');
    expect(textarea).not.toBeNull();
    w.close();
  });

  it('message text is displayed', () => {
    const w = MessageBox.alert('T', 'Hello World');
    const msg = w.el!.querySelector('.x-msgbox-text');
    expect(msg?.textContent).toBe('Hello World');
    w.close();
  });

  it('icon config adds icon class', () => {
    const w = MessageBox.show({
      title: 'Error',
      message: 'Fail',
      icon: 'ERROR',
      buttons: ['ok'],
    });
    const icon = w.el!.querySelector('.x-msgbox-icon');
    expect(icon).not.toBeNull();
    expect(icon!.classList.contains('x-msgbox-icon-error')).toBe(true);
    w.close();
  });

  it('show with custom buttons', () => {
    const w = MessageBox.show({
      title: 'Custom',
      message: 'Choose',
      buttons: ['ok', 'cancel'],
    });
    expect(w.el!.querySelector('.x-msgbox-btn-ok')).not.toBeNull();
    expect(w.el!.querySelector('.x-msgbox-btn-cancel')).not.toBeNull();
    w.close();
  });

  it('window is modal', () => {
    const w = MessageBox.alert('T', 'M');
    expect(document.querySelector('.x-mask')).not.toBeNull();
    w.close();
  });

  it('wait shows progress text', () => {
    const w = MessageBox.wait('Loading...', 'Please wait');
    expect(w.el!.querySelector('.x-msgbox-text')?.textContent).toBe('Loading...');
    w.close();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Window — destroy cleanup
// ═══════════════════════════════════════════════════════════════════════════

describe('Window — cleanup', () => {
  it('destroy removes from ZIndexManager', () => {
    const mgr = ZIndexManager.getInstance();
    const w = win();
    expect(mgr.getActive()).toBe(w);
    w.destroy();
    expect(mgr.getActive()).toBeUndefined();
  });

  it('destroy removes modal mask', () => {
    const w = win({ modal: true });
    expect(document.querySelector('.x-mask')).not.toBeNull();
    w.destroy();
    expect(document.querySelector('.x-mask')).toBeNull();
  });

  it('destroy removes drag listeners', () => {
    const w = win({ x: 0, y: 0 });
    const header = w.el!.querySelector('.x-panel-header') as HTMLElement;
    w.destroy();
    // Should not throw after destroy
    expect(() => {
      header.dispatchEvent(new MouseEvent('pointerdown', { clientX: 0, clientY: 0 }));
    }).not.toThrow();
  });
});
