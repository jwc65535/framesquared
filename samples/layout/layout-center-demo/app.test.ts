/**
 * app.test.ts
 *
 * TDD suite for the Center Layout Demo.
 *
 * Tests are ordered from the smallest observable unit outward:
 *   1.  Application lifecycle    — name, singleton, start() order
 *   2.  Layout assignment        — 'center' alias, container position:relative
 *   3.  Mathematical centering   — left/top offsets at a known container size
 *   4.  Resize behaviour         — offsets update when container dimensions change
 *   5.  Nested content           — Button inside Panel renders correctly
 *   6.  Framework integrity      — no raw HTML outside component elements
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@framesquared/app';
import { Panel } from '@framesquared/ui';
import { Button } from '@framesquared/ui';
import { CenterLayout } from '@framesquared/layout';

// Side-effect import registers all layout aliases, including 'center'.
import '@framesquared/layout';

// ── Constants matching the demo ────────────────────────────────────────────────

const CHILD_W = 400;
const CHILD_H = 300;

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeHost(): HTMLDivElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

/**
 * Build the demo's center container with a fixed-size Panel child.
 * `containerW` / `containerH` are injected for jsdom (clientWidth/Height = 0).
 */
function makeCenterContainer(
  host: HTMLElement,
  containerW = 1000,
  containerH = 600,
): { container: Panel; body: HTMLElement; child: Panel; layout: CenterLayout } {
  const button = new Button({ text: 'Click me' });
  const child  = new Panel({
    title: 'Centered Content',
    width: CHILD_W,
    height: CHILD_H,
    items: [button],
  });

  const container = new Panel({
    layout: 'center',
    items: [child],
  });

  container.render(host);
  const body   = container.getBodyEl() as HTMLElement;
  const layout = container.getLayout() as CenterLayout;

  // Inject explicit dimensions — jsdom always returns clientWidth/Height = 0.
  layout.applyItemStyles([child], body, containerW, containerH);

  return { container, body, child, layout };
}

// ── Test host setup ───────────────────────────────────────────────────────────

let host: HTMLDivElement;

