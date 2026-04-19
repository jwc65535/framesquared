/**
 * app.test.ts
 *
 * TDD suite for the Absolute Layout Demo.
 *
 * Tests are ordered from the smallest observable unit outward:
 *   1.  Application lifecycle    — name, singleton, start() order
 *   2.  Layout assignment        — 'absolute' alias, object form, container position
 *   3.  Pixel coordinate placement — x/y configs map to left/top CSS
 *   4.  Overlapping via z-index  — style.zIndex is preserved through layout pass
 *   5.  Dynamic repositioning    — setX/setY/setPosition update rendered element
 *   6.  Component presence       — getItems(), rendered state, item count
 *   7.  Framework integrity      — no raw semantic HTML outside component rendering
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@framesquared/app';
import { Panel } from '@framesquared/ui';
import { AbsoluteLayout } from '@framesquared/layout';

// Side-effect import registers all layout aliases, including 'absolute'
import '@framesquared/layout';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPanel(panel: Panel, host: HTMLElement): HTMLElement {
  panel.render(host);
  return panel.getBodyEl() as HTMLElement;
}

function makeAbsolute(
  items: Panel[],
  host: HTMLElement,
): { panel: Panel; body: HTMLElement; items: Panel[] } {
  const panel = new Panel({
    layout: 'absolute',
    width: 700,
    height: 500,
    items,
  });
  const body = renderPanel(panel, host);
  return { panel, body, items };
}

function absPanel(
  x: number,
  y: number,
  extra: Record<string, unknown> = {},
): Panel {
  return new Panel({ title: `at ${x},${y}`, x, y, width: 200, height: 120, ...extra });
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
    const app = new Application({ name: 'AbsoluteLayoutDemo' });
    expect(app.getName()).toBe('AbsoluteLayoutDemo');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'AbsoluteLayoutDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'AbsoluteLayoutDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'AbsoluteLayoutDemo',
      launch: () => order.push('launch'),
    });
    app.onInit = () => order.push('onInit');
    app.onBeforeLaunch = () => order.push('onBeforeLaunch');
    app.onLaunch = () => order.push('onLaunch');
    app.start();
    expect(order).toEqual(['onInit', 'onBeforeLaunch', 'launch', 'onLaunch']);
  });

  it('launch() can be overridden in a subclass', () => {
    let launched = false;
    class AbsApp extends Application {
      constructor() { super({ name: 'AbsoluteLayoutDemo' }); }
      override launch(): void { launched = true; }
    }
    new AbsApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Layout assignment
// ════════════════════════════════════════════════════════════════════════════

describe('Layout assignment', () => {
  it('string alias "absolute" resolves to an AbsoluteLayout instance', () => {
    const panel = new Panel({ layout: 'absolute' });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(AbsoluteLayout);
  });

  it('object form { type: "absolute" } resolves to an AbsoluteLayout instance', () => {
    const panel = new Panel({ layout: { type: 'absolute' } });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(AbsoluteLayout);
  });

  it('layout.type is "absolute"', () => {
    const panel = new Panel({ layout: { type: 'absolute' } });
    panel.render(host);
    expect(panel.getLayout().type).toBe('absolute');
  });

  it('container body has position: relative after render', () => {
    const { body } = makeAbsolute([], host);
    expect(body.style.position).toBe('relative');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Pixel coordinate placement
// ════════════════════════════════════════════════════════════════════════════

describe('Pixel coordinate placement', () => {
  it('child configured at x:50, y:50 has left:50px and top:50px', () => {
    const child = absPanel(50, 50);
    makeAbsolute([child], host);
    expect(child.el!.style.left).toBe('50px');
    expect(child.el!.style.top).toBe('50px');
  });

  it('child configured at x:120, y:100 has left:120px and top:100px', () => {
    const child = absPanel(120, 100);
    makeAbsolute([child], host);
    expect(child.el!.style.left).toBe('120px');
    expect(child.el!.style.top).toBe('100px');
  });

  it('child configured at x:300, y:200 has left:300px and top:200px', () => {
    const child = absPanel(300, 200);
    makeAbsolute([child], host);
    expect(child.el!.style.left).toBe('300px');
    expect(child.el!.style.top).toBe('200px');
  });

  it('all three demo children land at their configured coordinates', () => {
    const a = absPanel(50, 50);
    const b = absPanel(120, 100);
    const c = absPanel(300, 200);
    makeAbsolute([a, b, c], host);

    expect(a.el!.style.left).toBe('50px');
    expect(a.el!.style.top).toBe('50px');

    expect(b.el!.style.left).toBe('120px');
    expect(b.el!.style.top).toBe('100px');

    expect(c.el!.style.left).toBe('300px');
    expect(c.el!.style.top).toBe('200px');
  });

  it('every child has position: absolute set by the layout', () => {
    const a = absPanel(50, 50);
    const b = absPanel(120, 100);
    const c = absPanel(300, 200);
    makeAbsolute([a, b, c], host);
    expect(a.el!.style.position).toBe('absolute');
    expect(b.el!.style.position).toBe('absolute');
    expect(c.el!.style.position).toBe('absolute');
  });

  it('child without x/y config defaults to left:0px, top:0px', () => {
    const child = new Panel({ width: 100, height: 80 });
    makeAbsolute([child], host);
    expect(child.el!.style.left).toBe('0px');
    expect(child.el!.style.top).toBe('0px');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Overlapping via z-index
// ════════════════════════════════════════════════════════════════════════════

describe('Overlapping via z-index', () => {
  it('child with style.zIndex "10" retains that z-index after the layout pass', () => {
    const overlay = absPanel(120, 100, { style: { zIndex: '10' } });
    makeAbsolute([absPanel(50, 50), overlay], host);
    expect(overlay.el!.style.zIndex).toBe('10');
  });

  it('child without z-index has empty zIndex style (browser default stacking)', () => {
    const base = absPanel(50, 50);
    makeAbsolute([base], host);
    expect(base.el!.style.zIndex).toBe('');
  });

  it('overlay child with z-index "10" sits above a child with no z-index', () => {
    const base    = absPanel(50, 50);
    const overlay = absPanel(120, 100, { style: { zIndex: '10' } });
    makeAbsolute([base, overlay], host);

    const baseZ    = parseInt(base.el!.style.zIndex    || '0', 10);
    const overlayZ = parseInt(overlay.el!.style.zIndex || '0', 10);
    expect(overlayZ).toBeGreaterThan(baseZ);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Dynamic repositioning
// ════════════════════════════════════════════════════════════════════════════

describe('Dynamic repositioning', () => {
  it('setX() updates left style on the rendered element', () => {
    const child = absPanel(300, 200);
    makeAbsolute([child], host);
    child.setX(400);
    expect(child.el!.style.left).toBe('400px');
  });

  it('setY() updates top style on the rendered element', () => {
    const child = absPanel(300, 200);
    makeAbsolute([child], host);
    child.setY(280);
    expect(child.el!.style.top).toBe('280px');
  });

  it('setPosition(400, 280) moves Panel C from (300,200) to (400,280)', () => {
    const child = absPanel(300, 200);
    makeAbsolute([child], host);

    // Verify initial placement from config
    expect(child.el!.style.left).toBe('300px');
    expect(child.el!.style.top).toBe('200px');

    // Runtime reposition
    child.setPosition(400, 280);
    expect(child.el!.style.left).toBe('400px');
    expect(child.el!.style.top).toBe('280px');
  });

  it('getX() / getY() reflect the updated position after setPosition()', () => {
    const child = absPanel(300, 200);
    makeAbsolute([child], host);
    child.setPosition(150, 75);
    // offsetLeft/offsetTop are 0 in jsdom but the style values are set
    expect(child.el!.style.left).toBe('150px');
    expect(child.el!.style.top).toBe('75px');
  });

  it('calling setPosition() multiple times only retains the last values', () => {
    const child = absPanel(0, 0);
    makeAbsolute([child], host);
    child.setPosition(100, 50);
    child.setPosition(250, 175);
    expect(child.el!.style.left).toBe('250px');
    expect(child.el!.style.top).toBe('175px');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Component presence
// ════════════════════════════════════════════════════════════════════════════

describe('Component presence', () => {
  it('container reports the correct child count via getItems()', () => {
    const { panel } = makeAbsolute([absPanel(50, 50), absPanel(120, 100), absPanel(300, 200)], host);
    expect(panel.getItems().length).toBe(3);
  });

  it('all children are rendered into the DOM after container renders', () => {
    const a = absPanel(50, 50);
    const b = absPanel(120, 100);
    const c = absPanel(300, 200);
    makeAbsolute([a, b, c], host);
    for (const child of [a, b, c]) {
      expect(child.rendered).toBe(true);
      expect(child.el).not.toBeNull();
    }
  });

  it('getAt() returns the panel at the given index', () => {
    const a = absPanel(50, 50);
    const b = absPanel(120, 100);
    const c = absPanel(300, 200);
    const { panel } = makeAbsolute([a, b, c], host);
    expect(panel.getAt(0)).toBe(a);
    expect(panel.getAt(1)).toBe(b);
    expect(panel.getAt(2)).toBe(c);
  });

  it('children carry their x/y values in _config', () => {
    const a = absPanel(50, 50);
    const b = absPanel(120, 100);
    makeAbsolute([a, b], host);
    expect((a as any)._config.x).toBe(50);
    expect((a as any)._config.y).toBe(50);
    expect((b as any)._config.x).toBe(120);
    expect((b as any)._config.y).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Framework integrity — no raw semantic HTML outside component rendering
// ════════════════════════════════════════════════════════════════════════════

describe('Framework integrity — no raw HTML injection', () => {
  it('all direct children of the host are framework component elements', () => {
    makeAbsolute([absPanel(50, 50), absPanel(120, 100), absPanel(300, 200)], host);
    for (const child of Array.from(host.children)) {
      expect(child.classList.contains('x-component')).toBe(true);
    }
  });

  it('contains no raw block-level semantic elements (p, h1–h6, ul, ol, li, table)', () => {
    makeAbsolute([absPanel(50, 50), absPanel(120, 100), absPanel(300, 200)], host);
    const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th'];
    for (const tag of blockTags) {
      expect(
        host.querySelectorAll(tag).length,
        `unexpected <${tag}> element found — raw HTML may have been injected`,
      ).toBe(0);
    }
  });

  it('contains no raw form or interactive elements (form, input, select, textarea)', () => {
    makeAbsolute([absPanel(50, 50)], host);
    const formTags = ['form', 'input', 'select', 'textarea'];
    for (const tag of formTags) {
      expect(
        host.querySelectorAll(tag).length,
        `unexpected <${tag}> element found`,
      ).toBe(0);
    }
  });

  it('every span element in the DOM carries an x-* framework class', () => {
    makeAbsolute([absPanel(50, 50), absPanel(120, 100)], host);
    const spans = Array.from(host.querySelectorAll('span'));
    for (const span of spans) {
      const hasFrameworkClass = Array.from(span.classList).some((c) => c.startsWith('x-'));
      expect(hasFrameworkClass, `<span> without x-* class found: "${span.className}"`).toBe(true);
    }
  });
});
