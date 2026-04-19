/**
 * app.test.ts
 *
 * TDD suite for the HBox Layout Demo.
 *
 * Tests are ordered from the smallest observable unit outward:
 *   1.  Application lifecycle   — name, singleton, start()
 *   2.  Layout assignment       — 'hbox' string alias and object form
 *   3.  Flex ratio rendering    — flex-grow, flex-shrink, flex-basis on items
 *   4.  Fixed-width items       — non-flex items get flex-shrink: 0
 *   5.  Pack mapping            — justifyContent values
 *   6.  Align mapping           — alignItems values
 *   7.  flex-direction          — row / row-reverse
 *   8.  Gap                     — gap CSS property
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@framesquared/app';
import { Panel } from '@framesquared/ui';
import { HBoxLayout } from '@framesquared/layout';

// Importing @framesquared/layout registers all layout aliases as a side-effect.
import '@framesquared/layout';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Render a Panel into the test host, return its body element. */
function renderPanel(panel: Panel, host: HTMLElement): HTMLElement {
  panel.render(host);
  return panel.getBodyEl() as HTMLElement;
}

/** Build and render an HBox panel, return { panel, body, items }. */
function makeHBox(
  layoutOverrides: Record<string, unknown>,
  children: Panel[],
  host: HTMLElement,
): { body: HTMLElement; items: Panel[] } {
  const panel = new Panel({
    layout: { type: 'hbox', ...layoutOverrides },
    items: children,
  });
  const body = renderPanel(panel, host);
  return { body, items: children };
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
  it('can be instantiated with a name', () => {
    const app = new Application({ name: 'HBoxLayoutDemo' });
    expect(app.getName()).toBe('HBoxLayoutDemo');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'HBoxLayoutDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'HBoxLayoutDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls onInit, onBeforeLaunch, launch(), and onLaunch in order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'HBoxLayoutDemo',
      launch: () => order.push('launch'),
    });
    app.onInit = () => order.push('onInit');
    app.onBeforeLaunch = () => order.push('onBeforeLaunch');
    app.onLaunch = () => order.push('onLaunch');
    app.start();
    expect(order).toEqual(['onInit', 'onBeforeLaunch', 'launch', 'onLaunch']);
  });

  it('launch() is overridable in a subclass', () => {
    let launched = false;
    class MyApp extends Application {
      constructor() { super({ name: 'MyApp' }); }
      override launch(): void { launched = true; }
    }
    new MyApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Layout assignment
// ════════════════════════════════════════════════════════════════════════════

describe('Layout assignment', () => {
  it('string alias "hbox" resolves to an HBoxLayout', () => {
    const panel = new Panel({ layout: 'hbox' });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(HBoxLayout);
  });

  it('object form { type: "hbox" } resolves to an HBoxLayout', () => {
    const panel = new Panel({ layout: { type: 'hbox' } });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(HBoxLayout);
  });

  it('layout.type is "hbox"', () => {
    const panel = new Panel({ layout: { type: 'hbox' } });
    panel.render(host);
    expect(panel.getLayout().type).toBe('hbox');
  });

  it('container body has display: flex after render', () => {
    const { body } = makeHBox({}, [], host);
    expect(body.style.display).toBe('flex');
  });

  it('container body has flex-direction: row', () => {
    const { body } = makeHBox({}, [], host);
    expect(body.style.flexDirection).toBe('row');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Flex ratio rendering
// ════════════════════════════════════════════════════════════════════════════

describe('Flex ratio rendering', () => {
  it('item with flex:1 gets flex-grow: "1"', () => {
    const { items } = makeHBox({}, [new Panel({ flex: 1 })], host);
    expect(items[0].el!.style.flexGrow).toBe('1');
  });

  it('item with flex:2 gets flex-grow: "2"', () => {
    const { items } = makeHBox({}, [new Panel({ flex: 2 })], host);
    expect(items[0].el!.style.flexGrow).toBe('2');
  });

  it('item with flex:3 gets flex-grow: "3"', () => {
    const { items } = makeHBox({}, [new Panel({ flex: 3 })], host);
    expect(items[0].el!.style.flexGrow).toBe('3');
  });

  it('all three items in a 1:2:3 ratio have correct flex-grow values', () => {
    const items = [new Panel({ flex: 1 }), new Panel({ flex: 2 }), new Panel({ flex: 3 })];
    makeHBox({}, items, host);
    expect(items[0].el!.style.flexGrow).toBe('1');
    expect(items[1].el!.style.flexGrow).toBe('2');
    expect(items[2].el!.style.flexGrow).toBe('3');
  });

  it('flex items get flex-basis: "0px" for equal proportional distribution', () => {
    const { items } = makeHBox({}, [new Panel({ flex: 1 }), new Panel({ flex: 2 })], host);
    expect(items[0].el!.style.flexBasis).toBe('0px');
    expect(items[1].el!.style.flexBasis).toBe('0px');
  });

  it('flex items get flex-shrink: "1"', () => {
    const { items } = makeHBox({}, [new Panel({ flex: 1 }), new Panel({ flex: 2 })], host);
    expect(items[0].el!.style.flexShrink).toBe('1');
    expect(items[1].el!.style.flexShrink).toBe('1');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Fixed-width items
// ════════════════════════════════════════════════════════════════════════════

describe('Fixed-width items', () => {
  it('item with explicit width gets flex-shrink: "0"', () => {
    const { items } = makeHBox({}, [new Panel({ width: 120 })], host);
    expect(items[0].el!.style.flexShrink).toBe('0');
  });

  it('item with explicit width does not get flex-grow set', () => {
    const { items } = makeHBox({}, [new Panel({ width: 120 })], host);
    expect(items[0].el!.style.flexGrow).toBe('');
  });

  it('mixed flex and fixed items coexist correctly', () => {
    const fixed = new Panel({ width: 120 });
    const flexible = new Panel({ flex: 1 });
    makeHBox({}, [fixed, flexible], host);

    expect(fixed.el!.style.flexShrink).toBe('0');
    expect(fixed.el!.style.flexGrow).toBe('');
    expect(flexible.el!.style.flexGrow).toBe('1');
    expect(flexible.el!.style.flexBasis).toBe('0px');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Pack (justify-content) mapping
// ════════════════════════════════════════════════════════════════════════════

describe('Pack — justify-content mapping', () => {
  it('pack: "start" → justify-content: flex-start', () => {
    const { body } = makeHBox({ pack: 'start' }, [], host);
    expect(body.style.justifyContent).toBe('flex-start');
  });

  it('pack: "center" → justify-content: center', () => {
    const { body } = makeHBox({ pack: 'center' }, [], host);
    expect(body.style.justifyContent).toBe('center');
  });

  it('pack: "end" → justify-content: flex-end', () => {
    const { body } = makeHBox({ pack: 'end' }, [], host);
    expect(body.style.justifyContent).toBe('flex-end');
  });

  it('pack: "space-between" → justify-content: space-between', () => {
    const { body } = makeHBox({ pack: 'space-between' }, [], host);
    expect(body.style.justifyContent).toBe('space-between');
  });

  it('pack: "space-around" → justify-content: space-around', () => {
    const { body } = makeHBox({ pack: 'space-around' }, [], host);
    expect(body.style.justifyContent).toBe('space-around');
  });

  it('pack: "space-evenly" → justify-content: space-evenly', () => {
    const { body } = makeHBox({ pack: 'space-evenly' }, [], host);
    expect(body.style.justifyContent).toBe('space-evenly');
  });

  it('default pack is "start" (flex-start)', () => {
    const { body } = makeHBox({}, [], host);
    expect(body.style.justifyContent).toBe('flex-start');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Align (align-items) mapping
// ════════════════════════════════════════════════════════════════════════════

describe('Align — align-items mapping', () => {
  it('align: "start" → align-items: flex-start', () => {
    const { body } = makeHBox({ align: 'start' }, [], host);
    expect(body.style.alignItems).toBe('flex-start');
  });

  it('align: "center" → align-items: center', () => {
    const { body } = makeHBox({ align: 'center' }, [], host);
    expect(body.style.alignItems).toBe('center');
  });

  it('align: "end" → align-items: flex-end', () => {
    const { body } = makeHBox({ align: 'end' }, [], host);
    expect(body.style.alignItems).toBe('flex-end');
  });

  it('align: "stretch" → align-items: stretch', () => {
    const { body } = makeHBox({ align: 'stretch' }, [], host);
    expect(body.style.alignItems).toBe('stretch');
  });

  it('default align is "stretch"', () => {
    const { body } = makeHBox({}, [], host);
    expect(body.style.alignItems).toBe('stretch');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. flex-direction
// ════════════════════════════════════════════════════════════════════════════

describe('flex-direction', () => {
  it('HBox defaults to flex-direction: row', () => {
    const { body } = makeHBox({}, [], host);
    expect(body.style.flexDirection).toBe('row');
  });

  it('reverse: true produces flex-direction: row-reverse', () => {
    const { body } = makeHBox({ reverse: true }, [], host);
    expect(body.style.flexDirection).toBe('row-reverse');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Gap
// ════════════════════════════════════════════════════════════════════════════

describe('Gap', () => {
  it('gap: 8 → gap: "8px" on the container body', () => {
    const { body } = makeHBox({ gap: 8 }, [], host);
    expect(body.style.gap).toBe('8px');
  });

  it('gap: 16 → gap: "16px"', () => {
    const { body } = makeHBox({ gap: 16 }, [], host);
    expect(body.style.gap).toBe('16px');
  });

  it('no gap config → gap style is not set', () => {
    const { body } = makeHBox({}, [], host);
    expect(body.style.gap).toBe('');
  });
});
