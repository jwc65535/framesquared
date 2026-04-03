/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tooltip } from '../src/tip/Tooltip.js';
import { QuickTip } from '../src/tip/QuickTip.js';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  vi.useFakeTimers();
  (globalThis as any).ResizeObserver = MockRO;
  QuickTip.disable();
});
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

function target(): HTMLElement {
  const el = document.createElement('div');
  el.style.width = '100px';
  el.style.height = '30px';
  document.body.appendChild(el);
  return el;
}

// ═══════════════════════════════════════════════════════════════════════════
// Tooltip — basics
// ═══════════════════════════════════════════════════════════════════════════

describe('Tooltip — basics', () => {
  it('constructs without rendering', () => {
    const t = new Tooltip({ html: 'Hello' });
    expect(t.rendered).toBe(false);
  });

  it('has x-tooltip class when shown', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Tip' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.el!.classList.contains('x-tooltip')).toBe(true);
    t.hide();
  });

  it('displays html content', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: '<b>Bold</b>' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.el!.innerHTML).toContain('<b>Bold</b>');
    t.hide();
  });

  it('displays title in header when provided', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Content', title: 'My Tip' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.el!.querySelector('.x-tip-header')?.textContent).toBe('My Tip');
    t.hide();
  });

  it('no title means no header', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'No Title' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.el!.querySelector('.x-tip-header')).toBeNull();
    t.hide();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tooltip — show/hide delays
// ═══════════════════════════════════════════════════════════════════════════

describe('Tooltip — delays', () => {
  it('shows after showDelay (default 500ms)', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Delayed' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(t.rendered).toBe(false);
    vi.advanceTimersByTime(499);
    expect(t.isVisible()).toBe(false);
    vi.advanceTimersByTime(2);
    expect(t.isVisible()).toBe(true);
    t.hide();
  });

  it('custom showDelay', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Fast', showDelay: 100 });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(100);
    expect(t.isVisible()).toBe(true);
    t.hide();
  });

  it('hides after mouseleave + hideDelay', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Hide', hideDelay: 200 });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.isVisible()).toBe(true);
    el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(199);
    expect(t.isVisible()).toBe(true);
    vi.advanceTimersByTime(2);
    expect(t.isVisible()).toBe(false);
  });

  it('mouseenter cancels pending hide', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Stay', hideDelay: 200 });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(100);
    // Re-enter before hide completes
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(t.isVisible()).toBe(true);
    t.hide();
  });

  it('mouseleave cancels pending show', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Cancel' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);
    el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(500);
    expect(t.isVisible()).toBe(false);
  });

  it('dismissDelay auto-hides after timeout', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Dismiss', dismissDelay: 1000 });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.isVisible()).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(t.isVisible()).toBe(false);
  });

  it('autoHide:false disables auto-hide on mouseleave', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Sticky', autoHide: false, dismissDelay: 0 });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(1000);
    expect(t.isVisible()).toBe(true);
    t.hide(); // manual hide
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tooltip — positioning
// ═══════════════════════════════════════════════════════════════════════════

describe('Tooltip — positioning', () => {
  it('positions near the target element', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Pos' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: 50, clientY: 15 }));
    vi.advanceTimersByTime(600);
    expect(t.el!.style.position).toBe('fixed');
    expect(t.el!.style.left).toBeTruthy();
    expect(t.el!.style.top).toBeTruthy();
    t.hide();
  });

  it('trackMouse follows cursor movement', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Track', trackMouse: true });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: 10, clientY: 20 }));
    vi.advanceTimersByTime(600);
    const left1 = t.el!.style.left;

    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 80, clientY: 60 }));
    const left2 = t.el!.style.left;
    expect(left1).not.toBe(left2);
    t.hide();
  });

  it('mouseOffset shifts position', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Offset', mouseOffset: [15, 15], trackMouse: true });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: 50, clientY: 50 }));
    vi.advanceTimersByTime(600);
    expect(parseInt(t.el!.style.left, 10)).toBe(65); // 50 + 15
    expect(parseInt(t.el!.style.top, 10)).toBe(65);
    t.hide();
  });

  it('anchor:"top" adds x-tip-anchor-top class', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Anchor', anchor: 'top' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.el!.classList.contains('x-tip-anchor-top')).toBe(true);
    t.hide();
  });

  it('anchor:"bottom"', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'A', anchor: 'bottom' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.el!.classList.contains('x-tip-anchor-bottom')).toBe(true);
    t.hide();
  });

  it('anchor:"left"', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'A', anchor: 'left' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.el!.classList.contains('x-tip-anchor-left')).toBe(true);
    t.hide();
  });

  it('anchor:"right"', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'A', anchor: 'right' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.el!.classList.contains('x-tip-anchor-right')).toBe(true);
    t.hide();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tooltip — events
// ═══════════════════════════════════════════════════════════════════════════