beforeEach(() => {
  host = makeHost();
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
    const app = new Application({ name: 'CenterLayoutDemo' });
    expect(app.getName()).toBe('CenterLayoutDemo');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'CenterLayoutDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'CenterLayoutDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'CenterLayoutDemo',
      launch: () => order.push('launch'),
    });
    app.onInit         = () => order.push('onInit');
    app.onBeforeLaunch = () => order.push('onBeforeLaunch');
    app.onLaunch       = () => order.push('onLaunch');
    app.start();
    expect(order).toEqual(['onInit', 'onBeforeLaunch', 'launch', 'onLaunch']);
  });

  it('launch() is overridable in a subclass', () => {
    let launched = false;
    class CenterApp extends Application {
      constructor() { super({ name: 'CenterLayoutDemo' }); }
      override launch(): void { launched = true; }
    }
    new CenterApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Layout assignment
// ════════════════════════════════════════════════════════════════════════════

describe('Layout assignment', () => {
  it('string alias "center" resolves to a CenterLayout instance', () => {
    const panel = new Panel({ layout: 'center' });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(CenterLayout);
  });

  it('object form { type: "center" } also resolves to CenterLayout', () => {
    const panel = new Panel({ layout: { type: 'center' } });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(CenterLayout);
  });

  it('layout.type is "center"', () => {
    const panel = new Panel({ layout: 'center' });
    panel.render(host);
    expect(panel.getLayout().type).toBe('center');
  });

  it('container body has position:relative', () => {
    const { body } = makeCenterContainer(host);
    expect(body.style.position).toBe('relative');
  });

  it('container body has overflow:hidden', () => {
    const { body } = makeCenterContainer(host);
    expect(body.style.overflow).toBe('hidden');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Mathematical centering
// ════════════════════════════════════════════════════════════════════════════

describe('Mathematical centering', () => {
  it('child has position:absolute', () => {
    const { child } = makeCenterContainer(host, 1000, 600);
    expect(child.el!.style.position).toBe('absolute');
  });

  it('left offset = (containerW - childW) / 2 at 1000px wide', () => {
    const { child } = makeCenterContainer(host, 1000, 600);
    expect(child.el!.style.left).toBe('300px');  // (1000 - 400) / 2
  });

  it('top offset = (containerH - childH) / 2 at 600px tall', () => {
    const { child } = makeCenterContainer(host, 1000, 600);
    expect(child.el!.style.top).toBe('150px');   // (600 - 300) / 2
  });

  it('child width is set to the configured value', () => {
    const { child } = makeCenterContainer(host, 1000, 600);
    expect(child.el!.style.width).toBe(`${CHILD_W}px`);
  });

  it('child height is set to the configured value', () => {
    const { child } = makeCenterContainer(host, 1000, 600);
    expect(child.el!.style.height).toBe(`${CHILD_H}px`);
  });

  it('left=0 when container is exactly as wide as the child', () => {
    const { child } = makeCenterContainer(host, CHILD_W, 600);
    expect(child.el!.style.left).toBe('0px');
  });

  it('top=0 when container is exactly as tall as the child', () => {
    const { child } = makeCenterContainer(host, 1000, CHILD_H);
    expect(child.el!.style.top).toBe('0px');
  });

  it('centring is symmetric: left === (containerW - childW) / 2 for varied widths', () => {
    for (const cw of [600, 800, 1200, 1440]) {
      const { child, body, layout } = makeCenterContainer(host, cw, 600);
      layout.applyItemStyles([child], body, cw, 600);
      const expected = `${Math.round((cw - CHILD_W) / 2)}px`;
      expect(child.el!.style.left).toBe(expected);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Resize behaviour
// ════════════════════════════════════════════════════════════════════════════

describe('Resize behaviour', () => {
  it('left offset updates when container width increases', () => {
    const { child, body, layout } = makeCenterContainer(host, 1000, 600);
    layout.applyItemStyles([child], body, 1400, 600);
    expect(child.el!.style.left).toBe('500px');  // (1400 - 400) / 2
  });

  it('left offset updates when container width decreases', () => {
    const { child, body, layout } = makeCenterContainer(host, 1000, 600);
    layout.applyItemStyles([child], body, 600, 600);
    expect(child.el!.style.left).toBe('100px');  // (600 - 400) / 2
  });

  it('top offset updates when container height increases', () => {
    const { child, body, layout } = makeCenterContainer(host, 1000, 600);
    layout.applyItemStyles([child], body, 1000, 900);
    expect(child.el!.style.top).toBe('300px');   // (900 - 300) / 2
  });

  it('top offset updates when container height decreases', () => {
    const { child, body, layout } = makeCenterContainer(host, 1000, 600);
    layout.applyItemStyles([child], body, 1000, 400);
    expect(child.el!.style.top).toBe('50px');    // (400 - 300) / 2
  });

  it('child width and height are unchanged after resize', () => {
    const { child, body, layout } = makeCenterContainer(host, 1000, 600);
    layout.applyItemStyles([child], body, 800, 400);
    expect(child.el!.style.width ).toBe(`${CHILD_W}px`);
    expect(child.el!.style.height).toBe(`${CHILD_H}px`);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Nested content
// ════════════════════════════════════════════════════════════════════════════

describe('Nested content', () => {
  it('child panel is rendered with a live element', () => {
    const { child } = makeCenterContainer(host);
    expect(child.rendered).toBe(true);
    expect(child.el).not.toBeNull();
  });

  it('child panel reports 1 item (the Button)', () => {
    const { child } = makeCenterContainer(host);
    expect(child.getItems().length).toBe(1);
  });

  it('the Button inside the child panel is rendered', () => {
    const { child } = makeCenterContainer(host);
    const btn = child.getAt(0)!;
    expect(btn.rendered).toBe(true);
    expect(btn.el).not.toBeNull();
  });

  it('the Button is an instance of Button', () => {
    const { child } = makeCenterContainer(host);
    expect(child.getAt(0)).toBeInstanceOf(Button);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Framework integrity — no raw HTML injection
// ════════════════════════════════════════════════════════════════════════════

describe('Framework integrity — no raw HTML injection', () => {
  it('all direct children of the host are framework component elements', () => {
    makeCenterContainer(host);
    for (const child of Array.from(host.children)) {
      expect(child.classList.contains('x-component')).toBe(true);
    }
  });

  it('contains no raw block-level semantic elements (p, h1–h6, ul, ol, li, table)', () => {
    makeCenterContainer(host);
    const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th'];
    for (const tag of blockTags) {
      expect(
        host.querySelectorAll(tag).length,
        `unexpected <${tag}> — raw HTML may have been injected`,
      ).toBe(0);
    }
  });

  it('every <span> in the subtree carries an x-* framework class', () => {
    makeCenterContainer(host);
    for (const span of Array.from(host.querySelectorAll('span'))) {
      const hasXClass = Array.from(span.classList).some(c => c.startsWith('x-'));
      expect(hasXClass, `<span class="${span.className}"> has no x-* class`).toBe(true);
    }
  });
});
