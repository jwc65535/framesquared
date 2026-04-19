/**
 * vbox_test.ts
 *
 * TDD suite for the VBox Layout Demo.
 *
 * Tests are ordered from the smallest observable unit outward:
 *   1.  Application lifecycle    — name, singleton, start() order
 *   2.  Layout assignment        — 'vbox' alias and object form
 *   3.  Flex ratio rendering     — flex-grow, flex-shrink, flex-basis on items
 *   4.  Fixed-height items       — explicit height → flex-shrink: 0
 *   5.  Pack mapping             — justify-content values (vertical axis)
 *   6.  Align mapping            — align-items values (horizontal cross-axis)
 *   7.  flex-direction           — column / column-reverse
 *   8.  Gap                      — gap CSS property
 *   9.  Child component presence — container holds expected number of children
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@framesquared/app';
import { Panel } from '@framesquared/ui';
import { VBoxLayout } from '@framesquared/layout';

// Importing @framesquared/layout registers all layout aliases as a side-effect.
import '@framesquared/layout';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Render a Panel into the test host, return its body element. */
function renderPanel(panel: Panel, host: HTMLElement): HTMLElement {
  panel.render(host);
  return panel.getBodyEl() as HTMLElement;
}

/**
 * Build and render a VBox panel, return { body, items }.
 * layoutOverrides are merged after the 'vbox' type, so callers can
 * override align, pack, gap, reverse, etc.
 */
