/**
 * app.test.ts
 *
 * TDD suite for the Anchor Layout Demo  (written before the implementation).
 *
 * Tests are ordered from the smallest observable unit outward:
 *   1.  Application lifecycle    — name, singleton, start() hook order
 *   2.  Layout assignment        — 'anchor' alias, object form, position:relative on body
 *   3.  Anchor value parsing     — %, negative-offset, width-only, unanchored items
 *   4.  Child A — 100% × 20%    — percentage dimensions applied correctly
 *   5.  Child B — 100% × -50    — calc-based height applied correctly
 *   6.  Child C — nested anchor  — outer + inner anchor CSS applied in correct order
 *   7.  Component presence       — getItems(), rendered state, getAt()
 *   8.  Framework integrity      — no raw semantic HTML outside component rendering
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@framesquared/app';
import { Panel } from '@framesquared/ui';
import { AnchorLayout } from '@framesquared/layout';

// Side-effect import registers all layout aliases, including 'anchor'.
import '@framesquared/layout';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Render a Panel into the test host, return its body element. */
function renderPanel(panel: Panel, host: HTMLElement): HTMLElement {
  panel.render(host);
  return panel.getBodyEl() as HTMLElement;
}

/**
 * Build and render an anchor-layout container.
 * Returns { panel, body, items }.
 */
function makeAnchor(
  items: Panel[],
  host: HTMLElement,
  extra: Record<string, unknown> = {},
): { panel: Panel; body: HTMLElement; items: Panel[] } {
  const panel = new Panel({ layout: 'anchor', ...extra, items });
  const body = renderPanel(panel, host);
  return { panel, body, items };
}

/** Shorthand: a Panel with a given anchor string. */
function anchoredPanel(anchor: string, extra: Record<string, unknown> = {}): Panel {
  return new Panel({ title: `anchor:${anchor}`, anchor, ...extra });
}

// ── Test host setup ───────────────────────────────────────────────────────────

let host: HTMLDivElement;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  Application.clearInstance();
});

afterEach(() => {
  host.remove();
  Application.clearInstance();
});

// ════════════════════════════════════════════════════════════════════════════
// 1. Application lifecycle
// ════════════════════════════════════════════════════════════════════════════

