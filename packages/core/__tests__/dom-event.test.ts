import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventManager } from '../src/event/DomEvent.js';
import { GestureRecognizer } from '../src/event/GestureRecognizer.js';
import { KeyMap } from '../src/event/KeyMap.js';

// ---------------------------------------------------------------------------
// PointerEvent polyfill for jsdom (which only has MouseEvent)
// ---------------------------------------------------------------------------
function ensurePointerEvent() {
  if (typeof globalThis.PointerEvent === 'undefined') {
    (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
      readonly pointerId: number;
      readonly pointerType: string;
      readonly isPrimary: boolean;
      readonly width: number;
      readonly height: number;
      readonly pressure: number;
      readonly tiltX: number;
      readonly tiltY: number;

      constructor(type: string, init: PointerEventInit & Record<string, unknown> = {}) {
        super(type, init);
        this.pointerId = (init.pointerId as number) ?? 0;
        this.pointerType = (init.pointerType as string) ?? 'mouse';
        this.isPrimary = (init.isPrimary as boolean) ?? true;
        this.width = (init.width as number) ?? 1;
        this.height = (init.height as number) ?? 1;
        this.pressure = (init.pressure as number) ?? 0;
        this.tiltX = (init.tiltX as number) ?? 0;
        this.tiltY = (init.tiltY as number) ?? 0;
      }
    };
  }
}

ensurePointerEvent();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDiv(id = 'test-div'): HTMLDivElement {
  const el = document.createElement('div');
  el.id = id;
  document.body.appendChild(el);
  return el;
}

function firePointer(el: Element, type: string, init: Record<string, unknown> = {}): void {
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: 0,
      clientY: 0,
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      ...init,
    } as PointerEventInit),
  );
}

