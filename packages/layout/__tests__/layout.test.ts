import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Component, Container } from '@framesquared/component';
import { Layout } from '../src/Layout.js';
import { AutoLayout } from '../src/AutoLayout.js';
import { LayoutContext } from '../src/LayoutContext.js';
import { LayoutRunner } from '../src/LayoutRunner.js';
import type { SizePolicy } from '../src/Layout.js';

// ResizeObserver mock
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

// Helpers
function cmp(cfg: Record<string, unknown> = {}): Component {
  return new Component(cfg);
}

function ct(cfg: Record<string, unknown> = {}): Container {
  return new Container({ renderTo: document.body, ...cfg });
}

// ═══════════════════════════════════════════════════════════════════════════
// Layout base class
// ═══════════════════════════════════════════════════════════════════════════

describe('Layout base class', () => {
  it('has a type property', () => {
    const layout = new Layout({ type: 'test' });
    expect(layout.type).toBe('test');
  });

  it('defaults type to "auto"', () => {
    const layout = new Layout({});
    expect(layout.type).toBe('auto');
  });

  it('stores owner reference when setOwner is called', () => {
    const layout = new Layout({});
    const owner = ct();
    layout.setOwner(owner);
    expect(layout.owner).toBe(owner);
  });

  it('isRunning is false by default', () => {
    const layout = new Layout({});
    expect(layout.isRunning).toBe(false);
  });

  it('needsLayout is true initially', () => {
    const layout = new Layout({});
    expect(layout.needsLayout).toBe(true);
  });

  it('getItemSizePolicy returns default policy', () => {
    const layout = new Layout({});
    const child = cmp({ width: 100 });
    const policy = layout.getItemSizePolicy(child);
    expect(policy.width).toBeDefined();
    expect(policy.height).toBeDefined();
  });

  it('renderItems appends children to target element', () => {
    const layout = new Layout({});
    const target = document.createElement('div');
    document.body.appendChild(target);
    const items = [cmp({ html: 'A' }), cmp({ html: 'B' })];
    layout.renderItems(items, target);
    expect(target.children.length).toBe(2);
    expect(items[0].rendered).toBe(true);
    expect(items[1].rendered).toBe(true);
  });

  it('lifecycle methods are callable', () => {
    const layout = new Layout({});
    const ctx = new LayoutContext();
    expect(() => {
      layout.beginLayout(ctx);
      layout.calculate(ctx);
      layout.completeLayout(ctx);
      layout.afterLayout();
    }).not.toThrow();
  });

  it('beginLayout sets isRunning=true', () => {
    const layout = new Layout({});
    layout.beginLayout(new LayoutContext());
    expect(layout.isRunning).toBe(true);
  });

  it('completeLayout sets isRunning=false and needsLayout=false', () => {
    const layout = new Layout({});
    const ctx = new LayoutContext();
    layout.beginLayout(ctx);
    layout.completeLayout(ctx);
    expect(layout.isRunning).toBe(false);
    expect(layout.needsLayout).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Layout lifecycle order
// ═══════════════════════════════════════════════════════════════════════════

describe('Layout lifecycle order', () => {
  it('phases execute in correct order: begin → calculate → complete → after', () => {
    const order: string[] = [];
    class TestLayout extends Layout {
      override beginLayout(ctx: LayoutContext): void {
        super.beginLayout(ctx);
        order.push('begin');
      }
      override calculate(_ctx: LayoutContext): void {
        order.push('calculate');
      }
      override completeLayout(ctx: LayoutContext): void {
        super.completeLayout(ctx);
        order.push('complete');
      }
      override afterLayout(): void {
        order.push('after');
      }
    }

    const layout = new TestLayout({ type: 'test' });
    const ctx = new LayoutContext();
    layout.beginLayout(ctx);
    layout.calculate(ctx);
    layout.completeLayout(ctx);
    layout.afterLayout();
    expect(order).toEqual(['begin', 'calculate', 'complete', 'after']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LayoutContext
// ═══════════════════════════════════════════════════════════════════════════

describe('LayoutContext', () => {
  it('setProp / getProp stores and retrieves values', () => {
    const ctx = new LayoutContext();
    ctx.setProp('width', 200);
    expect(ctx.getProp('width')).toBe(200);
  });

  it('getProp returns undefined for unset props', () => {
    const ctx = new LayoutContext();
    expect(ctx.getProp('height')).toBeUndefined();
  });

  it('caching avoids repeated DOM reads', () => {
    const ctx = new LayoutContext();
    const el = document.createElement('div');
    el.style.width = '100px';
    document.body.appendChild(el);

    const readFn = vi.fn(() => el.offsetWidth);
    // First read — calls the function
    const v1 = ctx.getDomProp('width', el, readFn);
    expect(readFn).toHaveBeenCalledOnce();

    // Second read — returns cached value
    const v2 = ctx.getDomProp('width', el, readFn);
    expect(readFn).toHaveBeenCalledOnce(); // still 1
    expect(v1).toBe(v2);
  });

  it('hasDomProp returns true after caching', () => {
    const ctx = new LayoutContext();
    const el = document.createElement('div');
    expect(ctx.hasDomProp('width', el)).toBe(false);
    ctx.getDomProp('width', el, () => 100);
    expect(ctx.hasDomProp('width', el)).toBe(true);
  });

  it('flush clears all cached data', () => {
    const ctx = new LayoutContext();
    ctx.setProp('x', 10);
    const el = document.createElement('div');
    ctx.getDomProp('w', el, () => 50);
    ctx.flush();
    expect(ctx.getProp('x')).toBeUndefined();
    expect(ctx.hasDomProp('w', el)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LayoutRunner
// ═══════════════════════════════════════════════════════════════════════════

describe('LayoutRunner', () => {
  it('is a singleton', () => {
    const a = LayoutRunner.getInstance();
    const b = LayoutRunner.getInstance();
    expect(a).toBe(b);
  });

  it('invalidate marks a component for re-layout', () => {
    const runner = LayoutRunner.getInstance();
    const c = ct();
    runner.invalidate(c);
    expect(runner.isPending(c)).toBe(true);
  });

  it('run() processes all pending layouts', async () => {
    const runner = LayoutRunner.getInstance();
    runner.clear();

    const order: string[] = [];
    class TrackLayout extends Layout {
      override calculate(_ctx: LayoutContext): void {
        order.push('calc');
      }
    }

    const c = ct();
    const layout = new TrackLayout({ type: 'track' });
    layout.setOwner(c);
    (c as any)._layoutInstance = layout;

    runner.invalidate(c);
    runner.run();

    expect(order).toContain('calc');
    expect(runner.isPending(c)).toBe(false);
  });

  it('multiple invalidations result in single layout run', () => {
    const runner = LayoutRunner.getInstance();
    runner.clear();

    let calcCount = 0;
    class CountLayout extends Layout {
      override calculate(_ctx: LayoutContext): void {
        calcCount++;
      }
    }

    const c = ct();
    const layout = new CountLayout({ type: 'count' });
    layout.setOwner(c);
    (c as any)._layoutInstance = layout;

    runner.invalidate(c);
    runner.invalidate(c); // duplicate
    runner.invalidate(c); // duplicate
    runner.run();

    expect(calcCount).toBe(1);
  });

  it('run() detects and breaks layout cycles', () => {
    const runner = LayoutRunner.getInstance();
    runner.clear();

    let runCount = 0;
    class CycleLayout extends Layout {
      override calculate(_ctx: LayoutContext): void {
        runCount++;
        // Re-invalidate during calculate — would cause infinite loop
        if (runCount < 20) {
          this.needsLayout = true;
          runner.invalidate(this.owner!);
        }
      }
    }

    const c = ct();
    const layout = new CycleLayout({ type: 'cycle' });
    layout.setOwner(c);
    (c as any)._layoutInstance = layout;

    runner.invalidate(c);
    runner.run();

    // Should stop after max iterations, not infinite loop
    expect(runCount).toBeLessThan(20);
  });

  it('clear removes all pending items', () => {
    const runner = LayoutRunner.getInstance();
    const c = ct();
    runner.invalidate(c);
    runner.clear();
    expect(runner.isPending(c)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AutoLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('AutoLayout', () => {
  it('has type "auto"', () => {
    const layout = new AutoLayout();
    expect(layout.type).toBe('auto');
  });

  it('renders items sequentially into the target', () => {
    const layout = new AutoLayout();
    const target = document.createElement('div');
    document.body.appendChild(target);
    const items = [cmp({ html: 'First' }), cmp({ html: 'Second' })];
    layout.renderItems(items, target);

    expect(target.children.length).toBe(2);
    expect((target.children[0] as HTMLElement).innerHTML).toContain('First');
    expect((target.children[1] as HTMLElement).innerHTML).toContain('Second');
  });

  it('respects item width/height configs', () => {
    const layout = new AutoLayout();
    const target = document.createElement('div');
    document.body.appendChild(target);
    const items = [cmp({ width: 200, height: 100 })];
    layout.renderItems(items, target);

    const el = items[0].el!;
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('100px');
  });

  it('calculate is a no-op (auto layout uses natural flow)', () => {
    const layout = new AutoLayout();
    const ctx = new LayoutContext();
    // Should not throw
    expect(() => layout.calculate(ctx)).not.toThrow();
  });

  it('getItemSizePolicy returns natural for both dimensions', () => {
    const layout = new AutoLayout();
    const child = cmp();
    const policy = layout.getItemSizePolicy(child);
    expect(policy.width).toBe('natural');
    expect(policy.height).toBe('natural');
  });

  it('works as Container layout integration', () => {
    const c = ct({
      items: [new Component({ html: 'A', width: 50 }), new Component({ html: 'B', width: 100 })],
    });

    const body = c.getBodyEl();
    expect(body.children.length).toBe(2);
    expect((body.children[0] as HTMLElement).style.width).toBe('50px');
    expect((body.children[1] as HTMLElement).style.width).toBe('100px');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SizePolicy
// ═══════════════════════════════════════════════════════════════════════════

describe('SizePolicy', () => {
  it('configured policy for items with explicit size', () => {
    const layout = new Layout({});
    const child = cmp({ width: 100, height: 50 });
    const policy = layout.getItemSizePolicy(child);
    expect(policy.width).toBe('configured');
    expect(policy.height).toBe('configured');
  });

  it('natural policy for items without explicit size', () => {
    const layout = new Layout({});
    const child = cmp({});
    const policy = layout.getItemSizePolicy(child);
    expect(policy.width).toBe('natural');
    expect(policy.height).toBe('natural');
  });
});