describe('Tooltip — events', () => {
  it('fires beforeshow and show', () => {
    const beforeSpy = vi.fn();
    const showSpy = vi.fn();
    const el = target();
    const t = new Tooltip({
      target: el,
      html: 'Evt',
      listeners: { beforeshow: beforeSpy, show: showSpy },
    });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(beforeSpy).toHaveBeenCalled();
    expect(showSpy).toHaveBeenCalled();
    t.hide();
  });

  it('fires beforehide and hide', () => {
    const beforeSpy = vi.fn();
    const hideSpy = vi.fn();
    const el = target();
    const _t = new Tooltip({
      target: el,
      html: 'Evt',
      hideDelay: 0,
      listeners: { beforehide: beforeSpy, hide: hideSpy },
    });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(1);
    expect(beforeSpy).toHaveBeenCalled();
    expect(hideSpy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tooltip — delegate
// ═══════════════════════════════════════════════════════════════════════════

describe('Tooltip — delegate', () => {
  it('shows different content per delegated child', () => {
    const container = document.createElement('div');
    const child1 = document.createElement('span');
    child1.className = 'tip-target';
    child1.setAttribute('data-qtip', 'Tip for A');
    const child2 = document.createElement('span');
    child2.className = 'tip-target';
    child2.setAttribute('data-qtip', 'Tip for B');
    container.appendChild(child1);
    container.appendChild(child2);
    document.body.appendChild(container);

    const t = new Tooltip({
      target: container,
      delegate: '.tip-target',
    });

    child1.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.el!.textContent).toContain('Tip for A');
    // Mouseleave + re-enter another
    child1.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(300);
    child2.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.el!.textContent).toContain('Tip for B');
    t.hide();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tooltip — closable
// ═══════════════════════════════════════════════════════════════════════════

describe('Tooltip — closable', () => {
  it('closable:true shows a close button', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Close me', closable: true });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    const closeBtn = t.el!.querySelector('.x-tip-close');
    expect(closeBtn).not.toBeNull();
    t.hide();
  });

  it('clicking close button hides tooltip', () => {
    const el = target();
    const t = new Tooltip({
      target: el,
      html: 'Close me',
      closable: true,
      autoHide: false,
      dismissDelay: 0,
    });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    const closeBtn = t.el!.querySelector('.x-tip-close') as HTMLElement;
    closeBtn.click();
    expect(t.isVisible()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tooltip — maxWidth
// ═══════════════════════════════════════════════════════════════════════════

describe('Tooltip — maxWidth', () => {
  it('maxWidth sets style', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Wide', maxWidth: 300 });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.el!.style.maxWidth).toBe('300px');
    t.hide();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tooltip — destroy
// ═══════════════════════════════════════════════════════════════════════════

describe('Tooltip — destroy', () => {
  it('removes event listeners from target on destroy', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Destroy' });
    t.destroy();
    // Should not show after destroy
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(t.isDestroyed).toBe(true);
  });

  it('clears pending timers on destroy', () => {
    const el = target();
    const t = new Tooltip({ target: el, html: 'Timers' });
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    t.destroy();
    vi.advanceTimersByTime(600);
    // Should not throw
    expect(t.isDestroyed).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// QuickTip
// ═══════════════════════════════════════════════════════════════════════════

describe('QuickTip', () => {
  it('init starts monitoring', () => {
    QuickTip.init();
    expect(QuickTip.isEnabled()).toBe(true);
    QuickTip.disable();
  });

  it('reads data-qtip attribute', () => {
    QuickTip.init();
    const el = document.createElement('div');
    el.setAttribute('data-qtip', 'Quick tooltip');
    document.body.appendChild(el);

    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    vi.advanceTimersByTime(600);

    const tip = document.querySelector('.x-tooltip');
    expect(tip).not.toBeNull();
    expect(tip!.textContent).toContain('Quick tooltip');
    QuickTip.disable();
  });

  it('reads data-qtitle attribute', () => {
    QuickTip.init();
    const el = document.createElement('div');
    el.setAttribute('data-qtip', 'Body text');
    el.setAttribute('data-qtitle', 'Title');
    document.body.appendChild(el);

    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    vi.advanceTimersByTime(600);

    const header = document.querySelector('.x-tip-header');
    expect(header?.textContent).toBe('Title');
    QuickTip.disable();
  });

  it('reads data-qwidth attribute', () => {
    QuickTip.init();
    const el = document.createElement('div');
    el.setAttribute('data-qtip', 'Wide tip');
    el.setAttribute('data-qwidth', '400');
    document.body.appendChild(el);

    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    vi.advanceTimersByTime(600);

    const tip = document.querySelector('.x-tooltip') as HTMLElement;
    expect(tip!.style.maxWidth).toBe('400px');
    QuickTip.disable();
  });

  it('enable/disable toggles monitoring', () => {
    QuickTip.init();
    expect(QuickTip.isEnabled()).toBe(true);
    QuickTip.disable();
    expect(QuickTip.isEnabled()).toBe(false);
    QuickTip.enable();
    expect(QuickTip.isEnabled()).toBe(true);
    QuickTip.disable();
  });

  it('disabled QuickTip does not show tooltips', () => {
    QuickTip.init();
    QuickTip.disable();
    const el = document.createElement('div');
    el.setAttribute('data-qtip', 'Should not show');
    document.body.appendChild(el);

    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    vi.advanceTimersByTime(600);

    expect(document.querySelector('.x-tooltip')).toBeNull();
  });

  it('hides when mouse leaves the element', () => {
    QuickTip.init();
    const el = document.createElement('div');
    el.setAttribute('data-qtip', 'Leave me');
    document.body.appendChild(el);

    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    vi.advanceTimersByTime(600);
    expect(document.querySelector('.x-tooltip')).not.toBeNull();

    el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    vi.advanceTimersByTime(300);
    expect(document.querySelector('.x-tooltip')?.classList.contains('x-tip-hidden')).toBe(true);
    QuickTip.disable();
  });
});