function fireKey(el: Element, type: string, init: KeyboardEventInit = {}): void {
  el.dispatchEvent(
    new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EventManager — on / un
// ═══════════════════════════════════════════════════════════════════════════

describe('EventManager', () => {
  let div: HTMLDivElement;

  beforeEach(() => {
    div = createDiv();
  });
  afterEach(() => {
    EventManager.removeAll();
    div.remove();
  });

  describe('on / un', () => {
    it('registers and fires a DOM event handler', () => {
      const spy = vi.fn();
      EventManager.on(div, 'click', spy);
      div.click();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('un removes the handler', () => {
      const spy = vi.fn();
      EventManager.on(div, 'click', spy);
      EventManager.un(div, 'click', spy);
      div.click();
      expect(spy).not.toHaveBeenCalled();
    });

    it('on returns a Destroyable', () => {
      const spy = vi.fn();
      const handle = EventManager.on(div, 'click', spy);
      expect(typeof handle.destroy).toBe('function');
      handle.destroy();
      div.click();
      expect(spy).not.toHaveBeenCalled();
    });

    it('passes AddEventListenerOptions through', () => {
      const spy = vi.fn();
      EventManager.on(div, 'click', spy, { once: true });
      div.click();
      div.click();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('handler receives the native Event object', () => {
      let received: Event | null = null;
      EventManager.on(div, 'click', (e) => {
        received = e;
      });
      div.click();
      expect(received).toBeInstanceOf(Event);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // delegate
  // ═══════════════════════════════════════════════════════════════════════

  describe('delegate', () => {
    it('fires handler when a child matching the selector is clicked', () => {
      const spy = vi.fn();
      const child = document.createElement('button');
      child.classList.add('btn');
      div.appendChild(child);

      EventManager.delegate(div, 'click', '.btn', spy);
      child.click();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('passes the matched element as second argument', () => {
      let matched: Element | null = null;
      const child = document.createElement('span');
      child.classList.add('target');
      div.appendChild(child);

      EventManager.delegate(div, 'click', '.target', (_e, target) => {
        matched = target;
      });
      child.click();
      expect(matched).toBe(child);
    });

    it('does NOT fire for non-matching children', () => {
      const spy = vi.fn();
      const child = document.createElement('span');
      child.classList.add('other');
      div.appendChild(child);

      EventManager.delegate(div, 'click', '.btn', spy);
      child.click();
      expect(spy).not.toHaveBeenCalled();
    });

    it('matches on deeply nested elements (bubbles up to selector)', () => {
      const spy = vi.fn();
      const item = document.createElement('div');
      item.classList.add('item');
      const inner = document.createElement('span');
      item.appendChild(inner);
      div.appendChild(item);

      EventManager.delegate(div, 'click', '.item', spy);
      inner.click();
      expect(spy).toHaveBeenCalledOnce();
    });

    it('returns a Destroyable that removes the delegation', () => {
      const spy = vi.fn();
      const child = document.createElement('button');
      child.classList.add('btn');
      div.appendChild(child);

      const handle = EventManager.delegate(div, 'click', '.btn', spy);
      handle.destroy();
      child.click();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Utility methods
  // ═══════════════════════════════════════════════════════════════════════

  describe('utility methods', () => {
    it('stopEvent prevents default and stops propagation', () => {
      const event = new Event('click', { bubbles: true, cancelable: true });
      const pdSpy = vi.spyOn(event, 'preventDefault');
      const spSpy = vi.spyOn(event, 'stopPropagation');
      EventManager.stopEvent(event);
      expect(pdSpy).toHaveBeenCalled();
      expect(spSpy).toHaveBeenCalled();
    });

    it('getPageX / getPageY return coordinates', () => {
      const event = new MouseEvent('click', { clientX: 100, clientY: 200 });
      expect(EventManager.getPageX(event)).toBe(100);
      expect(EventManager.getPageY(event)).toBe(200);
    });

    it('getKeyCode returns e.key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      expect(EventManager.getKeyCode(event)).toBe('Enter');
    });

    it('getRelatedTarget returns relatedTarget', () => {
      const related = document.createElement('div');
      const event = new MouseEvent('mouseout', { relatedTarget: related });
      expect(EventManager.getRelatedTarget(event)).toBe(related);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // onReady
  // ═══════════════════════════════════════════════════════════════════════

  describe('onReady', () => {
    it('calls the function (in jsdom, document is already interactive)', () => {
      const spy = vi.fn();
      EventManager.onReady(spy);
      // In jsdom with vitest, readyState is typically 'complete'
      // by the time tests run, so it fires synchronously or microtask
      expect(spy).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // removeAll (bulk cleanup)
  // ═══════════════════════════════════════════════════════════════════════

  describe('removeAll', () => {
    it('removes all tracked listeners', () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const div2 = createDiv('test-div2');
      EventManager.on(div, 'click', spy1);
      EventManager.on(div2, 'click', spy2);
      EventManager.removeAll();
      div.click();
      div2.click();
      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
      div2.remove();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GestureRecognizer
// ═══════════════════════════════════════════════════════════════════════════

describe('GestureRecognizer', () => {
  let div: HTMLDivElement;
  let recognizer: InstanceType<typeof GestureRecognizer>;

  beforeEach(() => {
    vi.useFakeTimers();
    div = createDiv('gesture-target');
    recognizer = new GestureRecognizer(div);
  });

  afterEach(() => {
    recognizer.destroy();
    div.remove();
    vi.useRealTimers();
  });

  describe('tap', () => {
    it('fires a "tap" event on quick pointer down+up', () => {
      const spy = vi.fn();
      div.addEventListener('tap', spy);
      firePointer(div, 'pointerdown', { clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(50);
      firePointer(div, 'pointerup', { clientX: 10, clientY: 10 });
      expect(spy).toHaveBeenCalledOnce();
    });

    it('does NOT fire tap if pointer moved too far', () => {
      const spy = vi.fn();
      div.addEventListener('tap', spy);
      firePointer(div, 'pointerdown', { clientX: 10, clientY: 10 });
      firePointer(div, 'pointermove', { clientX: 100, clientY: 100 });
      firePointer(div, 'pointerup', { clientX: 100, clientY: 100 });
      expect(spy).not.toHaveBeenCalled();
    });

    it('does NOT fire tap if held too long (becomes longpress)', () => {
      const spy = vi.fn();
      div.addEventListener('tap', spy);
      firePointer(div, 'pointerdown', { clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(600); // past longpress threshold
      firePointer(div, 'pointerup', { clientX: 10, clientY: 10 });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('doubletap', () => {
    it('fires "doubletap" on two quick taps', () => {
      const spy = vi.fn();
      div.addEventListener('doubletap', spy);

      // First tap
      firePointer(div, 'pointerdown', { clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(30);
      firePointer(div, 'pointerup', { clientX: 10, clientY: 10 });

      vi.advanceTimersByTime(100);

      // Second tap
      firePointer(div, 'pointerdown', { clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(30);
      firePointer(div, 'pointerup', { clientX: 10, clientY: 10 });

      expect(spy).toHaveBeenCalledOnce();
    });

    it('does NOT fire doubletap if taps are too far apart in time', () => {
      const spy = vi.fn();
      div.addEventListener('doubletap', spy);

      firePointer(div, 'pointerdown', { clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(30);
      firePointer(div, 'pointerup', { clientX: 10, clientY: 10 });

      vi.advanceTimersByTime(500); // too slow

      firePointer(div, 'pointerdown', { clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(30);
      firePointer(div, 'pointerup', { clientX: 10, clientY: 10 });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('longpress', () => {
    it('fires "longpress" when pointer is held for 500ms+', () => {
      const spy = vi.fn();
      div.addEventListener('longpress', spy);
      firePointer(div, 'pointerdown', { clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(500);
      expect(spy).toHaveBeenCalledOnce();
    });

    it('does NOT fire longpress if pointer moves too much', () => {
      const spy = vi.fn();
      div.addEventListener('longpress', spy);
      firePointer(div, 'pointerdown', { clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(200);
      firePointer(div, 'pointermove', { clientX: 100, clientY: 100 });
      vi.advanceTimersByTime(400);
      expect(spy).not.toHaveBeenCalled();
    });

    it('does NOT fire longpress if pointer is released early', () => {
      const spy = vi.fn();
      div.addEventListener('longpress', spy);
      firePointer(div, 'pointerdown', { clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(200);
      firePointer(div, 'pointerup', { clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(400);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('swipe', () => {
    it('fires "swipe" with direction "right"', () => {
      let detail: any = null;
      div.addEventListener('swipe', ((e: CustomEvent) => {
        detail = e.detail;
      }) as EventListener);
      firePointer(div, 'pointerdown', { clientX: 10, clientY: 50 });
      vi.advanceTimersByTime(50);
      firePointer(div, 'pointermove', { clientX: 200, clientY: 55 });
      firePointer(div, 'pointerup', { clientX: 200, clientY: 55 });
      expect(detail).toBeDefined();
      expect(detail.direction).toBe('right');
    });

    it('fires "swipe" with direction "left"', () => {
      let detail: any = null;
      div.addEventListener('swipe', ((e: CustomEvent) => {
        detail = e.detail;
      }) as EventListener);
      firePointer(div, 'pointerdown', { clientX: 200, clientY: 50 });
      vi.advanceTimersByTime(50);
      firePointer(div, 'pointermove', { clientX: 10, clientY: 55 });
      firePointer(div, 'pointerup', { clientX: 10, clientY: 55 });
      expect(detail.direction).toBe('left');
    });

    it('fires "swipe" with direction "down"', () => {
      let detail: any = null;
      div.addEventListener('swipe', ((e: CustomEvent) => {
        detail = e.detail;
      }) as EventListener);
      firePointer(div, 'pointerdown', { clientX: 50, clientY: 10 });
      vi.advanceTimersByTime(50);
      firePointer(div, 'pointermove', { clientX: 55, clientY: 200 });
      firePointer(div, 'pointerup', { clientX: 55, clientY: 200 });
      expect(detail.direction).toBe('down');
    });

    it('fires "swipe" with direction "up"', () => {
      let detail: any = null;
      div.addEventListener('swipe', ((e: CustomEvent) => {
        detail = e.detail;
      }) as EventListener);
      firePointer(div, 'pointerdown', { clientX: 50, clientY: 200 });
      vi.advanceTimersByTime(50);
      firePointer(div, 'pointermove', { clientX: 55, clientY: 10 });
      firePointer(div, 'pointerup', { clientX: 55, clientY: 10 });
      expect(detail.direction).toBe('up');
    });

    it('does NOT fire swipe for small movements', () => {
      const spy = vi.fn();
      div.addEventListener('swipe', spy);
      firePointer(div, 'pointerdown', { clientX: 50, clientY: 50 });
      vi.advanceTimersByTime(50);
      firePointer(div, 'pointermove', { clientX: 55, clientY: 52 });
      firePointer(div, 'pointerup', { clientX: 55, clientY: 52 });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('pinch', () => {
    it('fires "pinch" with scale factor on two-pointer gesture', () => {
      let detail: any = null;
      div.addEventListener('pinch', ((e: CustomEvent) => {
        detail = e.detail;
      }) as EventListener);

      // Pointer 1 down
      firePointer(div, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 100 });
      // Pointer 2 down
      firePointer(div, 'pointerdown', { pointerId: 2, clientX: 200, clientY: 100 });

      // Move apart (zoom in)
      firePointer(div, 'pointermove', { pointerId: 1, clientX: 50, clientY: 100 });
      firePointer(div, 'pointermove', { pointerId: 2, clientX: 250, clientY: 100 });

      expect(detail).toBeDefined();
      expect(detail.scale).toBeGreaterThan(1);
    });
  });

  describe('rotate', () => {
    it('fires "rotate" with angle delta on two-pointer rotation', () => {
      let detail: any = null;
      div.addEventListener('rotate', ((e: CustomEvent) => {
        detail = e.detail;
      }) as EventListener);

      // Two pointers horizontal: (100,100) and (200,100) → angle = 0
      firePointer(div, 'pointerdown', { pointerId: 1, clientX: 100, clientY: 100 });
      firePointer(div, 'pointerdown', { pointerId: 2, clientX: 200, clientY: 100 });

      // Rotate: pointer 2 moves to (150,200) → angle changes
      firePointer(div, 'pointermove', { pointerId: 2, clientX: 150, clientY: 200 });

      expect(detail).toBeDefined();
      expect(typeof detail.angle).toBe('number');
      expect(detail.angle).not.toBe(0);
    });
  });

  describe('destroy', () => {
    it('stops recognizing gestures after destroy', () => {
      const spy = vi.fn();
      div.addEventListener('tap', spy);
      recognizer.destroy();

      firePointer(div, 'pointerdown', { clientX: 10, clientY: 10 });
      vi.advanceTimersByTime(50);
      firePointer(div, 'pointerup', { clientX: 10, clientY: 10 });
      expect(spy).not.toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// KeyMap
// ═══════════════════════════════════════════════════════════════════════════

describe('KeyMap', () => {
  let div: HTMLDivElement;

  beforeEach(() => {
    div = createDiv('keymap-target');
  });
  afterEach(() => {
    div.remove();
  });

  describe('basic binding', () => {
    it('fires handler when matching key is pressed', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Enter', handler: spy }],
      });
      fireKey(div, 'keydown', { key: 'Enter' });
      expect(spy).toHaveBeenCalledOnce();
      km.destroy();
    });

    it('does NOT fire for non-matching keys', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Enter', handler: spy }],
      });
      fireKey(div, 'keydown', { key: 'Escape' });
      expect(spy).not.toHaveBeenCalled();
      km.destroy();
    });

    it('passes the KeyboardEvent to the handler', () => {
      let received: KeyboardEvent | null = null;
      const km = new KeyMap({
        target: div,
        bindings: [
          {
            key: 'a',
            handler: (e: KeyboardEvent) => {
              received = e;
            },
          },
        ],
      });
      fireKey(div, 'keydown', { key: 'a' });
      expect(received).toBeInstanceOf(KeyboardEvent);
      km.destroy();
    });
  });

  describe('modifier keys', () => {
    it('matches Ctrl+S', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Ctrl+s', handler: spy }],
      });
      fireKey(div, 'keydown', { key: 's', ctrlKey: true });
      expect(spy).toHaveBeenCalledOnce();
      km.destroy();
    });

    it('does NOT match Ctrl+S without Ctrl held', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Ctrl+s', handler: spy }],
      });
      fireKey(div, 'keydown', { key: 's' });
      expect(spy).not.toHaveBeenCalled();
      km.destroy();
    });

    it('matches Ctrl+Shift+Z', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Ctrl+Shift+z', handler: spy }],
      });
      fireKey(div, 'keydown', { key: 'z', ctrlKey: true, shiftKey: true });
      expect(spy).toHaveBeenCalledOnce();
      km.destroy();
    });

    it('matches Alt+Enter', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Alt+Enter', handler: spy }],
      });
      fireKey(div, 'keydown', { key: 'Enter', altKey: true });
      expect(spy).toHaveBeenCalledOnce();
      km.destroy();
    });

    it('matches Meta+K (Cmd on Mac)', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Meta+k', handler: spy }],
      });
      fireKey(div, 'keydown', { key: 'k', metaKey: true });
      expect(spy).toHaveBeenCalledOnce();
      km.destroy();
    });

    it('requires exact modifier match — extra modifiers are rejected', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Ctrl+s', handler: spy }],
      });
      fireKey(div, 'keydown', { key: 's', ctrlKey: true, shiftKey: true });
      expect(spy).not.toHaveBeenCalled();
      km.destroy();
    });
  });

  describe('preventDefault option', () => {
    it('calls preventDefault when configured', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Ctrl+s', handler: spy, preventDefault: true }],
      });
      let prevented = false;
      div.addEventListener('keydown', (e) => {
        if (e.defaultPrevented) prevented = true;
      });
      fireKey(div, 'keydown', { key: 's', ctrlKey: true });
      expect(spy).toHaveBeenCalled();
      expect(prevented).toBe(true);
      km.destroy();
    });
  });

  describe('scope binding', () => {
    it('calls handler with the provided scope', () => {
      const scope = { name: 'ctx' };
      const km = new KeyMap({
        target: div,
        bindings: [
          {
            key: 'Enter',
            handler: function (this: typeof scope) {
              expect(this).toBe(scope);
            },
            scope,
          },
        ],
      });
      fireKey(div, 'keydown', { key: 'Enter' });
      km.destroy();
    });
  });

  describe('enable / disable', () => {
    it('disable() stops processing key events', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Enter', handler: spy }],
      });
      km.disable();
      fireKey(div, 'keydown', { key: 'Enter' });
      expect(spy).not.toHaveBeenCalled();
      km.destroy();
    });

    it('enable() re-enables after disable()', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Enter', handler: spy }],
      });
      km.disable();
      km.enable();
      fireKey(div, 'keydown', { key: 'Enter' });
      expect(spy).toHaveBeenCalledOnce();
      km.destroy();
    });
  });

  describe('addBinding / removeBinding', () => {
    it('addBinding registers a new binding dynamically', () => {
      const spy = vi.fn();
      const km = new KeyMap({ target: div, bindings: [] });
      km.addBinding({ key: 'Escape', handler: spy });
      fireKey(div, 'keydown', { key: 'Escape' });
      expect(spy).toHaveBeenCalledOnce();
      km.destroy();
    });

    it('removeBinding removes an existing binding', () => {
      const spy = vi.fn();
      const binding = { key: 'Escape', handler: spy };
      const km = new KeyMap({ target: div, bindings: [binding] });
      km.removeBinding(binding);
      fireKey(div, 'keydown', { key: 'Escape' });
      expect(spy).not.toHaveBeenCalled();
      km.destroy();
    });
  });

  describe('destroy', () => {
    it('removes the keydown listener from the target', () => {
      const spy = vi.fn();
      const km = new KeyMap({
        target: div,
        bindings: [{ key: 'Enter', handler: spy }],
      });
      km.destroy();
      fireKey(div, 'keydown', { key: 'Enter' });
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
