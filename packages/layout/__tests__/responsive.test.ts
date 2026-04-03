/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Component, Container } from '@framesquared/component';
import { ResponsivePlugin } from '../src/ResponsivePlugin.js';
import { ResponsiveColumnLayout } from '../src/ResponsiveColumnLayout.js';
import { LayoutRunner } from '../src/LayoutRunner.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

class MockRO {
  callback: ResizeObserverCallback;
  observed: Element[] = [];
  static instances: MockRO[] = [];
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    MockRO.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve(el: Element) {
    const i = this.observed.indexOf(el);
    if (i !== -1) this.observed.splice(i, 1);
  }
  disconnect() {
    this.observed.length = 0;
  }
  trigger(entries: Partial<ResizeObserverEntry>[]) {
    this.callback(entries as ResizeObserverEntry[], this as unknown as ResizeObserver);
  }
}

interface MockMQL {
  matches: boolean;
  media: string;
  listeners: Set<(...args: unknown[]) => unknown>;
  addEventListener: (type: string, fn: (...args: unknown[]) => unknown) => void;
  removeEventListener: (type: string, fn: (...args: unknown[]) => unknown) => void;
}

const mediaQueries = new Map<string, MockMQL>();

function createMockMatchMedia() {
  return (query: string): MediaQueryList => {
    let mql = mediaQueries.get(query);
    if (!mql) {
      mql = {
        matches: false,
        media: query,
        listeners: new Set(),
        addEventListener(_type: string, fn: (...args: unknown[]) => unknown) {
          this.listeners.add(fn);
        },
        removeEventListener(_type: string, fn: (...args: unknown[]) => unknown) {
          this.listeners.delete(fn);
        },
      };
      mediaQueries.set(query, mql);
    }
    return mql as unknown as MediaQueryList;
  };
}

function setMediaMatch(query: string, matches: boolean) {
  const mql = mediaQueries.get(query);
  if (mql) {
    mql.matches = matches;
    for (const fn of mql.listeners) {
      fn({ matches, media: query });
    }
  }
}

beforeEach(() => {
  MockRO.instances = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = MockRO;
  mediaQueries.clear();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).matchMedia = createMockMatchMedia();
});

afterEach(() => {
  document.body.innerHTML = '';
  LayoutRunner.getInstance().clear();
});

function cmp(cfg: Record<string, unknown> = {}): Component {
  return new Component(cfg);
}

// ═══════════════════════════════════════════════════════════════════════════
// ResponsivePlugin
// ═══════════════════════════════════════════════════════════════════════════