describe('Application lifecycle', () => {
  it('can be instantiated with the demo name', () => {
    const app = new Application({ name: 'AnchorLayoutDemo' });
    expect(app.getName()).toBe('AnchorLayoutDemo');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'AnchorLayoutDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'AnchorLayoutDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'AnchorLayoutDemo',
      launch: () => order.push('launch'),
    });
    app.onInit    = () => order.push('onInit');
    app.onBeforeLaunch = () => order.push('onBeforeLaunch');
    app.onLaunch  = () => order.push('onLaunch');
    app.start();
    expect(order).toEqual(['onInit', 'onBeforeLaunch', 'launch', 'onLaunch']);
  });

  it('launch() is overridable in a subclass', () => {
    let launched = false;
    class AnchorApp extends Application {
      constructor() { super({ name: 'AnchorLayoutDemo' }); }
      override launch(): void { launched = true; }
    }
    new AnchorApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Layout assignment
// ════════════════════════════════════════════════════════════════════════════

describe('Layout assignment', () => {
  it('string alias "anchor" resolves to an AnchorLayout instance', () => {
    const panel = new Panel({ layout: 'anchor' });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(AnchorLayout);
  });

  it('object form { type: "anchor" } resolves to an AnchorLayout instance', () => {
    const panel = new Panel({ layout: { type: 'anchor' } });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(AnchorLayout);
  });

  it('layout.type is "anchor"', () => {
    const panel = new Panel({ layout: { type: 'anchor' } });
    panel.render(host);
    expect(panel.getLayout().type).toBe('anchor');
  });

  it('container body has position: relative after render', () => {
    const { body } = makeAnchor([], host);
    expect(body.style.position).toBe('relative');
  });

  it('position: relative is idempotent across multiple renderItems calls', () => {
    const { body } = makeAnchor([anchoredPanel('50%'), anchoredPanel('75%')], host);
    // Adding items individually re-calls configureContainer — should remain relative
    expect(body.style.position).toBe('relative');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Anchor value parsing
// ════════════════════════════════════════════════════════════════════════════

describe('Anchor value parsing', () => {
  it('"100% 20%" sets width: 100% and height: 20%', () => {
    const child = anchoredPanel('100% 20%');
    makeAnchor([child], host);
    expect(child.el!.style.width).toBe('100%');
    expect(child.el!.style.height).toBe('20%');
  });

  it('"100% -50" sets width: 100% and height: calc(100% - 50px)', () => {
    const child = anchoredPanel('100% -50');
    makeAnchor([child], host);
    expect(child.el!.style.width).toBe('100%');
    expect(child.el!.style.height).toBe('calc(100% - 50px)');
  });

  it('"75% 30%" sets width: 75% and height: 30%', () => {
    const child = anchoredPanel('75% 30%');
    makeAnchor([child], host);
    expect(child.el!.style.width).toBe('75%');
    expect(child.el!.style.height).toBe('30%');
  });

  it('"100%" (width-only) sets width: 100% and leaves height unchanged', () => {
    const child = anchoredPanel('100%');
    makeAnchor([child], host);
    expect(child.el!.style.width).toBe('100%');
    expect(child.el!.style.height).toBe('');
  });

  it('"-50 -100" sets width: calc(100% - 50px) and height: calc(100% - 100px)', () => {
    const child = anchoredPanel('-50 -100');
    makeAnchor([child], host);
    expect(child.el!.style.width).toBe('calc(100% - 50px)');
    expect(child.el!.style.height).toBe('calc(100% - 100px)');
  });

  it('"-200" (width offset only) sets width: calc(100% - 200px)', () => {
    const child = anchoredPanel('-200');
    makeAnchor([child], host);
    expect(child.el!.style.width).toBe('calc(100% - 200px)');
    expect(child.el!.style.height).toBe('');
  });

  it('item without an anchor string has no width or height override', () => {
    const child = new Panel({ title: 'no-anchor', width: 200, height: 100 });
    makeAnchor([child], host);
    // AnchorLayout must not clobber an explicit config when anchor is absent
    expect(child.el!.style.width).toBe('200px');
    expect(child.el!.style.height).toBe('100px');
  });

  it('mixed siblings — anchored and non-anchored — each get the correct styles', () => {
    const anchored    = anchoredPanel('50%');
    const unanchored  = new Panel({ width: 120 });
    makeAnchor([anchored, unanchored], host);
    expect(anchored.el!.style.width).toBe('50%');
    expect(unanchored.el!.style.width).toBe('120px');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Child A — 100% width, 20% height
// ════════════════════════════════════════════════════════════════════════════

describe('Child A — anchor "100% 20%"', () => {
  it('el.style.width is "100%"', () => {
    const childA = anchoredPanel('100% 20%');
    makeAnchor([childA], host);
    expect(childA.el!.style.width).toBe('100%');
  });

  it('el.style.height is "20%"', () => {
    const childA = anchoredPanel('100% 20%');
    makeAnchor([childA], host);
    expect(childA.el!.style.height).toBe('20%');
  });

  it('width "100%" is a CSS percentage — browser will scale it with the container', () => {
    const childA = anchoredPanel('100% 20%');
    makeAnchor([childA], host);
    // The value is a percentage string, not a fixed pixel value
    expect(childA.el!.style.width.endsWith('%')).toBe(true);
    expect(childA.el!.style.height.endsWith('%')).toBe(true);
  });

  it('child is rendered and has a live element reference', () => {
    const childA = anchoredPanel('100% 20%');
    makeAnchor([childA], host);
    expect(childA.rendered).toBe(true);
    expect(childA.el).not.toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Child B — 100% width, calc(100% - 50px) height
// ════════════════════════════════════════════════════════════════════════════

describe('Child B — anchor "100% -50"', () => {
  it('el.style.width is "100%"', () => {
    const childB = anchoredPanel('100% -50');
    makeAnchor([childB], host);
    expect(childB.el!.style.width).toBe('100%');
  });

  it('el.style.height is "calc(100% - 50px)"', () => {
    const childB = anchoredPanel('100% -50');
    makeAnchor([childB], host);
    expect(childB.el!.style.height).toBe('calc(100% - 50px)');
  });

  it('height uses calc() — the 50px offset is subtracted from the container height', () => {
    const childB = anchoredPanel('100% -50');
    makeAnchor([childB], host);
    expect(childB.el!.style.height).toContain('calc(');
    expect(childB.el!.style.height).toContain('- 50px');
  });

  it('a larger negative offset (-120) produces calc(100% - 120px)', () => {
    const child = anchoredPanel('100% -120');
    makeAnchor([child], host);
    expect(child.el!.style.height).toBe('calc(100% - 120px)');
  });

  it('child is rendered and has a live element reference', () => {
    const childB = anchoredPanel('100% -50');
    makeAnchor([childB], host);
    expect(childB.rendered).toBe(true);
    expect(childB.el).not.toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Child C — nested anchor panel (75% × 30%) with inner anchor (100% × 100%)
// ════════════════════════════════════════════════════════════════════════════

describe('Child C — nested anchor layout', () => {
  function makeNested(host: HTMLElement): {
    outerPanel: Panel;
    childC: Panel;
    innerPanel: Panel;
  } {
    const innerPanel = new Panel({
      title: 'Inner — anchor "100% 100%"',
      anchor: '100% 100%',
    });

    const childC = new Panel({
      title: 'Child C — anchor "75% 30%"',
      anchor: '75% 30%',
      layout: 'anchor',
      items: [innerPanel],
    });

    const outerPanel = new Panel({
      layout: 'anchor',
      items: [childC],
    });

    outerPanel.render(host);
    return { outerPanel, childC, innerPanel };
  }

  it('outer anchor canvas applies "75%" width to Child C', () => {
    const { childC } = makeNested(host);
    expect(childC.el!.style.width).toBe('75%');
  });

  it('outer anchor canvas applies "30%" height to Child C', () => {
    const { childC } = makeNested(host);
    expect(childC.el!.style.height).toBe('30%');
  });

  it("Child C's own anchor layout applies \"100%\" width to the inner panel", () => {
    const { innerPanel } = makeNested(host);
    expect(innerPanel.el!.style.width).toBe('100%');
  });

  it("Child C's own anchor layout applies \"100%\" height to the inner panel", () => {
    const { innerPanel } = makeNested(host);
    expect(innerPanel.el!.style.height).toBe('100%');
  });

  it("Child C's body has position: relative — its own AnchorLayout configures it", () => {
    const { childC } = makeNested(host);
    expect(childC.getBodyEl().style.position).toBe('relative');
  });

  it('inner panel is fully rendered inside Child C', () => {
    const { innerPanel } = makeNested(host);
    expect(innerPanel.rendered).toBe(true);
    expect(innerPanel.el).not.toBeNull();
  });

  it('inner panel el is a descendant of Child C el', () => {
    const { childC, innerPanel } = makeNested(host);
    expect(childC.el!.contains(innerPanel.el!)).toBe(true);
  });

  it('outer and inner anchor widths are expressed as CSS percentages for CSS-driven resizing', () => {
    const { childC, innerPanel } = makeNested(host);
    // Percentages mean the browser recomputes on every layout — no JS listener needed
    expect(childC.el!.style.width.endsWith('%')).toBe(true);
    expect(innerPanel.el!.style.width.endsWith('%')).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Component presence
// ════════════════════════════════════════════════════════════════════════════

describe('Component presence', () => {
  it('container reports the correct child count via getItems()', () => {
    const { panel } = makeAnchor(
      [anchoredPanel('100% 20%'), anchoredPanel('100% -50'), anchoredPanel('75% 30%')],
      host,
    );
    expect(panel.getItems().length).toBe(3);
  });

  it('all three children are rendered into the DOM after container renders', () => {
    const a = anchoredPanel('100% 20%');
    const b = anchoredPanel('100% -50');
    const c = anchoredPanel('75% 30%');
    makeAnchor([a, b, c], host);
    for (const child of [a, b, c]) {
      expect(child.rendered).toBe(true);
      expect(child.el).not.toBeNull();
    }
  });

  it('getAt() returns the panel at the given index', () => {
    const a = anchoredPanel('100% 20%');
    const b = anchoredPanel('100% -50');
    const c = anchoredPanel('75% 30%');
    const { panel } = makeAnchor([a, b, c], host);
    expect(panel.getAt(0)).toBe(a);
    expect(panel.getAt(1)).toBe(b);
    expect(panel.getAt(2)).toBe(c);
  });

  it('children carry their anchor string in _config', () => {
    const a = anchoredPanel('100% 20%');
    const b = anchoredPanel('100% -50');
    makeAnchor([a, b], host);
    expect((a as any)._config.anchor).toBe('100% 20%');
    expect((b as any)._config.anchor).toBe('100% -50');
  });

  it('the anchor canvas itself has layout type "anchor"', () => {
    const { panel } = makeAnchor([], host);
    expect(panel.getLayout().type).toBe('anchor');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Framework integrity — no raw HTML injection
// ════════════════════════════════════════════════════════════════════════════

describe('Framework integrity — no raw HTML injection', () => {
  function renderFullDemo(host: HTMLElement): void {
    const innerPanel = new Panel({ title: 'Inner', anchor: '100% 100%' });
    const childC = new Panel({
      title: 'Child C',
      anchor: '75% 30%',
      layout: 'anchor',
      items: [innerPanel],
    });
    makeAnchor(
      [anchoredPanel('100% 20%'), anchoredPanel('100% -50'), childC],
      host,
    );
  }

  it('all direct children of the host are framework component elements (x-component)', () => {
    renderFullDemo(host);
    for (const child of Array.from(host.children)) {
      expect(child.classList.contains('x-component')).toBe(true);
    }
  });

  it('contains no raw block-level semantic elements (p, h1–h6, ul, ol, li, table)', () => {
    renderFullDemo(host);
    const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th'];
    for (const tag of blockTags) {
      expect(
        host.querySelectorAll(tag).length,
        `unexpected <${tag}> found — raw HTML may have been injected`,
      ).toBe(0);
    }
  });

  it('contains no raw form or interactive elements (form, input, select, textarea)', () => {
    renderFullDemo(host);
    for (const tag of ['form', 'input', 'select', 'textarea']) {
      expect(host.querySelectorAll(tag).length, `unexpected <${tag}> found`).toBe(0);
    }
  });

  it('every <span> in the subtree carries an x-* framework class', () => {
    renderFullDemo(host);
    for (const span of Array.from(host.querySelectorAll('span'))) {
      const hasXClass = Array.from(span.classList).some((c) => c.startsWith('x-'));
      expect(hasXClass, `<span class="${span.className}"> has no x-* class`).toBe(true);
    }
  });
});