function makeVBox(
  layoutOverrides: Record<string, unknown>,
  children: Panel[],
  host: HTMLElement,
): { body: HTMLElement; items: Panel[] } {
  const panel = new Panel({
    layout: { type: 'vbox', ...layoutOverrides },
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
  it('can be instantiated with the demo name', () => {
    const app = new Application({ name: 'VBoxLayoutDemo' });
    expect(app.getName()).toBe('VBoxLayoutDemo');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'VBoxLayoutDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'VBoxLayoutDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'VBoxLayoutDemo',
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
    class VBoxApp extends Application {
      constructor() { super({ name: 'VBoxLayoutDemo' }); }
      override launch(): void { launched = true; }
    }
    new VBoxApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Layout assignment
// ════════════════════════════════════════════════════════════════════════════

describe('Layout assignment', () => {
  it('string alias "vbox" resolves to a VBoxLayout instance', () => {
    const panel = new Panel({ layout: 'vbox' });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(VBoxLayout);
  });

  it('object form { type: "vbox" } resolves to a VBoxLayout instance', () => {
    const panel = new Panel({ layout: { type: 'vbox' } });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(VBoxLayout);
  });

  it('layout.type is "vbox"', () => {
    const panel = new Panel({ layout: { type: 'vbox' } });
    panel.render(host);
    expect(panel.getLayout().type).toBe('vbox');
  });

  it('container body has display: flex after render', () => {
    const { body } = makeVBox({}, [], host);
    expect(body.style.display).toBe('flex');
  });

  it('container body has flex-direction: column', () => {
    const { body } = makeVBox({}, [], host);
    expect(body.style.flexDirection).toBe('column');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Flex ratio rendering
// ════════════════════════════════════════════════════════════════════════════

describe('Flex ratio rendering', () => {
  it('item with flex:1 gets flex-grow: "1"', () => {
    const { items } = makeVBox({}, [new Panel({ flex: 1 })], host);
    expect(items[0].el!.style.flexGrow).toBe('1');
  });

  it('item with flex:2 gets flex-grow: "2"', () => {
    const { items } = makeVBox({}, [new Panel({ flex: 2 })], host);
    expect(items[0].el!.style.flexGrow).toBe('2');
  });

  it('item with flex:3 gets flex-grow: "3"', () => {
    const { items } = makeVBox({}, [new Panel({ flex: 3 })], host);
    expect(items[0].el!.style.flexGrow).toBe('3');
  });

  it('all items in a 1:2:3 ratio have the correct flex-grow values', () => {
    const items = [new Panel({ flex: 1 }), new Panel({ flex: 2 }), new Panel({ flex: 3 })];
    makeVBox({}, items, host);
    expect(items[0].el!.style.flexGrow).toBe('1');
    expect(items[1].el!.style.flexGrow).toBe('2');
    expect(items[2].el!.style.flexGrow).toBe('3');
  });

  it('flex items get flex-basis: "0px" for proportional distribution', () => {
    const { items } = makeVBox({}, [new Panel({ flex: 1 }), new Panel({ flex: 2 })], host);
    expect(items[0].el!.style.flexBasis).toBe('0px');
    expect(items[1].el!.style.flexBasis).toBe('0px');
  });

  it('flex items get flex-shrink: "1"', () => {
    const { items } = makeVBox({}, [new Panel({ flex: 1 }), new Panel({ flex: 2 })], host);
    expect(items[0].el!.style.flexShrink).toBe('1');
    expect(items[1].el!.style.flexShrink).toBe('1');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Fixed-height items
// ════════════════════════════════════════════════════════════════════════════

describe('Fixed-height items', () => {
  it('item with explicit height gets flex-shrink: "0"', () => {
    const { items } = makeVBox({}, [new Panel({ height: 60 })], host);
    expect(items[0].el!.style.flexShrink).toBe('0');
  });

  it('fixed-height item does not get flex-grow set', () => {
    const { items } = makeVBox({}, [new Panel({ height: 60 })], host);
    expect(items[0].el!.style.flexGrow).toBe('');
  });

  it('mixed flex and fixed items coexist correctly', () => {
    const fixed = new Panel({ height: 60 });
    const flexible = new Panel({ flex: 1 });
    makeVBox({}, [fixed, flexible], host);

    expect(fixed.el!.style.flexShrink).toBe('0');
    expect(fixed.el!.style.flexGrow).toBe('');
    expect(flexible.el!.style.flexGrow).toBe('1');
    expect(flexible.el!.style.flexBasis).toBe('0px');
  });

  it('a fixed header (48px) + flex body + fixed footer (40px) applies correct styles', () => {
    const header = new Panel({ title: 'Header', height: 48 });
    const body   = new Panel({ title: 'Body',   flex: 1 });
    const footer = new Panel({ title: 'Footer', height: 40 });
    makeVBox({}, [header, body, footer], host);

    expect(header.el!.style.flexShrink).toBe('0');
    expect(header.el!.style.flexGrow).toBe('');
    expect(body.el!.style.flexGrow).toBe('1');
    expect(body.el!.style.flexBasis).toBe('0px');
    expect(footer.el!.style.flexShrink).toBe('0');
    expect(footer.el!.style.flexGrow).toBe('');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Pack mapping — justify-content (vertical / main axis for VBox)
// ════════════════════════════════════════════════════════════════════════════

describe('Pack — justify-content mapping', () => {
  it('pack: "start" → justify-content: flex-start', () => {
    const { body } = makeVBox({ pack: 'start' }, [], host);
    expect(body.style.justifyContent).toBe('flex-start');
  });

  it('pack: "center" → justify-content: center', () => {
    const { body } = makeVBox({ pack: 'center' }, [], host);
    expect(body.style.justifyContent).toBe('center');
  });

  it('pack: "end" → justify-content: flex-end', () => {
    const { body } = makeVBox({ pack: 'end' }, [], host);
    expect(body.style.justifyContent).toBe('flex-end');
  });

  it('pack: "space-between" → justify-content: space-between', () => {
    const { body } = makeVBox({ pack: 'space-between' }, [], host);
    expect(body.style.justifyContent).toBe('space-between');
  });

  it('pack: "space-around" → justify-content: space-around', () => {
    const { body } = makeVBox({ pack: 'space-around' }, [], host);
    expect(body.style.justifyContent).toBe('space-around');
  });

  it('pack: "space-evenly" → justify-content: space-evenly', () => {
    const { body } = makeVBox({ pack: 'space-evenly' }, [], host);
    expect(body.style.justifyContent).toBe('space-evenly');
  });

  it('default pack is "start" (flex-start)', () => {
    const { body } = makeVBox({}, [], host);
    expect(body.style.justifyContent).toBe('flex-start');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Align mapping — align-items (horizontal / cross-axis for VBox)
// ════════════════════════════════════════════════════════════════════════════

describe('Align — align-items mapping', () => {
  it('align: "start" → align-items: flex-start', () => {
    const { body } = makeVBox({ align: 'start' }, [], host);
    expect(body.style.alignItems).toBe('flex-start');
  });

  it('align: "center" → align-items: center', () => {
    const { body } = makeVBox({ align: 'center' }, [], host);
    expect(body.style.alignItems).toBe('center');
  });

  it('align: "end" → align-items: flex-end', () => {
    const { body } = makeVBox({ align: 'end' }, [], host);
    expect(body.style.alignItems).toBe('flex-end');
  });

  it('align: "stretch" → align-items: stretch', () => {
    const { body } = makeVBox({ align: 'stretch' }, [], host);
    expect(body.style.alignItems).toBe('stretch');
  });

  it('default align is "stretch"', () => {
    const { body } = makeVBox({}, [], host);
    expect(body.style.alignItems).toBe('stretch');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. flex-direction
// ════════════════════════════════════════════════════════════════════════════

describe('flex-direction', () => {
  it('VBox defaults to flex-direction: column', () => {
    const { body } = makeVBox({}, [], host);
    expect(body.style.flexDirection).toBe('column');
  });

  it('reverse: true produces flex-direction: column-reverse', () => {
    const { body } = makeVBox({ reverse: true }, [], host);
    expect(body.style.flexDirection).toBe('column-reverse');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Gap
// ════════════════════════════════════════════════════════════════════════════

describe('Gap', () => {
  it('gap: 8 → gap: "8px" on the container body', () => {
    const { body } = makeVBox({ gap: 8 }, [], host);
    expect(body.style.gap).toBe('8px');
  });

  it('gap: 24 → gap: "24px"', () => {
    const { body } = makeVBox({ gap: 24 }, [], host);
    expect(body.style.gap).toBe('24px');
  });

  it('no gap config → gap style is not set', () => {
    const { body } = makeVBox({}, [], host);
    expect(body.style.gap).toBe('');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. Child component presence
// ════════════════════════════════════════════════════════════════════════════

describe('Child component presence', () => {
  it('container reports the correct number of children via getItems()', () => {
    const panel = new Panel({
      layout: 'vbox',
      items: [new Panel({ title: 'A' }), new Panel({ title: 'B' }), new Panel({ title: 'C' })],
    });
    panel.render(host);
    expect(panel.getItems().length).toBe(3);
  });

  it('the header/body/footer pattern produces three distinct items', () => {
    const header = new Panel({ title: 'Header', height: 48 });
    const body   = new Panel({ title: 'Body',   flex: 1 });
    const footer = new Panel({ title: 'Footer', height: 40 });
    const container = new Panel({ layout: 'vbox', items: [header, body, footer] });
    container.render(host);

    const items = container.getItems();
    expect(items.length).toBe(3);
    expect(items[0]).toBe(header);
    expect(items[1]).toBe(body);
    expect(items[2]).toBe(footer);
  });

  it('each child is rendered into the DOM after the container renders', () => {
    const children = [new Panel({ title: 'A' }), new Panel({ title: 'B' }), new Panel({ title: 'C' })];
    const container = new Panel({ layout: 'vbox', items: children });
    container.render(host);

    for (const child of children) {
      expect(child.rendered).toBe(true);
      expect(child.el).not.toBeNull();
    }
  });

  it('a flex:1 body item is present and rendered between header and footer', () => {
    const header  = new Panel({ title: 'Header',  height: 48 });
    const content = new Panel({ title: 'Content', flex: 1 });
    const footer  = new Panel({ title: 'Footer',  height: 40 });
    const container = new Panel({ layout: 'vbox', items: [header, content, footer] });
    container.render(host);

    expect(container.getAt(0)).toBe(header);
    expect(container.getAt(1)).toBe(content);
    expect(container.getAt(2)).toBe(footer);
    expect(content.el!.style.flexGrow).toBe('1');
  });

  it('demo-style container: three sections with correct flex values', () => {
    const flexSection  = new Panel({ title: 'Flex Ratios', height: 340 });
    const packSection  = new Panel({ title: 'Pack Demo'  });
    const alignSection = new Panel({ title: 'Align Demo' });
    const contentPanel = new Panel({
      layout: { type: 'vbox', align: 'stretch', gap: 24 },
      items: [flexSection, packSection, alignSection],
    });
    contentPanel.render(host);

    expect(contentPanel.getItems().length).toBe(3);
    expect(contentPanel.getAt(0)).toBe(flexSection);
    expect(contentPanel.getAt(1)).toBe(packSection);
    expect(contentPanel.getAt(2)).toBe(alignSection);
  });
});
