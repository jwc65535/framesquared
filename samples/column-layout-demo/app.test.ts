/**
 * app.test.ts
 *
 * TDD suite for the Column Layout Demo  (written before the implementation).
 *
 * Tests are ordered from the smallest observable unit outward:
 *   1.  Application lifecycle      — name, singleton, start() hook order
 *   2.  Layout assignment          — 'column' alias, object form, flex container styles
 *   3.  Fixed column (A)           — pixel width, flexShrink, immutability on resize
 *   4.  Fluid columns (B and C)    — remaining-space distribution, pixel widths
 *   5.  Width sum invariant        — A + B + C always equals the container width
 *   6.  Resize behaviour           — fluid columns recompute; fixed column is stable
 *   7.  Nested panel content       — inner Panels rendered without raw HTML
 *   8.  Framework integrity        — no raw semantic elements outside components
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@framesquared/app';
import { Panel } from '@framesquared/ui';
import { ColumnLayout } from '@framesquared/layout';

// Side-effect import registers all layout aliases, including 'column'.
import '@framesquared/layout';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPanel(panel: Panel, host: HTMLElement): HTMLElement {
  panel.render(host);
  return panel.getBodyEl() as HTMLElement;
}

/**
 * Build and render the three-column demo container.
 * Returns references to the container and each child panel.
 */
function makeColumnContainer(host: HTMLElement): {
  container: Panel;
  body: HTMLElement;
  childA: Panel;
  childB: Panel;
  childC: Panel;
} {
  const childA = new Panel({ title: 'Column A (fixed)', width: 200 });
  const childB = new Panel({ title: 'Column B (fluid)', columnWidth: 0.5 });
  const childC = new Panel({ title: 'Column C (fluid)', columnWidth: 0.5 });

  const container = new Panel({
    layout: 'column',
    items: [childA, childB, childC],
  });

  const body = renderPanel(container, host);
  return { container, body, childA, childB, childC };
}

