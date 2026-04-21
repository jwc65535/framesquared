/**
 * TDD suite for carousel-basic-demo
 *
 * Tests the createCarouselView factory: initial render, slide count,
 * active-item switching, toolbar buttons, loop toggle, and indicator pips.
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { createCarouselView, type CarouselViewRefs } from '../src/CarouselView.js';

// ── ResizeObserver mock ──────────────────────────────────────────────────────

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ── Setup ─────────────────────────────────────────────────────────────────

let host: HTMLDivElement;
let refs: CarouselViewRefs;

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockResizeObserver;
  host = document.createElement('div');
  document.body.appendChild(host);
  Application.clearInstance();
  refs = createCarouselView(host);
});

afterEach(() => {
  host.remove();
  document.body.innerHTML = '';
  Application.clearInstance();
});

// ── Application lifecycle ──────────────────────────────────────────────────

describe('Application lifecycle', () => {
  it('Application singleton resets cleanly', () => {
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('Application can be started', () => {
    Application.clearInstance();
    let launched = false;
    class TestApp extends Application {
      constructor() { super({ name: 'test' }); }
      override launch() { launched = true; }
    }
    new TestApp().start();
    expect(launched).toBe(true);
  });
});

// ── Carousel renders ──────────────────────────────────────────────────────

describe('Carousel renders', () => {
  it('carousel is rendered in the host', () => {
    expect(host.querySelector('.x-carousel')).toBeTruthy();
  });

  it('carousel contains exactly 5 slides', () => {
    expect(refs.carousel.getCount()).toBe(5);
  });

  it('carousel track contains all 5 slide elements', () => {
    const track = host.querySelector('.x-carousel-track')!;
    expect(track.children.length).toBe(5);
  });

  it('initial active index is 0', () => {
    expect(refs.carousel.getActiveIndex()).toBe(0);
  });

  it('indicator pips are rendered (5 pips for 5 slides)', () => {
    const pips = host.querySelectorAll('.x-carousel-pip');
    expect(pips.length).toBe(5);
  });

  it('first pip is initially active', () => {
    const pips = host.querySelectorAll('.x-carousel-pip');
    expect(pips[0].classList.contains('x-carousel-pip-active')).toBe(true);
  });
});

// ── Toolbar navigation buttons ────────────────────────────────────────────

describe('Toolbar navigation buttons', () => {
  it('Next button advances to slide 1', () => {
    refs.nextButton.el!.click();
    expect(refs.carousel.getActiveIndex()).toBe(1);
  });

  it('Prev button is a no-op on the first slide (loop off)', () => {
    refs.prevButton.el!.click();
    expect(refs.carousel.getActiveIndex()).toBe(0);
  });

  it('Next then Prev returns to slide 0', () => {
    refs.nextButton.el!.click();
    refs.prevButton.el!.click();
    expect(refs.carousel.getActiveIndex()).toBe(0);
  });

  it('First button goes to slide 0 from any position', () => {
    refs.carousel.goTo(3);
    refs.firstButton.el!.click();
    expect(refs.carousel.getActiveIndex()).toBe(0);
  });

  it('Last button jumps to the last slide', () => {
    refs.lastButton.el!.click();
    expect(refs.carousel.getActiveIndex()).toBe(4);
  });

  it('Next is a no-op from last slide when loop is off', () => {
    refs.carousel.goTo(4);
    refs.nextButton.el!.click();
    expect(refs.carousel.getActiveIndex()).toBe(4);
  });
});

// ── Loop toggle ───────────────────────────────────────────────────────────

describe('Loop toggle button', () => {
  it('loop is off by default — Prev from slide 0 stays on slide 0', () => {
    refs.prevButton.el!.click();
    expect(refs.carousel.getActiveIndex()).toBe(0);
  });

  it('Loop button enables wrap-around', () => {
    refs.loopButton.el!.click();          // enable loop
    refs.carousel.goTo(4);               // go to last
    refs.nextButton.el!.click();          // should wrap to 0
    expect(refs.carousel.getActiveIndex()).toBe(0);
  });

  it('Loop button toggles off on second click', () => {
    refs.loopButton.el!.click();          // enable
    refs.loopButton.el!.click();          // disable
    refs.carousel.goTo(4);
    refs.nextButton.el!.click();          // should stay on 4
    expect(refs.carousel.getActiveIndex()).toBe(4);
  });
});

// ── Indicators ────────────────────────────────────────────────────────────

describe('Indicator pip interaction', () => {
  it('active pip updates after navigation', () => {
    refs.nextButton.el!.click();
    const pips = host.querySelectorAll('.x-carousel-pip');
    expect(pips[0].classList.contains('x-carousel-pip-active')).toBe(false);
    expect(pips[1].classList.contains('x-carousel-pip-active')).toBe(true);
  });

  it('pip click navigates to the corresponding slide', () => {
    const pips = host.querySelectorAll<HTMLElement>('.x-carousel-pip');
    pips[3].click();
    expect(refs.carousel.getActiveIndex()).toBe(3);
  });
});

// ── getActiveItem ─────────────────────────────────────────────────────────

describe('getActiveItem', () => {
  it('returns the first slide initially', () => {
    expect(refs.carousel.getActiveItem()).toBe(refs.carousel.getAt(0));
  });

  it('returns the updated item after navigation', () => {
    refs.carousel.next();
    expect(refs.carousel.getActiveItem()).toBe(refs.carousel.getAt(1));
  });
});

// ── Auto-play ─────────────────────────────────────────────────────────────

describe('Auto-play button', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('Auto button exists in the toolbar', () => {
    expect(refs.autoPlayButton.el).toBeTruthy();
  });

  it('Auto button label starts as "Auto: OFF"', () => {
    expect(refs.autoPlayButton.el!.textContent).toContain('Auto: OFF');
  });

  it('clicking Auto button changes label to "Auto: ON"', () => {
    refs.autoPlayButton.el!.click();
    expect(refs.autoPlayButton.el!.textContent).toContain('Auto: ON');
  });

  it('auto-play advances the carousel after the interval', () => {
    refs.autoPlayButton.el!.click();           // enable auto-play (3 s)
    vi.advanceTimersByTime(3000);
    expect(refs.carousel.getActiveIndex()).toBe(1);
  });

  it('second click disables auto-play — timer no longer fires', () => {
    refs.autoPlayButton.el!.click();           // on
    refs.autoPlayButton.el!.click();           // off
    vi.advanceTimersByTime(6000);
    expect(refs.carousel.getActiveIndex()).toBe(0);
  });
});