describe('ResponsivePlugin', () => {
  it('constructs with responsiveConfig', () => {
    const plugin = new ResponsivePlugin({
      responsiveConfig: {
        'width < 600': { cls: 'mobile' },
        'width >= 600': { cls: 'desktop' },
      },
    });
    expect(plugin).toBeDefined();
  });

  it('init attaches to owner component', () => {
    const owner = new Component({ renderTo: document.body });
    const plugin = new ResponsivePlugin({
      responsiveConfig: {
        'width < 600': { hidden: true },
      },
    });
    plugin.init(owner);
    expect(plugin.getOwner()).toBe(owner);
  });

  it('applies matching config at current width', () => {
    const owner = new Component({ renderTo: document.body });
    // Simulate narrow viewport
    const plugin = new ResponsivePlugin({
      responsiveConfig: {
        '(max-width: 599px)': { cls: 'mobile' },
        '(min-width: 600px)': { cls: 'desktop' },
      },
    });

    // Set the narrow query to match before init
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).matchMedia = (query: string) => {
      const mql = createMockMatchMedia()(query);
      const m = mediaQueries.get(query)!;
      m.matches = query === '(max-width: 599px)';
      return mql;
    };

    plugin.init(owner);
    // Should have applied the mobile config
    expect(owner.hasCls('mobile')).toBe(true);
  });

  it('re-evaluates when media query changes', () => {
    const owner = new Component({ renderTo: document.body });
    const plugin = new ResponsivePlugin({
      responsiveConfig: {
        '(max-width: 599px)': { cls: 'mobile' },
        '(min-width: 600px)': { cls: 'desktop' },
      },
    });
    plugin.init(owner);

    // Trigger the desktop query to match
    setMediaMatch('(min-width: 600px)', true);
    setMediaMatch('(max-width: 599px)', false);

    expect(owner.hasCls('desktop')).toBe(true);
  });

  it('multiple responsive components with different breakpoints', () => {
    const a = new Component({ renderTo: document.body });
    const b = new Component({ renderTo: document.body });

    const pluginA = new ResponsivePlugin({
      responsiveConfig: {
        '(max-width: 400px)': { cls: 'small-a' },
        '(min-width: 401px)': { cls: 'large-a' },
      },
    });

    const pluginB = new ResponsivePlugin({
      responsiveConfig: {
        '(max-width: 800px)': { cls: 'small-b' },
        '(min-width: 801px)': { cls: 'large-b' },
      },
    });

    pluginA.init(a);
    pluginB.init(b);

    setMediaMatch('(min-width: 401px)', true);
    setMediaMatch('(min-width: 801px)', true);
    setMediaMatch('(max-width: 400px)', false);
    setMediaMatch('(max-width: 800px)', false);

    expect(a.hasCls('large-a')).toBe(true);
    expect(b.hasCls('large-b')).toBe(true);
  });

  it('applyConfig sets width/height on owner', () => {
    const owner = new Component({ renderTo: document.body });
    const plugin = new ResponsivePlugin({
      responsiveConfig: {
        '(max-width: 599px)': { width: 100, height: 50 },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).matchMedia = (query: string) => {
      const mql = createMockMatchMedia()(query);
      mediaQueries.get(query)!.matches = true;
      return mql;
    };

    plugin.init(owner);
    expect(owner.el!.style.width).toBe('100px');
    expect(owner.el!.style.height).toBe('50px');
  });

  it('applyConfig sets hidden state', () => {
    const owner = new Component({ renderTo: document.body });
    const plugin = new ResponsivePlugin({
      responsiveConfig: {
        '(max-width: 599px)': { hidden: true },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).matchMedia = (query: string) => {
      const mql = createMockMatchMedia()(query);
      mediaQueries.get(query)!.matches = true;
      return mql;
    };

    plugin.init(owner);
    expect(owner.isVisible()).toBe(false);
  });

  it('destroy cleans up media query listeners', () => {
    const owner = new Component({ renderTo: document.body });
    const plugin = new ResponsivePlugin({
      responsiveConfig: {
        '(max-width: 599px)': { cls: 'mobile' },
      },
    });
    plugin.init(owner);
    plugin.destroy();

    const mql = mediaQueries.get('(max-width: 599px)');
    expect(mql?.listeners.size).toBe(0);
  });

  it('expression-based config (width < 600 syntax) parsed to media query', () => {
    const owner = new Component({ renderTo: document.body });
    const plugin = new ResponsivePlugin({
      responsiveConfig: {
        'width < 600': { cls: 'narrow' },
      },
    });
    plugin.init(owner);
    // Should have created a matchMedia query
    expect(mediaQueries.size).toBeGreaterThan(0);
  });

  it('expression width > 600 parses to min-width: 601px', () => {
    const owner = new Component({ renderTo: document.body });
    const plugin = new ResponsivePlugin({
      responsiveConfig: { 'width > 600': { cls: 'wide' } },
    });
    plugin.init(owner);
    expect(mediaQueries.has('(min-width: 601px)')).toBe(true);
  });

  it('expression width <= 800 parses to max-width: 800px', () => {
    const owner = new Component({ renderTo: document.body });
    const plugin = new ResponsivePlugin({
      responsiveConfig: { 'width <= 800': { cls: 'compact' } },
    });
    plugin.init(owner);
    expect(mediaQueries.has('(max-width: 800px)')).toBe(true);
  });

  it('expression width == 1024 parses to width: 1024px', () => {
    const owner = new Component({ renderTo: document.body });
    const plugin = new ResponsivePlugin({
      responsiveConfig: { 'width == 1024': { cls: 'exact' } },
    });
    plugin.init(owner);
    expect(mediaQueries.has('(width: 1024px)')).toBe(true);
  });

  it('compound expression with && produces combined media query', () => {
    const owner = new Component({ renderTo: document.body });
    const plugin = new ResponsivePlugin({
      responsiveConfig: { 'width >= 600 && width < 1024': { cls: 'tablet' } },
    });
    plugin.init(owner);
    expect(mediaQueries.has('(min-width: 600px) and (max-width: 1023px)')).toBe(true);
  });

  it('media change removing match removes cls', () => {
    const owner = new Component({ renderTo: document.body });

    // Start with match
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).matchMedia = (query: string) => {
      const mql = createMockMatchMedia()(query);
      mediaQueries.get(query)!.matches = true;
      return mql;
    };

    const plugin = new ResponsivePlugin({
      responsiveConfig: { '(max-width: 599px)': { cls: 'mobile' } },
    });
    plugin.init(owner);
    expect(owner.hasCls('mobile')).toBe(true);

    // Trigger no-match
    setMediaMatch('(max-width: 599px)', false);
    expect(owner.hasCls('mobile')).toBe(false);
  });

  it('applyConfig sets disabled', () => {
    const owner = new Component({ renderTo: document.body });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).matchMedia = (query: string) => {
      const mql = createMockMatchMedia()(query);
      mediaQueries.get(query)!.matches = true;
      return mql;
    };
    const plugin = new ResponsivePlugin({
      responsiveConfig: { '(max-width: 599px)': { disabled: true } },
    });
    plugin.init(owner);
    expect(owner.isDisabled()).toBe(true);
  });

  it('applyConfig sets arbitrary config property', () => {
    const owner = new Component({ renderTo: document.body });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).matchMedia = (query: string) => {
      const mql = createMockMatchMedia()(query);
      mediaQueries.get(query)!.matches = true;
      return mql;
    };
    const plugin = new ResponsivePlugin({
      responsiveConfig: { '(max-width: 599px)': { columns: 1 } },
    });
    plugin.init(owner);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((owner as any)._config.columns).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ResponsiveColumnLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('ResponsiveColumnLayout', () => {
  it('has type "responsivecolumn"', () => {
    const layout = new ResponsiveColumnLayout({ minColumnWidth: 200 });
    expect(layout.type).toBe('responsivecolumn');
  });

  it('container uses CSS grid', () => {
    const ct = new Container({ renderTo: document.body });
    const layout = new ResponsiveColumnLayout({ minColumnWidth: 200 });
    layout.setOwner(ct);
    layout.configureContainer(ct.getBodyEl());
    expect(ct.getBodyEl().style.display).toBe('grid');
  });

  it('sets grid-template-columns with auto-fill and minColumnWidth', () => {
    const ct = new Container({ renderTo: document.body });
    const layout = new ResponsiveColumnLayout({ minColumnWidth: 250 });
    layout.setOwner(ct);
    layout.configureContainer(ct.getBodyEl());
    expect(ct.getBodyEl().style.gridTemplateColumns).toContain('250px');
    expect(ct.getBodyEl().style.gridTemplateColumns).toContain('auto-fill');
  });

  it('gap sets CSS gap property', () => {
    const ct = new Container({ renderTo: document.body });
    const layout = new ResponsiveColumnLayout({ minColumnWidth: 200, gap: 16 });
    layout.setOwner(ct);
    layout.configureContainer(ct.getBodyEl());
    expect(ct.getBodyEl().style.gap).toBe('16px');
  });

  it('maxColumns limits the number of columns', () => {
    const ct = new Container({ renderTo: document.body });
    const layout = new ResponsiveColumnLayout({ minColumnWidth: 100, maxColumns: 3 });
    layout.setOwner(ct);
    layout.configureContainer(ct.getBodyEl());
    const cols = ct.getBodyEl().style.gridTemplateColumns;
    expect(cols).toContain('3');
  });

  it('items with columnSpan span multiple columns', () => {
    const ct = new Container({ renderTo: document.body });
    const layout = new ResponsiveColumnLayout({ minColumnWidth: 200 });
    layout.setOwner(ct);
    layout.configureContainer(ct.getBodyEl());

    const wide = cmp({ columnSpan: 2, html: 'wide' });
    const normal = cmp({ html: 'normal' });
    ct.add(wide, normal);
    layout.applyItemStyles(ct.getItems(), ct.getBodyEl());

    expect(wide.el!.style.gridColumn).toBe('span 2');
    expect(normal.el!.style.gridColumn).toBe('');
  });

  it('renderItems configures and styles', () => {
    const ct = new Container({ renderTo: document.body });
    const layout = new ResponsiveColumnLayout({ minColumnWidth: 150, gap: 8 });
    layout.setOwner(ct);
    const items = [cmp({ html: 'A' }), cmp({ html: 'B' })];
    layout.renderItems(items, ct.getBodyEl());
    expect(ct.getBodyEl().style.display).toBe('grid');
    expect(ct.getBodyEl().style.gap).toBe('8px');
    expect(items[0].rendered).toBe(true);
  });

  it('default gap is 0', () => {
    const ct = new Container({ renderTo: document.body });
    const layout = new ResponsiveColumnLayout({ minColumnWidth: 200 });
    layout.setOwner(ct);
    layout.configureContainer(ct.getBodyEl());
    expect(ct.getBodyEl().style.gap).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LayoutRunner — ResizeObserver integration
// ═══════════════════════════════════════════════════════════════════════════

describe('LayoutRunner — ResizeObserver integration', () => {
  it('observe() starts watching an element', () => {
    const runner = LayoutRunner.getInstance();
    runner.clear();
    const el = document.createElement('div');
    document.body.appendChild(el);

    const ct = new Container({ renderTo: document.body });
    runner.observe(ct, el);

    const ro = MockRO.instances[MockRO.instances.length - 1];
    expect(ro.observed).toContain(el);
  });

  it('ResizeObserver callback invalidates the component', () => {
    const runner = LayoutRunner.getInstance();
    runner.clear();

    const ct = new Container({ renderTo: document.body });
    const el = ct.getBodyEl();
    runner.observe(ct, el);

    // Trigger resize
    const ro = MockRO.instances[MockRO.instances.length - 1];
    ro.trigger([{ target: el, contentRect: { width: 500, height: 300 } as DOMRectReadOnly }]);

    expect(runner.isPending(ct)).toBe(true);
  });

  it('unobserve() stops watching', () => {
    const runner = LayoutRunner.getInstance();
    runner.clear();
    const el = document.createElement('div');
    document.body.appendChild(el);

    const ct = new Container({ renderTo: document.body });
    runner.observe(ct, el);
    runner.unobserve(ct, el);

    const ro = MockRO.instances[MockRO.instances.length - 1];
    expect(ro.observed).not.toContain(el);
  });

  it('debounces rapid resize events into single layout run', () => {
    const runner = LayoutRunner.getInstance();
    runner.clear();

    const ct = new Container({ renderTo: document.body });
    const el = ct.getBodyEl();
    runner.observe(ct, el);

    const ro = MockRO.instances[MockRO.instances.length - 1];

    // Fire multiple rapid resizes — each adds to pending set
    ro.trigger([{ target: el, contentRect: { width: 100, height: 100 } as DOMRectReadOnly }]);
    ro.trigger([{ target: el, contentRect: { width: 200, height: 200 } as DOMRectReadOnly }]);
    ro.trigger([{ target: el, contentRect: { width: 300, height: 300 } as DOMRectReadOnly }]);

    // Component should only be pending once (Set deduplicates)
    expect(runner.isPending(ct)).toBe(true);

    // Run flushes the single pending entry
    runner.run();
    expect(runner.isPending(ct)).toBe(false);
  });

  it('observe is idempotent for same component+element', () => {
    const runner = LayoutRunner.getInstance();
    runner.clear();
    const ct = new Container({ renderTo: document.body });
    const el = ct.getBodyEl();

    const countBefore = MockRO.instances.length;
    runner.observe(ct, el);
    runner.observe(ct, el); // duplicate
    // Only one new observer should be created
    expect(MockRO.instances.length).toBe(countBefore + 1);
  });

  it('unobserve on non-observed element is a no-op', () => {
    const runner = LayoutRunner.getInstance();
    runner.clear();
    const ct = new Container({ renderTo: document.body });
    const el = document.createElement('div');
    // Should not throw
    expect(() => runner.unobserve(ct, el)).not.toThrow();
  });
});
