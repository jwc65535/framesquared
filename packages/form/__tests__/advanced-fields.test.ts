/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Slider } from '../src/field/Slider.js';
import { FileField } from '../src/field/FileUpload.js';
import { HtmlEditor } from '../src/field/HtmlEditor.js';
import { Spinner } from '../src/field/Spinner.js';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = MockRO;
  // jsdom doesn't have PointerEvent — polyfill it as MouseEvent subclass
  if (typeof PointerEvent === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
      constructor(type: string, init?: MouseEventInit) {
        super(type, init);
      }
    };
  }
});
afterEach(() => {
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// Slider — basics
// ═══════════════════════════════════════════════════════════════════════════

describe('Slider — basics', () => {
  function slider(cfg: Record<string, unknown> = {}): Slider {
    return new Slider({ renderTo: document.body, minValue: 0, maxValue: 100, ...cfg });
  }

  it('renders with x-slider class', () => {
    const s = slider();
    expect(s.el!.classList.contains('x-slider')).toBe(true);
  });

  it('has track and thumb elements', () => {
    const s = slider();
    expect(s.el!.querySelector('.x-slider-track')).not.toBeNull();
    expect(s.el!.querySelector('.x-slider-thumb')).not.toBeNull();
  });

  it('getValue returns current value', () => {
    const s = slider({ value: 50 });
    expect(s.getValue()).toBe(50);
  });

  it('setValue updates value and thumb position', () => {
    const s = slider({ value: 0 });
    s.setValue(75);
    expect(s.getValue()).toBe(75);
  });

  it('clamps value to min', () => {
    const s = slider({ minValue: 10 });
    s.setValue(-5);
    expect(s.getValue()).toBe(10);
  });

  it('clamps value to max', () => {
    const s = slider({ maxValue: 100 });
    s.setValue(150);
    expect(s.getValue()).toBe(100);
  });

  it('increment snaps value', () => {
    const s = slider({ increment: 10 });
    s.setValue(23);
    expect(s.getValue()).toBe(20);
  });

  it('increment snaps rounding up at midpoint', () => {
    const s = slider({ increment: 10 });
    s.setValue(25);
    expect(s.getValue()).toBe(30);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Slider — ARIA
// ═══════════════════════════════════════════════════════════════════════════

describe('Slider — ARIA', () => {
  function slider(cfg: Record<string, unknown> = {}): Slider {
    return new Slider({ renderTo: document.body, minValue: 0, maxValue: 100, ...cfg });
  }

  it('thumb has role="slider"', () => {
    const s = slider();
    const thumb = s.el!.querySelector('.x-slider-thumb');
    expect(thumb!.getAttribute('role')).toBe('slider');
  });

  it('aria-valuemin is set', () => {
    const s = slider({ minValue: 5 });
    const thumb = s.el!.querySelector('.x-slider-thumb');
    expect(thumb!.getAttribute('aria-valuemin')).toBe('5');
  });

  it('aria-valuemax is set', () => {
    const s = slider({ maxValue: 200 });
    const thumb = s.el!.querySelector('.x-slider-thumb');
    expect(thumb!.getAttribute('aria-valuemax')).toBe('200');
  });

  it('aria-valuenow updates on setValue', () => {
    const s = slider({ value: 30 });
    const thumb = s.el!.querySelector('.x-slider-thumb');
    expect(thumb!.getAttribute('aria-valuenow')).toBe('30');
    s.setValue(60);
    expect(thumb!.getAttribute('aria-valuenow')).toBe('60');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Slider — drag
// ═══════════════════════════════════════════════════════════════════════════

describe('Slider — drag', () => {
  function slider(cfg: Record<string, unknown> = {}): Slider {
    return new Slider({ renderTo: document.body, minValue: 0, maxValue: 100, ...cfg });
  }

  it('fires dragstart on pointerdown', () => {
    const spy = vi.fn();
    const s = slider({ listeners: { dragstart: spy } });
    const thumb = s.el!.querySelector('.x-slider-thumb') as HTMLElement;
    thumb.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, bubbles: true }));
    expect(spy).toHaveBeenCalled();
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  });

  it('fires dragend on pointerup', () => {
    const spy = vi.fn();
    const s = slider({ listeners: { dragend: spy } });
    const thumb = s.el!.querySelector('.x-slider-thumb') as HTMLElement;
    thumb.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('fires changecomplete on pointerup', () => {
    const spy = vi.fn();
    const s = slider({ listeners: { changecomplete: spy } });
    const thumb = s.el!.querySelector('.x-slider-thumb') as HTMLElement;
    thumb.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Slider — multi-thumb
// ═══════════════════════════════════════════════════════════════════════════

describe('Slider — multi-thumb', () => {
  it('renders multiple thumbs', () => {
    const s = new Slider({
      renderTo: document.body,
      minValue: 0,
      maxValue: 100,
      values: [20, 50, 80],
    });
    const thumbs = s.el!.querySelectorAll('.x-slider-thumb');
    expect(thumbs.length).toBe(3);
  });

  it('getValues returns all thumb values', () => {
    const s = new Slider({
      renderTo: document.body,
      minValue: 0,
      maxValue: 100,
      values: [10, 50, 90],
    });
    expect(s.getValues()).toEqual([10, 50, 90]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Slider — vertical
// ═══════════════════════════════════════════════════════════════════════════

describe('Slider — vertical', () => {
  it('vertical:true adds x-slider-vertical class', () => {
    const s = new Slider({
      renderTo: document.body,
      minValue: 0,
      maxValue: 100,
      vertical: true,
    });
    expect(s.el!.classList.contains('x-slider-vertical')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Slider — setters
// ═══════════════════════════════════════════════════════════════════════════

describe('Slider — setters', () => {
  function slider(cfg: Record<string, unknown> = {}): Slider {
    return new Slider({ renderTo: document.body, minValue: 0, maxValue: 100, ...cfg });
  }

  it('setMinValue updates minimum', () => {
    const s = slider({ value: 5 });
    s.setMinValue(10);
    expect(s.getValue()).toBe(10); // re-clamped
  });

  it('setMaxValue updates maximum', () => {
    const s = slider({ value: 90 });
    s.setMaxValue(80);
    expect(s.getValue()).toBe(80); // re-clamped
  });

  it('setIncrement changes snap', () => {
    const s = slider({ value: 50 });
    s.setIncrement(25);
    s.setValue(37);
    expect(s.getValue()).toBe(25);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FileField
// ═══════════════════════════════════════════════════════════════════════════

describe('FileField', () => {
  function fileField(cfg: Record<string, unknown> = {}): FileField {
    return new FileField({ renderTo: document.body, ...cfg });
  }

  it('renders with x-filefield class', () => {
    const f = fileField();
    expect(f.el!.classList.contains('x-filefield')).toBe(true);
  });

  it('has a hidden file input', () => {
    const f = fileField();
    const input = f.el!.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
  });

  it('has a browse button', () => {
    const f = fileField();
    const btn = f.el!.querySelector('.x-filefield-btn');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain('Browse');
  });

  it('custom buttonText', () => {
    const f = fileField({ buttonText: 'Choose File' });
    expect(f.el!.querySelector('.x-filefield-btn')!.textContent).toContain('Choose File');
  });

  it('accept sets accept attribute', () => {
    const f = fileField({ accept: 'image/*' });
    const input = f.el!.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe('image/*');
  });

  it('multiple allows multiple files', () => {
    const f = fileField({ multiple: true });
    const input = f.el!.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.multiple).toBe(true);
  });

  it('buttonOnly hides the text display', () => {
    const f = fileField({ buttonOnly: true });
    const textEl = f.el!.querySelector('.x-filefield-text') as HTMLElement;
    expect(textEl?.style.display).toBe('none');
  });

  it('fires change event on file selection', () => {
    const spy = vi.fn();
    const f = fileField({ listeners: { change: spy } });
    const input = f.el!.querySelector('input[type="file"]') as HTMLInputElement;
    // Simulate file selection
    Object.defineProperty(input, 'files', { value: [new File([''], 'test.txt')] });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HtmlEditor
// ═══════════════════════════════════════════════════════════════════════════

describe('HtmlEditor', () => {
  function htmlEditor(cfg: Record<string, unknown> = {}): HtmlEditor {
    return new HtmlEditor({ renderTo: document.body, ...cfg });
  }

  it('renders with x-htmleditor class', () => {
    const e = htmlEditor();
    expect(e.el!.classList.contains('x-htmleditor')).toBe(true);
  });

  it('has a toolbar', () => {
    const e = htmlEditor();
    expect(e.el!.querySelector('.x-htmleditor-toolbar')).not.toBeNull();
  });

  it('has a contenteditable area', () => {
    const e = htmlEditor();
    const editor = e.el!.querySelector('.x-htmleditor-body');
    expect(editor).not.toBeNull();
    expect((editor as HTMLElement).contentEditable).toBe('true');
  });

  it('getValue returns HTML content', () => {
    const e = htmlEditor({ value: '<p>Hello</p>' });
    expect(e.getValue()).toContain('Hello');
  });

  it('setValue updates the editor content', () => {
    const e = htmlEditor();
    e.setValue('<b>Bold</b>');
    const editor = e.el!.querySelector('.x-htmleditor-body') as HTMLElement;
    expect(editor.innerHTML).toContain('<b>Bold</b>');
  });

  it('toolbar has bold button', () => {
    const e = htmlEditor();
    expect(e.el!.querySelector('.x-htmleditor-btn-bold')).not.toBeNull();
  });

  it('toolbar has italic button', () => {
    const e = htmlEditor();
    expect(e.el!.querySelector('.x-htmleditor-btn-italic')).not.toBeNull();
  });

  it('toolbar has underline button', () => {
    const e = htmlEditor();
    expect(e.el!.querySelector('.x-htmleditor-btn-underline')).not.toBeNull();
  });

  it('source edit mode toggles', () => {
    const e = htmlEditor();
    const srcBtn = e.el!.querySelector('.x-htmleditor-btn-source') as HTMLElement;
    srcBtn.click();
    expect(e.isSourceEdit()).toBe(true);
    srcBtn.click();
    expect(e.isSourceEdit()).toBe(false);
  });

  it('sanitizes XSS in getValue', () => {
    const e = htmlEditor();
    e.setValue('<script>alert("xss")</script><p>Safe</p>');
    const html = e.getValue();
    expect(html).not.toContain('<script');
    expect(html).toContain('Safe');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Spinner
// ═══════════════════════════════════════════════════════════════════════════

describe('Spinner', () => {
  // Concrete test subclass
  class TestSpinner extends Spinner {
    step = 1;
    protected onSpinUp(): void {
      const val = Number(this.getValue()) || 0;
      this.setValue(val + this.step);
    }
    protected onSpinDown(): void {
      const val = Number(this.getValue()) || 0;
      this.setValue(val - this.step);
    }
  }

  function spinner(cfg: Record<string, unknown> = {}): TestSpinner {
    return new TestSpinner({ renderTo: document.body, ...cfg });
  }

  it('has spinner up/down triggers', () => {
    const s = spinner();
    expect(s.el!.querySelector('.x-trigger-spinner-up')).not.toBeNull();
    expect(s.el!.querySelector('.x-trigger-spinner-down')).not.toBeNull();
  });

  it('spinUp calls onSpinUp', () => {
    const s = spinner({ value: '5' });
    s.spinUp();
    expect(s.getValue()).toBe('6');
  });

  it('spinDown calls onSpinDown', () => {
    const s = spinner({ value: '5' });
    s.spinDown();
    expect(s.getValue()).toBe('4');
  });

  it('clicking up trigger increments', () => {
    const s = spinner({ value: '0' });
    const up = s.el!.querySelector('.x-trigger-spinner-up') as HTMLElement;
    up.click();
    expect(s.getValue()).toBe('1');
  });

  it('clicking down trigger decrements', () => {
    const s = spinner({ value: '10' });
    const down = s.el!.querySelector('.x-trigger-spinner-down') as HTMLElement;
    down.click();
    expect(s.getValue()).toBe('9');
  });

  it('keyboard ArrowUp calls spinUp', () => {
    const s = spinner({ value: '0' });
    s.getInputEl().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(s.getValue()).toBe('1');
  });

  it('keyboard ArrowDown calls spinDown', () => {
    const s = spinner({ value: '5' });
    s.getInputEl().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(s.getValue()).toBe('4');
  });

  it('fires "spin" event', () => {
    const spy = vi.fn();
    const s = spinner({ value: '0', listeners: { spin: spy } });
    s.spinUp();
    expect(spy).toHaveBeenCalled();
  });
});
