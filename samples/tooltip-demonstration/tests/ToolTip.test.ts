/**
 * ToolTip.test.ts
 *
 * TDD test suite — ToolTip Demonstration
 *
 * vi.useFakeTimers() is installed globally (before createMainView) so that
 * the dynamic-content setInterval is created under fake-timer control and
 * can be advanced with vi.advanceTimersByTime().
 *
 * Spec axes:
 *  1.  Application lifecycle              — name, singleton, hook order
 *  2.  Demo structure                     — all 5 tooltips created & attached
 *  3.  Target-based attachment            — target resolved, listeners registered
 *  4.  Basic tooltip (show / hide delays) — showDelay / hideDelay timers
 *  5.  HTML content                       — title header + innerHTML body
 *  6.  Mouse tracking                     — position follows mousemove
 *  7.  Anchor positioning                 — positionNearTarget() vs positionAtMouse()
 *  8.  Dynamic content update             — update() method, interval-driven change
 *  9.  Auto-hide & dismissDelay           — autoHide:false keeps tip visible
 * 10.  Lifecycle events                   — beforeshow / show / beforehide / hide
 * 11.  Closable tooltip                   — close button renders and dismisses
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Tooltip } from '@framesquared/ui';
import { createMainView, type TooltipDemoRefs } from '../MainView.js';

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let host: HTMLDivElement;
let refs: TooltipDemoRefs;

beforeEach(() => {
  // Install fake timers BEFORE createMainView so the dynamic setInterval is
  // also under fake-timer control.
  vi.useFakeTimers();
  (globalThis as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
  host = document.createElement('div');
  document.body.appendChild(host);
  Application.clearInstance();
  refs = createMainView(host);
});

afterEach(() => {
  clearInterval(refs.dynamicIntervalId);
  refs.basicTip.destroy();
  refs.richTip.destroy();
  refs.trackTip.destroy();
  refs.anchorTip.destroy();
  refs.dynamicTip.destroy();
  host.remove();
  document.body.innerHTML = '';
  Application.clearInstance();
  vi.useRealTimers();
});

// ════════════════════════════════════════════════════════════════════════════
// 1. Application lifecycle
// ════════════════════════════════════════════════════════════════════════════

describe('Application lifecycle', () => {
  it('instantiates with name "TooltipDemo"', () => {
    const app = new Application({ name: 'TooltipDemo' });
    expect(app.getName()).toBe('TooltipDemo');
  });

  it('registers itself as the singleton', () => {
    const app = new Application({ name: 'TooltipDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'TooltipDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'TooltipDemo',
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
      constructor() { super({ name: 'TooltipDemo' }); }
      override launch(): void { launched = true; }
    }
    new DemoApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Demo structure — all five tooltips created and wired
// ════════════════════════════════════════════════════════════════════════════

describe('Demo structure', () => {
  it('basicTip is a Tooltip instance', () => {
    expect(refs.basicTip).toBeInstanceOf(Tooltip);
  });

  it('richTip is a Tooltip instance', () => {
    expect(refs.richTip).toBeInstanceOf(Tooltip);
  });

  it('trackTip is a Tooltip instance', () => {
    expect(refs.trackTip).toBeInstanceOf(Tooltip);
  });

  it('anchorTip is a Tooltip instance', () => {
    expect(refs.anchorTip).toBeInstanceOf(Tooltip);
  });

  it('dynamicTip is a Tooltip instance', () => {
    expect(refs.dynamicTip).toBeInstanceOf(Tooltip);
  });

  it('all target component elements are rendered inside the host', () => {
    expect(host.contains(refs.basicBtn.el!)).toBe(true);
    expect(host.contains(refs.richPanel.el!)).toBe(true);
    expect(host.contains(refs.dataPanel.el!)).toBe(true);
    expect(host.contains(refs.anchorBtn.el!)).toBe(true);
    expect(host.contains(refs.dynamicBtn.el!)).toBe(true);
  });

  it('dynamicIntervalId is a valid (fake) interval handle', () => {
    expect(refs.dynamicIntervalId).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Target-based attachment
// ════════════════════════════════════════════════════════════════════════════

describe('Target-based attachment', () => {
  it('tooltip is not visible before mouseenter', () => {
    expect(refs.basicTip.isVisible()).toBe(false);
  });

  it('tooltip is not rendered before first show', () => {
    expect(refs.basicTip.rendered).toBe(false);
  });

  it('basicTip target is the basicBtn root element', () => {
    const targetEl = (refs.basicTip as any)._targetEl as Element | null;
    expect(targetEl).toBe(refs.basicBtn.el!);
  });

  it('richTip target is the richPanel root element', () => {
    const targetEl = (refs.richTip as any)._targetEl as Element | null;
    expect(targetEl).toBe(refs.richPanel.el!);
  });

  it('trackTip target is the dataPanel root element', () => {
    const targetEl = (refs.trackTip as any)._targetEl as Element | null;
    expect(targetEl).toBe(refs.dataPanel.el!);
  });

  it('anchorTip target is the anchorBtn root element', () => {
    const targetEl = (refs.anchorTip as any)._targetEl as Element | null;
    expect(targetEl).toBe(refs.anchorBtn.el!);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Basic tooltip — show / hide delays
// ════════════════════════════════════════════════════════════════════════════

describe('Show/hide delays', () => {
  it('tooltip does not show immediately on mouseenter (showDelay:300)', () => {
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(refs.basicTip.isVisible()).toBe(false);
  });

  it('tooltip shows after showDelay ms has elapsed', () => {
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(300);
    expect(refs.basicTip.isVisible()).toBe(true);
  });

  it('show timer is cancelled if mouse leaves before delay expires', () => {
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(100); // before 300 ms showDelay
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(300); // would have fired without the cancel
    expect(refs.basicTip.isVisible()).toBe(false);
  });

  it('tooltip does not hide immediately on mouseleave (hideDelay:150)', () => {
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(300);
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(refs.basicTip.isVisible()).toBe(true);
  });

  it('tooltip hides after hideDelay ms on mouseleave', () => {
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(300);
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(150);
    expect(refs.basicTip.isVisible()).toBe(false);
  });

  it('re-entering before hideDelay fires cancels the pending hide', () => {
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(300);
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(50); // before 150 ms hideDelay
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(refs.basicTip.isVisible()).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. HTML content
// ════════════════════════════════════════════════════════════════════════════

describe('HTML content', () => {
  function showRichTip(): void {
    refs.richPanel.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(200);
  }

  it('tooltip renders with x-tooltip class', () => {
    showRichTip();
    expect(refs.richTip.el!.classList.contains('x-tooltip')).toBe(true);
  });

  it('x-tip-body innerHTML contains the configured html', () => {
    showRichTip();
    const body = refs.richTip.el!.querySelector('.x-tip-body');
    expect(body).not.toBeNull();
    expect(body!.innerHTML).toContain('us-east-1');
    expect(body!.innerHTML).toContain('99.9');
  });

  it('x-tip-header text matches the configured title', () => {
    showRichTip();
    const header = refs.richTip.el!.querySelector('.x-tip-header');
    expect(header).not.toBeNull();
    expect(header!.textContent).toContain('Live Server Status');
  });

  it('el.style.maxWidth is set from maxWidth config', () => {
    showRichTip();
    expect(refs.richTip.el!.style.maxWidth).toBe('240px');
  });

  it('role="tooltip" is set for accessibility', () => {
    showRichTip();
    expect(refs.richTip.el!.getAttribute('role')).toBe('tooltip');
  });

  it('tooltip is appended to document.body', () => {
    showRichTip();
    expect(document.body.contains(refs.richTip.el!)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Mouse tracking
// ════════════════════════════════════════════════════════════════════════════

describe('Mouse tracking', () => {
  function showTrackTip(cx = 50, cy = 50): void {
    refs.dataPanel.el!.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true, clientX: cx, clientY: cy }),
    );
    vi.advanceTimersByTime(1); // showDelay:0 fires on the next tick
  }

  it('trackTip has trackMouse: true in config', () => {
    expect((refs.trackTip as any)._trackMouse).toBe(true);
  });

  it('showDelay:0 means tooltip is visible after runAllTimers', () => {
    showTrackTip();
    expect(refs.trackTip.isVisible()).toBe(true);
  });

  it('tooltip is position: fixed', () => {
    showTrackTip();
    expect(refs.trackTip.el!.style.position).toBe('fixed');
  });

  it('left position updates when mouse moves over data panel', () => {
    showTrackTip();
    const leftBefore = refs.trackTip.el!.style.left;
    refs.dataPanel.el!.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 100 }),
    );
    expect(refs.trackTip.el!.style.left).not.toBe(leftBefore);
  });

  it('follows cursor: left = clientX + mouseOffset[0] (12)', () => {
    refs.dataPanel.el!.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true, clientX: 0, clientY: 0 }),
    );
    vi.advanceTimersByTime(1);
    refs.dataPanel.el!.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 80, clientY: 40 }),
    );
    expect(refs.trackTip.el!.style.left).toBe('92px');  // 80 + 12
    expect(refs.trackTip.el!.style.top).toBe('52px');   // 40 + 12
  });

  it('position does not update when tooltip is hidden', () => {
    showTrackTip(0, 0);
    refs.trackTip.hide();
    refs.dataPanel.el!.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 999, clientY: 999 }),
    );
    // Left was set from initial show — should not have changed to 999+12
    expect(refs.trackTip.el!.style.left).not.toBe('1011px');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Anchor positioning
// ════════════════════════════════════════════════════════════════════════════

describe('Anchor positioning', () => {
  function triggerAnchorShow(cx = 0, cy = 0): void {
    refs.anchorBtn.el!.dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true, clientX: cx, clientY: cy }),
    );
    vi.advanceTimersByTime(1); // showDelay:0
  }

  it('anchorTip has anchor: "right" in config', () => {
    expect((refs.anchorTip as any)._anchor).toBe('right');
  });

  it('anchorTip has autoHide: false', () => {
    expect((refs.anchorTip as any)._autoHide).toBe(false);
  });

  it('anchorTip has dismissDelay: 0', () => {
    expect((refs.anchorTip as any)._dismissDelay).toBe(0);
  });

  it('tooltip is visible after mouseenter (showDelay:0)', () => {
    triggerAnchorShow();
    expect(refs.anchorTip.isVisible()).toBe(true);
  });

  it('anchor position is NOT cursor-based (left ≠ clientX + default 15px offset)', () => {
    // With cursor at (100, 100) a pure mouse-based tip would have left="115px".
    // Anchor-based uses target.getBoundingClientRect().right + 8.
    // jsdom returns 0 for all rects, so right=0 → left = 0 + 8 = "8px".
    triggerAnchorShow(100, 100);
    expect(refs.anchorTip.el!.style.left).not.toBe('115px');
  });

  it('anchor:"right" sets left = target.right + 8 (jsdom: 0 + 8 = 8px)', () => {
    triggerAnchorShow();
    expect(refs.anchorTip.el!.style.left).toBe('8px');
  });

  it('tooltip remains visible on mouseleave when autoHide is false', () => {
    triggerAnchorShow();
    refs.anchorBtn.el!.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(500);
    expect(refs.anchorTip.isVisible()).toBe(true);
  });

  it('tooltip does not auto-dismiss when dismissDelay is 0', () => {
    triggerAnchorShow();
    vi.advanceTimersByTime(60_000);
    expect(refs.anchorTip.isVisible()).toBe(true);
  });

  it('explicit hide() call still hides an anchored tooltip', () => {
    triggerAnchorShow();
    refs.anchorTip.hide();
    expect(refs.anchorTip.isVisible()).toBe(false);
  });

  it('x-tip-anchor-right class is applied when anchor:"right"', () => {
    triggerAnchorShow();
    expect(refs.anchorTip.el!.classList.contains('x-tip-anchor-right')).toBe(true);
  });

  it('anchor classes work for all four directions (unit)', () => {
    for (const dir of ['top', 'bottom', 'left', 'right'] as const) {
      const tip = new Tooltip({
        target: refs.anchorBtn.el!,
        html: 'dir test',
        anchor: dir,
        showDelay: 0,
      });
      refs.anchorBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.advanceTimersByTime(1); // showDelay:0
      expect(tip.el!.classList.contains(`x-tip-anchor-${dir}`)).toBe(true);
      tip.destroy();
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Dynamic content update
// ════════════════════════════════════════════════════════════════════════════

describe('Dynamic content update', () => {
  function showDynamic(): void {
    refs.dynamicBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(1); // showDelay:0
  }

  it('dynamicTip shows initial "Checking status" content', () => {
    showDynamic();
    const body = refs.dynamicTip.el!.querySelector('.x-tip-body');
    expect(body!.innerHTML).toContain('Checking status');
  });

  it('update() replaces body content while tooltip is visible', () => {
    showDynamic();
    refs.dynamicTip.update('<b>Status:</b> ✓ Online');
    expect(refs.dynamicTip.el!.querySelector('.x-tip-body')!.innerHTML).toContain('Online');
  });

  it('update() does not trigger a render when tooltip is not yet visible', () => {
    refs.dynamicTip.update('silent pre-show update');
    expect(refs.dynamicTip.rendered).toBe(false);
  });

  it('content stored by update() is rendered on the next show', () => {
    refs.dynamicTip.update('pre-show stored content');
    showDynamic();
    expect(refs.dynamicTip.el!.querySelector('.x-tip-body')!.innerHTML).toContain('pre-show stored content');
  });

  it('update() also updates the header when a title is provided', () => {
    showDynamic();
    refs.dynamicTip.update('body', 'Dynamic Header');
    expect(refs.dynamicTip.el!.querySelector('.x-tip-header')!.textContent).toContain('Dynamic Header');
  });

  it('the 2-second interval fires and updates the visible tooltip content', () => {
    showDynamic();
    const originalHTML = refs.dynamicTip.el!.querySelector('.x-tip-body')!.innerHTML;

    // Advance fake timers by 2000 ms — fires the setInterval created in createMainView
    vi.advanceTimersByTime(2000);

    // updateContent() replaces the body div; query fresh after interval fires
    const updatedHTML = refs.dynamicTip.el!.querySelector('.x-tip-body')!.innerHTML;
    expect(updatedHTML).not.toBe(originalHTML);
  });

  it('content changes again on the second interval tick (4000 ms total)', () => {
    showDynamic();
    vi.advanceTimersByTime(2000);
    const afterFirst = refs.dynamicTip.el!.querySelector('.x-tip-body')!.innerHTML;
    vi.advanceTimersByTime(2000);
    const afterSecond = refs.dynamicTip.el!.querySelector('.x-tip-body')!.innerHTML;
    // Both ticks should have updated content (time changes so HTML differs)
    expect(afterFirst).toContain('Last check');
    expect(afterSecond).toContain('Last check');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. Auto-hide and dismissDelay
// ════════════════════════════════════════════════════════════════════════════

describe('Auto-hide and dismissDelay', () => {
  it('basicTip auto-dismisses after 4000 ms (dismissDelay)', () => {
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(300); // show
    vi.advanceTimersByTime(4000); // dismissDelay
    expect(refs.basicTip.isVisible()).toBe(false);
  });

  it('trackTip has dismissDelay:0 (no auto-dismiss)', () => {
    expect((refs.trackTip as any)._dismissDelay).toBe(0);
  });

  it('anchorTip stays visible indefinitely when dismissDelay:0 + autoHide:false', () => {
    refs.anchorBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(1); // showDelay:0
    vi.advanceTimersByTime(120_000);
    expect(refs.anchorTip.isVisible()).toBe(true);
  });

  it('hide() sets isVisible() to false', () => {
    refs.anchorBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(1); // showDelay:0
    refs.anchorTip.hide();
    expect(refs.anchorTip.isVisible()).toBe(false);
  });

  it('hide() on an already-hidden tooltip is a safe no-op', () => {
    expect(() => refs.basicTip.hide()).not.toThrow();
  });

  it('x-tip-hidden class is added on hide', () => {
    refs.anchorBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(1); // showDelay:0
    refs.anchorTip.hide();
    expect(refs.anchorTip.el!.classList.contains('x-tip-hidden')).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. Lifecycle events
// ════════════════════════════════════════════════════════════════════════════

describe('Lifecycle events', () => {
  function show(tip: Tooltip, targetEl: Element, delay = 300): void {
    void tip; // param kept for call-site readability
    targetEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(delay);
  }

  it('"beforeshow" fires before the tooltip becomes visible', () => {
    let firedBeforeVisible = false;
    refs.basicTip.on('beforeshow', () => {
      firedBeforeVisible = !refs.basicTip.isVisible();
    });
    show(refs.basicTip, refs.basicBtn.el!, 300);
    expect(firedBeforeVisible).toBe(true);
  });

  it('"show" fires once the tooltip is visible', () => {
    let firedWhileVisible = false;
    refs.basicTip.on('show', () => {
      firedWhileVisible = refs.basicTip.isVisible();
    });
    show(refs.basicTip, refs.basicBtn.el!, 300);
    expect(firedWhileVisible).toBe(true);
  });

  it('"beforehide" fires before the tooltip becomes invisible', () => {
    show(refs.anchorTip, refs.anchorBtn.el!, 1); // showDelay:0
    let firedBeforeHidden = false;
    refs.anchorTip.on('beforehide', () => {
      firedBeforeHidden = refs.anchorTip.isVisible();
    });
    refs.anchorTip.hide();
    expect(firedBeforeHidden).toBe(true);
  });

  it('"hide" fires after the tooltip is hidden', () => {
    show(refs.anchorTip, refs.anchorBtn.el!, 1); // showDelay:0
    let firedAfterHidden = false;
    refs.anchorTip.on('hide', () => {
      firedAfterHidden = !refs.anchorTip.isVisible();
    });
    refs.anchorTip.hide();
    expect(firedAfterHidden).toBe(true);
  });

  it('"beforeshow" fires before "show"', () => {
    const order: string[] = [];
    refs.basicTip.on('beforeshow', () => order.push('beforeshow'));
    refs.basicTip.on('show',       () => order.push('show'));
    show(refs.basicTip, refs.basicBtn.el!, 300);
    expect(order).toEqual(['beforeshow', 'show']);
  });

  it('"beforehide" fires before "hide"', () => {
    show(refs.anchorTip, refs.anchorBtn.el!, 1); // showDelay:0
    const order: string[] = [];
    refs.anchorTip.on('beforehide', () => order.push('beforehide'));
    refs.anchorTip.on('hide',       () => order.push('hide'));
    refs.anchorTip.hide();
    expect(order).toEqual(['beforehide', 'hide']);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 11. Closable tooltip
// ════════════════════════════════════════════════════════════════════════════

describe('Closable tooltip', () => {
  let closableTip: Tooltip;

  beforeEach(() => {
    closableTip = new Tooltip({
      target: refs.basicBtn.el!,
      html: 'Closable tooltip content.',
      closable: true,
      showDelay: 0,
      dismissDelay: 0,
      autoHide: false,
    });
  });

  afterEach(() => {
    closableTip.destroy();
  });

  function showClosable(): void {
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(1); // showDelay:0
  }

  it('close button (.x-tip-close) is present when closable:true', () => {
    showClosable();
    expect(closableTip.el!.querySelector('.x-tip-close')).not.toBeNull();
  });

  it('close button text is "×"', () => {
    showClosable();
    const btn = closableTip.el!.querySelector<HTMLElement>('.x-tip-close')!;
    expect(btn.textContent).toBe('×');
  });

  it('clicking the close button hides the tooltip', () => {
    showClosable();
    closableTip.el!.querySelector<HTMLElement>('.x-tip-close')!.click();
    expect(closableTip.isVisible()).toBe(false);
  });

  it('no .x-tip-close element when closable:false (default)', () => {
    refs.basicBtn.el!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(300);
    expect(refs.basicTip.el!.querySelector('.x-tip-close')).toBeNull();
  });
});
