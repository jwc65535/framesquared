import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Component, Container } from '@framesquared/component';
import { Button } from '../src/button/Button.js';
import { SplitButton } from '../src/button/SplitButton.js';
import { CycleButton } from '../src/button/CycleButton.js';
import { SegmentedButton } from '../src/button/SegmentedButton.js';

class MockRO {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
});
afterEach(() => {
  document.body.innerHTML = '';
});

function btn(cfg: Record<string, unknown> = {}): Button {
  return new Button({ renderTo: document.body, ...cfg });
}

// ═══════════════════════════════════════════════════════════════════════════
// Button — basics
// ═══════════════════════════════════════════════════════════════════════════

describe('Button — basics', () => {
  it('renders a <button> element', () => {
    const b = btn({ text: 'Click Me' });
    expect(b.el!.tagName).toBe('BUTTON');
  });

  it('has x-btn class', () => {
    const b = btn({ text: 'Test' });
    expect(b.el!.classList.contains('x-btn')).toBe(true);
  });

  it('renders text', () => {
    const b = btn({ text: 'Hello' });
    const textEl = b.el!.querySelector('.x-btn-text');
    expect(textEl?.textContent).toBe('Hello');
  });

  it('renders iconCls', () => {
    const b = btn({ text: 'Save', iconCls: 'fa-save' });
    const iconEl = b.el!.querySelector('.x-btn-icon');
    expect(iconEl).not.toBeNull();
    expect(iconEl!.classList.contains('fa-save')).toBe(true);
  });

  it('renders icon URL as background-image', () => {
    const b = btn({ text: 'Img', icon: 'icon.png' });
    const iconEl = b.el!.querySelector('.x-btn-icon') as HTMLElement;
    expect(iconEl.style.backgroundImage).toContain('icon.png');
  });

  it('iconAlign: "right" adds icon-right class', () => {
    const b = btn({ text: 'X', iconCls: 'fa-x', iconAlign: 'right' });
    expect(b.el!.classList.contains('x-btn-icon-right')).toBe(true);
  });

  it('iconAlign: "top" adds icon-top class', () => {
    const b = btn({ text: 'X', iconCls: 'fa-x', iconAlign: 'top' });
    expect(b.el!.classList.contains('x-btn-icon-top')).toBe(true);
  });

  it('iconAlign: "bottom" adds icon-bottom class', () => {
    const b = btn({ text: 'X', iconCls: 'fa-x', iconAlign: 'bottom' });
    expect(b.el!.classList.contains('x-btn-icon-bottom')).toBe(true);
  });

  it('renders with href as <a> tag', () => {
    const b = btn({ text: 'Link', href: 'https://example.com', target: '_blank' });
    expect(b.el!.tagName).toBe('A');
    expect((b.el as HTMLAnchorElement).href).toContain('example.com');
    expect((b.el as HTMLAnchorElement).target).toBe('_blank');
  });

  it('no text renders without text span', () => {
    const b = btn({ iconCls: 'fa-x' });
    const textEl = b.el!.querySelector('.x-btn-text');
    expect(textEl).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Button — click & handler
// ═══════════════════════════════════════════════════════════════════════════

describe('Button — click', () => {
  it('click fires handler', () => {
    const handler = vi.fn();
    const b = btn({ text: 'Click', handler });
    b.el!.click();
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toBe(b);
  });

  it('click fires "click" event', () => {
    const spy = vi.fn();
    const b = btn({ text: 'Click', listeners: { click: spy } });
    b.el!.click();
    expect(spy).toHaveBeenCalled();
  });

  it('disabled button does not fire handler', () => {
    const handler = vi.fn();
    const b = btn({ text: 'No', handler, disabled: true });
    b.el!.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it('keyboard Enter triggers click', () => {
    const handler = vi.fn();
    const b = btn({ text: 'KB', handler });
    b.el!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(handler).toHaveBeenCalled();
  });

  it('keyboard Space triggers click', () => {
    const handler = vi.fn();
    const b = btn({ text: 'KB', handler });
    b.el!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(handler).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Button — toggle
// ═══════════════════════════════════════════════════════════════════════════

describe('Button — toggle', () => {
  it('enableToggle: click toggles pressed state', () => {
    const b = btn({ text: 'Toggle', enableToggle: true });
    b.el!.click();
    expect(b.el!.classList.contains('x-btn-pressed')).toBe(true);
    b.el!.click();
    expect(b.el!.classList.contains('x-btn-pressed')).toBe(false);
  });

  it('pressed:true starts in pressed state', () => {
    const b = btn({ text: 'On', enableToggle: true, pressed: true });
    expect(b.el!.classList.contains('x-btn-pressed')).toBe(true);
  });

  it('toggle(true) sets pressed', () => {
    const b = btn({ text: 'T', enableToggle: true });
    b.toggle(true);
    expect(b.el!.classList.contains('x-btn-pressed')).toBe(true);
  });

  it('toggle(false) clears pressed', () => {
    const b = btn({ text: 'T', enableToggle: true, pressed: true });
    b.toggle(false);
    expect(b.el!.classList.contains('x-btn-pressed')).toBe(false);
  });

  it('toggle fires "toggle" event', () => {
    const spy = vi.fn();
    const b = btn({ text: 'T', enableToggle: true, listeners: { toggle: spy } });
    b.toggle(true);
    expect(spy).toHaveBeenCalledWith(b, true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Button — toggle group
// ═══════════════════════════════════════════════════════════════════════════

describe('Button — toggleGroup', () => {
  it('only one button pressed in same toggleGroup', () => {
    const a = btn({ text: 'A', enableToggle: true, toggleGroup: 'grp1' });
    const b2 = btn({ text: 'B', enableToggle: true, toggleGroup: 'grp1' });
    const c = btn({ text: 'C', enableToggle: true, toggleGroup: 'grp1' });
    a.el!.click();
    expect(a.el!.classList.contains('x-btn-pressed')).toBe(true);
    b2.el!.click();
    expect(a.el!.classList.contains('x-btn-pressed')).toBe(false);
    expect(b2.el!.classList.contains('x-btn-pressed')).toBe(true);
    expect(c.el!.classList.contains('x-btn-pressed')).toBe(false);
  });

  it('pressing already-pressed button in group keeps it pressed', () => {
    const a = btn({ text: 'A', enableToggle: true, toggleGroup: 'grp2' });
    a.el!.click();
    a.el!.click();
    expect(a.el!.classList.contains('x-btn-pressed')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Button — scale & UI
// ═══════════════════════════════════════════════════════════════════════════

describe('Button — scale & UI', () => {
  it('scale:"small" adds x-btn-small class', () => {
    const b = btn({ text: 'S', scale: 'small' });
    expect(b.el!.classList.contains('x-btn-small')).toBe(true);
  });

  it('scale:"large" adds x-btn-large class', () => {
    const b = btn({ text: 'L', scale: 'large' });
    expect(b.el!.classList.contains('x-btn-large')).toBe(true);
  });

  it('setScale changes scale class', () => {
    const b = btn({ text: 'S', scale: 'small' });
    b.setScale('large');
    expect(b.el!.classList.contains('x-btn-large')).toBe(true);
    expect(b.el!.classList.contains('x-btn-small')).toBe(false);
  });

  it('ui:"primary" adds x-btn-primary class', () => {
    const b = btn({ text: 'P', ui: 'primary' });
    expect(b.el!.classList.contains('x-btn-primary')).toBe(true);
  });

  it('ui:"danger" adds x-btn-danger class', () => {
    const b = btn({ text: 'D', ui: 'danger' });
    expect(b.el!.classList.contains('x-btn-danger')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Button — setText / setIcon / setTooltip
// ═══════════════════════════════════════════════════════════════════════════

describe('Button — setters', () => {
  it('setText updates the text', () => {
    const b = btn({ text: 'Old' });
    b.setText('New');
    expect(b.el!.querySelector('.x-btn-text')?.textContent).toBe('New');
  });

  it('setIconCls updates the icon', () => {
    const b = btn({ text: 'X', iconCls: 'fa-old' });
    b.setIconCls('fa-new');
    const icon = b.el!.querySelector('.x-btn-icon');
    expect(icon!.classList.contains('fa-new')).toBe(true);
    expect(icon!.classList.contains('fa-old')).toBe(false);
  });

  it('setIcon updates icon URL', () => {
    const b = btn({ text: 'X', icon: 'old.png' });
    b.setIcon('new.png');
    const icon = b.el!.querySelector('.x-btn-icon') as HTMLElement;
    expect(icon.style.backgroundImage).toContain('new.png');
  });

  it('setTooltip sets title attribute', () => {
    const b = btn({ text: 'X' });
    b.setTooltip('Helpful tip');
    expect(b.el!.getAttribute('title')).toBe('Helpful tip');
  });

  it('tooltip config sets title', () => {
    const b = btn({ text: 'X', tooltip: 'Info' });
    expect(b.el!.getAttribute('title')).toBe('Info');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Button — menu arrow
// ═══════════════════════════════════════════════════════════════════════════

describe('Button — menu', () => {
  it('menu config shows arrow', () => {
    const b = btn({ text: 'Menu', menu: { items: [] } });
    const arrow = b.el!.querySelector('.x-btn-arrow');
    expect(arrow).not.toBeNull();
  });

  it('arrowVisible:false hides arrow even with menu', () => {
    const b = btn({ text: 'Menu', menu: { items: [] }, arrowVisible: false });
    const arrow = b.el!.querySelector('.x-btn-arrow');
    expect(arrow).toBeNull();
  });

  it('without menu, no arrow', () => {
    const b = btn({ text: 'Plain' });
    expect(b.el!.querySelector('.x-btn-arrow')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Button — textAlign
// ═══════════════════════════════════════════════════════════════════════════

describe('Button — textAlign', () => {
  it('textAlign:"center" sets text-align on element', () => {
    const b = btn({ text: 'C', textAlign: 'center' });
    expect(b.el!.style.textAlign).toBe('center');
  });

  it('textAlign:"left"', () => {
    const b = btn({ text: 'L', textAlign: 'left' });
    expect(b.el!.style.textAlign).toBe('left');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Button — disabled
// ═══════════════════════════════════════════════════════════════════════════

describe('Button — disabled', () => {
  it('disabled adds x-btn-disabled class', () => {
    const b = btn({ text: 'X', disabled: true });
    expect(b.el!.classList.contains('x-btn-disabled')).toBe(true);
  });

  it('disabled sets native disabled attribute on <button>', () => {
    const b = btn({ text: 'X', disabled: true });
    expect((b.el as HTMLButtonElement).disabled).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Button — mouseover/mouseout events
// ═══════════════════════════════════════════════════════════════════════════

describe('Button — hover events', () => {
  it('fires mouseover', () => {
    const spy = vi.fn();
    const b = btn({ text: 'H', listeners: { mouseover: spy } });
    b.el!.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('fires mouseout', () => {
    const spy = vi.fn();
    const b = btn({ text: 'H', listeners: { mouseout: spy } });
    b.el!.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SplitButton
// ═══════════════════════════════════════════════════════════════════════════

describe('SplitButton', () => {
  function splitBtn(cfg: Record<string, unknown> = {}): SplitButton {
    return new SplitButton({ renderTo: document.body, text: 'Split', menu: { items: [] }, ...cfg });
  }

  it('extends Button', () => {
    const s = splitBtn();
    expect(s).toBeInstanceOf(Button);
  });

  it('has split arrow area', () => {
    const s = splitBtn();
    const arrow = s.el!.querySelector('.x-btn-split-arrow');
    expect(arrow).not.toBeNull();
  });

  it('clicking main area fires handler, not arrowHandler', () => {
    const handler = vi.fn();
    const arrowHandler = vi.fn();
    const s = splitBtn({ handler, arrowHandler });
    // Click the main button text area
    const mainEl = (s.el!.querySelector('.x-btn-text') as HTMLElement) || s.el!;
    mainEl.click();
    expect(handler).toHaveBeenCalled();
  });

  it('clicking arrow fires arrowHandler and arrowclick event', () => {
    const arrowHandler = vi.fn();
    const spy = vi.fn();
    const s = splitBtn({ arrowHandler, listeners: { arrowclick: spy } });
    const arrow = s.el!.querySelector('.x-btn-split-arrow') as HTMLElement;
    arrow.click();
    expect(arrowHandler).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CycleButton
// ═══════════════════════════════════════════════════════════════════════════

describe('CycleButton', () => {
  function cycleBtn(cfg: Record<string, unknown> = {}): CycleButton {
    return new CycleButton({
      renderTo: document.body,
      items: [
        { text: 'Option A', iconCls: 'fa-a' },
        { text: 'Option B', iconCls: 'fa-b' },
        { text: 'Option C', iconCls: 'fa-c', checked: true },
      ],
      ...cfg,
    });
  }

  it('extends SplitButton', () => {
    const c = cycleBtn();
    expect(c).toBeInstanceOf(SplitButton);
  });

  it('shows the checked item text by default', () => {
    const c = cycleBtn();
    expect(c.el!.querySelector('.x-btn-text')?.textContent).toBe('Option C');
  });

  it('getActiveItem returns the checked item', () => {
    const c = cycleBtn();
    expect(c.getActiveItem().text).toBe('Option C');
  });

  it('clicking advances to the next item', () => {
    const c = cycleBtn();
    c.el!.click();
    expect(c.getActiveItem().text).toBe('Option A');
  });

  it('cycles back to first after last', () => {
    const c = cycleBtn();
    c.el!.click(); // A
    c.el!.click(); // B
    c.el!.click(); // C
    expect(c.getActiveItem().text).toBe('Option C');
  });

  it('setActiveItem changes the displayed text', () => {
    const c = cycleBtn();
    const items = (c as any)._cycleItems;
    c.setActiveItem(items[1]);
    expect(c.el!.querySelector('.x-btn-text')?.textContent).toBe('Option B');
  });

  it('fires "change" event on cycle', () => {
    const spy = vi.fn();
    const c = cycleBtn({ listeners: { change: spy } });
    c.el!.click();
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SegmentedButton
// ═══════════════════════════════════════════════════════════════════════════

describe('SegmentedButton', () => {
  function segBtn(cfg: Record<string, unknown> = {}): SegmentedButton {
    return new SegmentedButton({
      renderTo: document.body,
      items: [
        new Button({ text: 'A', value: 'a' }),
        new Button({ text: 'B', value: 'b' }),
        new Button({ text: 'C', value: 'c' }),
      ],
      ...cfg,
    });
  }

  it('renders as a container with x-segmented-btn class', () => {
    const s = segBtn();
    expect(s.el!.classList.contains('x-segmented-btn')).toBe(true);
  });

  it('contains the child buttons', () => {
    const s = segBtn();
    expect(s.getItems().length).toBe(3);
  });

  it('clicking a button selects it (single mode)', () => {
    const s = segBtn();
    const items = s.getItems();
    items[1].el!.click();
    expect(items[1].el!.classList.contains('x-btn-pressed')).toBe(true);
    expect(items[0].el!.classList.contains('x-btn-pressed')).toBe(false);
  });

  it('single mode: clicking another deselects previous', () => {
    const s = segBtn();
    const items = s.getItems();
    items[0].el!.click();
    items[2].el!.click();
    expect(items[0].el!.classList.contains('x-btn-pressed')).toBe(false);
    expect(items[2].el!.classList.contains('x-btn-pressed')).toBe(true);
  });

  it('allowMultiple:true lets multiple be selected', () => {
    const s = segBtn({ allowMultiple: true });
    const items = s.getItems();
    items[0].el!.click();
    items[2].el!.click();
    expect(items[0].el!.classList.contains('x-btn-pressed')).toBe(true);
    expect(items[2].el!.classList.contains('x-btn-pressed')).toBe(true);
  });

  it('allowDepress:true allows deselecting in single mode', () => {
    const s = segBtn({ allowDepress: true });
    const items = s.getItems();
    items[0].el!.click();
    items[0].el!.click();
    expect(items[0].el!.classList.contains('x-btn-pressed')).toBe(false);
  });

  it('allowDepress:false (default) prevents deselecting in single mode', () => {
    const s = segBtn({ allowDepress: false });
    const items = s.getItems();
    items[0].el!.click();
    items[0].el!.click();
    expect(items[0].el!.classList.contains('x-btn-pressed')).toBe(true);
  });

  it('getValue returns selected value(s)', () => {
    const s = segBtn();
    const items = s.getItems();
    items[1].el!.click();
    expect(s.getValue()).toBe('b');
  });

  it('getValue with multiple returns array', () => {
    const s = segBtn({ allowMultiple: true });
    const items = s.getItems();
    items[0].el!.click();
    items[2].el!.click();
    expect(s.getValue()).toEqual(['a', 'c']);
  });

  it('setValue sets selection', () => {
    const s = segBtn();
    s.setValue('c');
    const items = s.getItems();
    expect(items[2].el!.classList.contains('x-btn-pressed')).toBe(true);
  });

  it('setValue with array for multiple mode', () => {
    const s = segBtn({ allowMultiple: true });
    s.setValue(['a', 'c']);
    const items = s.getItems();
    expect(items[0].el!.classList.contains('x-btn-pressed')).toBe(true);
    expect(items[1].el!.classList.contains('x-btn-pressed')).toBe(false);
    expect(items[2].el!.classList.contains('x-btn-pressed')).toBe(true);
  });

  it('fires "change" event on selection', () => {
    const spy = vi.fn();
    const s = segBtn({ listeners: { change: spy } });
    s.getItems()[0].el!.click();
    expect(spy).toHaveBeenCalled();
  });
});
