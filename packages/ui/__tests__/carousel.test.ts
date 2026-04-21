/**
 * TDD suite for Carousel
 *
 * 19 tests covering: instantiation, DOM structure, active-item switching,
 * boundary/loop semantics, indicator pips, ResizeObserver lifecycle,
 * pointer-event cleanup, zero-duration animation, and event listener config.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { Panel } from '../src/panel/Panel.js';
import { Carousel } from '../src/carousel/Carousel.js';

// ── ResizeObserver mock ──────────────────────────────────────────────────────

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCards(n: number): Panel[] {
  return Array.from({ length: n }, (_, i) => new Panel({ title: `Card ${i + 1}` }));
}

let host: HTMLDivElement;

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockResizeObserver;
  host = document.createElement('div');
  document.body.appendChild(host);
});

afterEach(() => {
  host.remove();
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// 1. Instantiation
// ═══════════════════════════════════════════════════════════════════════════

describe('Carousel instantiation', () => {
  it('1. instantiates without error and el is defined after renderTo', () => {
    const c = new Carousel({ renderTo: host, items: makeCards(3) });
    expect(c).toBeTruthy();
    expect(c.el).not.toBeNull();
    expect(c.rendered).toBe(true);
  });

  it('2. renders .x-carousel class on the root element', () => {
    const c = new Carousel({ renderTo: host, items: makeCards(2) });
    expect(c.el!.classList.contains('x-carousel')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. DOM structure
// ═══════════════════════════════════════════════════════════════════════════

describe('Carousel DOM structure', () => {
  it('3. creates .x-carousel-track inside the body element', () => {
    const c = new Carousel({ renderTo: host, items: makeCards(3) });
    const track = c.getBodyEl().querySelector('.x-carousel-track');
    expect(track).not.toBeNull();
  });

  it('4. renders all child components inside the track', () => {
    const cards = makeCards(4);
    const c = new Carousel({ renderTo: host, items: cards });
    const track = c.getBodyEl().querySelector('.x-carousel-track')!;
    expect(track.children.length).toBe(4);
    for (const card of cards) {
      expect(track.contains(card.el!)).toBe(true);
    }
  });

  it('5. track transform is translateX(0%) for the initial active card', () => {
    const c = new Carousel({ renderTo: host, items: makeCards(4) });
    const track = c.getBodyEl().querySelector<HTMLElement>('.x-carousel-track')!;
    expect(track.style.transform).toBe('translateX(0%)');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Navigation
// ═══════════════════════════════════════════════════════════════════════════

describe('Carousel navigation', () => {
  it('6. next() advances getActiveIndex() by 1 and fires activeitemchange', () => {
    const c = new Carousel({ renderTo: host, items: makeCards(3) });
    const listener = vi.fn();
    (c as any).on('activeitemchange', listener);

    c.next();

    expect(c.getActiveIndex()).toBe(1);
    expect(listener).toHaveBeenCalledOnce();
    const [, newItem, , newIndex] = listener.mock.calls[0];
    expect(newIndex).toBe(1);
    expect(newItem).toBe(c.getActiveItem());
  });

  it('7. prev() decrements getActiveIndex() by 1', () => {
    const c = new Carousel({ renderTo: host, activeItem: 2, items: makeCards(4) });
    c.prev();
    expect(c.getActiveIndex()).toBe(1);
  });

  it('8. next() at last card is a no-op when loop: false', () => {
    const cards = makeCards(3);
    const c = new Carousel({ renderTo: host, activeItem: 2, loop: false, items: cards });
    c.next();
    expect(c.getActiveIndex()).toBe(2);
  });

  it('9. next() at last card wraps to index 0 when loop: true', () => {
    const c = new Carousel({ renderTo: host, activeItem: 2, loop: true, items: makeCards(3) });
    c.next();
    expect(c.getActiveIndex()).toBe(0);
  });

  it('10. prev() at first card is a no-op when loop: false', () => {
    const c = new Carousel({ renderTo: host, activeItem: 0, loop: false, items: makeCards(3) });
    c.prev();
    expect(c.getActiveIndex()).toBe(0);
  });

  it('11. setActiveItem() with out-of-range index is a no-op', () => {
    const c = new Carousel({ renderTo: host, items: makeCards(3) });
    c.setActiveItem(99);
    expect(c.getActiveIndex()).toBe(0);
    c.setActiveItem(-1);
    expect(c.getActiveIndex()).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Indicators
// ═══════════════════════════════════════════════════════════════════════════

describe('Carousel indicators', () => {
  it('12. renders the correct number of pips when indicators: true', () => {
    const c = new Carousel({ renderTo: host, indicators: true, items: makeCards(5) });
    const pips = c.el!.querySelectorAll('.x-carousel-pip');
    expect(pips.length).toBe(5);
  });

  it('13. clicking pip i calls setActiveItem(i)', () => {
    const c = new Carousel({ renderTo: host, indicators: true, items: makeCards(4) });
    const pips = c.el!.querySelectorAll<HTMLElement>('.x-carousel-pip');
    pips[2].click();
    expect(c.getActiveIndex()).toBe(2);
  });

  it('14. the active pip carries .x-carousel-pip-active', () => {
    const c = new Carousel({ renderTo: host, indicators: true, items: makeCards(3) });
    const pips = c.el!.querySelectorAll('.x-carousel-pip');

    // Initially pip 0 is active
    expect(pips[0].classList.contains('x-carousel-pip-active')).toBe(true);
    expect(pips[1].classList.contains('x-carousel-pip-active')).toBe(false);

    c.next();
    expect(pips[0].classList.contains('x-carousel-pip-active')).toBe(false);
    expect(pips[1].classList.contains('x-carousel-pip-active')).toBe(true);
  });

  it('15. indicators: false suppresses the pip DOM entirely', () => {
    const c = new Carousel({ renderTo: host, indicators: false, items: makeCards(3) });
    const bar = c.el!.querySelector('.x-carousel-indicators');
    expect(bar).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Lifecycle / cleanup
// ═══════════════════════════════════════════════════════════════════════════

describe('Carousel lifecycle', () => {
  it('16. ResizeObserver is connected after render and disconnected after destroy()', () => {
    const disconnectFn = vi.fn();
    (globalThis as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect = disconnectFn;
    };

    const c = new Carousel({ renderTo: host, items: makeCards(2) });
    expect(c.rendered).toBe(true);
    c.destroy();
    expect(disconnectFn).toHaveBeenCalled();
  });

  it('17. destroy() nulls out the pointer-event handler references', () => {
    const c = new Carousel({ renderTo: host, items: makeCards(2) });
    expect((c as any)._onPointerDown).not.toBeNull();
    c.destroy();
    expect((c as any)._onPointerDown).toBeNull();
    expect((c as any)._onPointerMove).toBeNull();
    expect((c as any)._onPointerUp).toBeNull();
  });

  it('18. animDuration: 0 switches cards without adding a CSS transition', () => {
    const c = new Carousel({ renderTo: host, animDuration: 0, items: makeCards(3) });
    c.next();
    expect(c.getActiveIndex()).toBe(1);
    const track = c.getBodyEl().querySelector<HTMLElement>('.x-carousel-track')!;
    expect(track.style.transition).toBe('');
  });

  it('19. activeitemchange listener in config is called with correct arguments', () => {
    const listener = vi.fn();
    const cards = makeCards(3);
    const c = new Carousel({
      renderTo: host,
      items: cards,
      listeners: { activeitemchange: listener },
    });

    c.next();

    expect(listener).toHaveBeenCalledOnce();
    const [carousel, newItem, oldItem, newIndex, oldIndex] = listener.mock.calls[0];
    expect(carousel).toBe(c);
    expect(newItem).toBe(cards[1]);
    expect(oldItem).toBe(cards[0]);
    expect(newIndex).toBe(1);
    expect(oldIndex).toBe(0);
  });
});