/** Parse a "Npx" style string to an integer. */
function px(styleValue: string): number {
  return parseInt(styleValue, 10);
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
    const app = new Application({ name: 'ColumnLayoutDemo' });
    expect(app.getName()).toBe('ColumnLayoutDemo');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'ColumnLayoutDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'ColumnLayoutDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'ColumnLayoutDemo',
      launch: () => order.push('launch'),
    });
    app.onInit        = () => order.push('onInit');
    app.onBeforeLaunch = () => order.push('onBeforeLaunch');
    app.onLaunch      = () => order.push('onLaunch');
    app.start();
    expect(order).toEqual(['onInit', 'onBeforeLaunch', 'launch', 'onLaunch']);
  });

  it('launch() is overridable in a subclass', () => {
    let launched = false;
    class ColApp extends Application {
      constructor() { super({ name: 'ColumnLayoutDemo' }); }
      override launch(): void { launched = true; }
    }
    new ColApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Layout assignment
// ════════════════════════════════════════════════════════════════════════════

describe('Layout assignment', () => {
  it('string alias "column" resolves to a ColumnLayout instance', () => {
    const panel = new Panel({ layout: 'column' });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(ColumnLayout);
  });

  it('object form { type: "column" } resolves to a ColumnLayout instance', () => {
    const panel = new Panel({ layout: { type: 'column' } });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(ColumnLayout);
  });

  it('layout.type is "column"', () => {
    const panel = new Panel({ layout: { type: 'column' } });
    panel.render(host);
    expect(panel.getLayout().type).toBe('column');
  });

  it('container body has display: flex', () => {
    const { body } = makeColumnContainer(host);
    expect(body.style.display).toBe('flex');
  });

  it('container body has flex-wrap: wrap', () => {
    const { body } = makeColumnContainer(host);
    expect(body.style.flexWrap).toBe('wrap');
  });

  it('container body has align-items: flex-start', () => {
    const { body } = makeColumnContainer(host);
    expect(body.style.alignItems).toBe('flex-start');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Fixed column (A)
// ════════════════════════════════════════════════════════════════════════════

describe('Fixed column A (width: 200)', () => {
  it('has el.style.width of "200px"', () => {
    const { childA } = makeColumnContainer(host);
    expect(childA.el!.style.width).toBe('200px');
  });

  it('has flex-shrink: 0 so it cannot be compressed by flex', () => {
    const { childA } = makeColumnContainer(host);
    expect(childA.el!.style.flexShrink).toBe('0');
  });

  it('width is preserved in _config', () => {
    const { childA } = makeColumnContainer(host);
    expect((childA as any)._config.width).toBe(200);
  });

  it('width remains 200px after the container is resized to 600px', () => {
    const { container, childA } = makeColumnContainer(host);
    (container as any).doLayoutWithWidth(600);
    expect(childA.el!.style.width).toBe('200px');
  });

  it('width remains 200px after the container is resized to 1400px', () => {
    const { container, childA } = makeColumnContainer(host);
    (container as any).doLayoutWithWidth(1400);
    expect(childA.el!.style.width).toBe('200px');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Fluid columns (B and C)
// ════════════════════════════════════════════════════════════════════════════

describe('Fluid columns B and C (columnWidth: 0.5 each)', () => {
  it('B has columnWidth 0.5 stored in _config', () => {
    const { childB } = makeColumnContainer(host);
    expect((childB as any)._config.columnWidth).toBe(0.5);
  });

  it('C has columnWidth 0.5 stored in _config', () => {
    const { childC } = makeColumnContainer(host);
    expect((childC as any)._config.columnWidth).toBe(0.5);
  });

  it('B and C each receive half the remaining space at 1000px container', () => {
    const { container, childB, childC } = makeColumnContainer(host);
    (container as any).doLayoutWithWidth(1000);
    // remaining = 1000 - 200 = 800; each gets 400
    expect(childB.el!.style.width).toBe('400px');
    expect(childC.el!.style.width).toBe('400px');
  });

  it('B and C are equal width (symmetric columnWidth: 0.5)', () => {
    const { container, childB, childC } = makeColumnContainer(host);
    (container as any).doLayoutWithWidth(1200);
    expect(childB.el!.style.width).toBe(childC.el!.style.width);
  });

  it('B and C have box-sizing: border-box', () => {
    const { container, childB, childC } = makeColumnContainer(host);
    (container as any).doLayoutWithWidth(1000);
    expect(childB.el!.style.boxSizing).toBe('border-box');
    expect(childC.el!.style.boxSizing).toBe('border-box');
  });

  it('B and C have flex-shrink: 0', () => {
    const { container, childB, childC } = makeColumnContainer(host);
    (container as any).doLayoutWithWidth(1000);
    expect(childB.el!.style.flexShrink).toBe('0');
    expect(childC.el!.style.flexShrink).toBe('0');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Width-sum invariant  (Test 2 from the spec)
// ════════════════════════════════════════════════════════════════════════════

describe('Width-sum invariant: A + B + C === container width', () => {
  it('sums to 1000px at a 1000px container', () => {
    const { container, childA, childB, childC } = makeColumnContainer(host);
    (container as any).doLayoutWithWidth(1000);
    const sum = px(childA.el!.style.width) + px(childB.el!.style.width) + px(childC.el!.style.width);
    expect(sum).toBe(1000);
  });

  it('sums to 800px at an 800px container', () => {
    const { container, childA, childB, childC } = makeColumnContainer(host);
    (container as any).doLayoutWithWidth(800);
    const sum = px(childA.el!.style.width) + px(childB.el!.style.width) + px(childC.el!.style.width);
    expect(sum).toBe(800);
  });

  it('sums to 1400px at a 1400px container', () => {
    const { container, childA, childB, childC } = makeColumnContainer(host);
    (container as any).doLayoutWithWidth(1400);
    const sum = px(childA.el!.style.width) + px(childB.el!.style.width) + px(childC.el!.style.width);
    expect(sum).toBe(1400);
  });

  it('fluid widths are zero when container equals the fixed column width', () => {
    const { container, childB, childC } = makeColumnContainer(host);
    (container as any).doLayoutWithWidth(200);
    expect(px(childB.el!.style.width)).toBe(0);
    expect(px(childC.el!.style.width)).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Resize behaviour  (Test 3 from the spec)
// ════════════════════════════════════════════════════════════════════════════

describe('Resize behaviour', () => {
  it('fluid columns shrink when the container narrows from 1000px to 600px', () => {
    const { container, childB, childC } = makeColumnContainer(host);

    (container as any).doLayoutWithWidth(1000);
    const wideBefore = px(childB.el!.style.width); // 400px

    (container as any).doLayoutWithWidth(600);
    const wideAfter = px(childB.el!.style.width);  // 200px

    expect(wideAfter).toBeLessThan(wideBefore);
    expect(childB.el!.style.width).toBe('200px');
    expect(childC.el!.style.width).toBe('200px');
  });

  it('fluid columns grow when the container widens from 1000px to 1400px', () => {
    const { container, childB, childC } = makeColumnContainer(host);

    (container as any).doLayoutWithWidth(1000);
    const narrowB = px(childB.el!.style.width); // 400px

    (container as any).doLayoutWithWidth(1400);
    const wideB = px(childB.el!.style.width);   // 600px

    expect(wideB).toBeGreaterThan(narrowB);
    expect(childB.el!.style.width).toBe('600px');
    expect(childC.el!.style.width).toBe('600px');
  });

  it('fixed column A is unchanged after multiple resize cycles', () => {
    const { container, childA } = makeColumnContainer(host);

    for (const w of [400, 800, 1200, 600, 1000]) {
      (container as any).doLayoutWithWidth(w);
      expect(childA.el!.style.width).toBe('200px');
    }
  });

  it('fluid and fixed widths remain consistent after doLayoutWithWidth', () => {
    const { container, childA, childB, childC } = makeColumnContainer(host);
    const containerWidth = 900;
    (container as any).doLayoutWithWidth(containerWidth);

    expect(childA.el!.style.width).toBe('200px');
    // remaining = 900 - 200 = 700; each fluid gets 350
    expect(childB.el!.style.width).toBe('350px');
    expect(childC.el!.style.width).toBe('350px');

    const sum = px(childA.el!.style.width) + px(childB.el!.style.width) + px(childC.el!.style.width);
    expect(sum).toBe(containerWidth);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Nested panel content
// ════════════════════════════════════════════════════════════════════════════

describe('Nested panel content', () => {
  it('each column child is rendered and has a live element', () => {
    const { childA, childB, childC } = makeColumnContainer(host);
    for (const child of [childA, childB, childC]) {
      expect(child.rendered).toBe(true);
      expect(child.el).not.toBeNull();
    }
  });

  it('container reports 3 children via getItems()', () => {
    const { container } = makeColumnContainer(host);
    expect(container.getItems().length).toBe(3);
  });

  it('getAt() returns children in insertion order', () => {
    const { container, childA, childB, childC } = makeColumnContainer(host);
    expect(container.getAt(0)).toBe(childA);
    expect(container.getAt(1)).toBe(childB);
    expect(container.getAt(2)).toBe(childC);
  });

  it('a Panel nested inside a column child renders correctly', () => {
    const inner = new Panel({ title: 'Inner Content' });
    const column = new Panel({
      layout: 'column',
      items: [new Panel({ width: 300, items: [inner] })],
    });
    column.render(host);
    expect(inner.rendered).toBe(true);
    expect(inner.el).not.toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Framework integrity — no raw HTML injection
// ════════════════════════════════════════════════════════════════════════════

describe('Framework integrity — no raw HTML injection', () => {
  it('all direct children of the host are framework component elements', () => {
    makeColumnContainer(host);
    for (const child of Array.from(host.children)) {
      expect(child.classList.contains('x-component')).toBe(true);
    }
  });

  it('contains no raw block-level semantic elements (p, h1–h6, ul, ol, li, table)', () => {
    makeColumnContainer(host);
    const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th'];
    for (const tag of blockTags) {
      expect(
        host.querySelectorAll(tag).length,
        `unexpected <${tag}> element — raw HTML may have been injected`,
      ).toBe(0);
    }
  });

  it('contains no raw form or interactive elements (form, input, select, textarea)', () => {
    makeColumnContainer(host);
    for (const tag of ['form', 'input', 'select', 'textarea']) {
      expect(host.querySelectorAll(tag).length, `unexpected <${tag}>`).toBe(0);
    }
  });

  it('every <span> in the subtree carries an x-* framework class', () => {
    makeColumnContainer(host);
    for (const span of Array.from(host.querySelectorAll('span'))) {
      const hasXClass = Array.from(span.classList).some((c) => c.startsWith('x-'));
      expect(hasXClass, `<span class="${span.className}"> has no x-* class`).toBe(true);
    }
  });
});
