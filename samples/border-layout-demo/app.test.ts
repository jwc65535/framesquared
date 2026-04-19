/**
 * app.test.ts
 *
 * TDD suite for the Border Layout Demo.
 *
 * Tests are ordered from the smallest observable unit outward:
 *   1.  Application lifecycle    — name, singleton, start() order
 *   2.  Layout assignment        — 'border' alias, object form, display: grid
 *   3.  Grid template structure  — gridTemplateAreas, Rows, Columns
 *   4.  Region grid-area         — each panel gets the correct gridArea style
 *   5.  Region sizing            — north/south heights, west/east widths
 *   6.  Center region fill       — center alone fills the grid
 *   7.  Splitter / Resizable     — handles present, onResize updates gridTemplate
 *   8.  Child component presence — getItems(), getAt(), rendered state
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@framesquared/app';
import { Panel } from '@framesquared/ui';
import { BorderLayout } from '@framesquared/layout';
import { Resizable } from '@framesquared/dd';

// Importing @framesquared/layout registers all layout aliases as a side-effect.
import '@framesquared/layout';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Render a Panel into the test host, return its body element. */
function renderPanel(panel: Panel, host: HTMLElement): HTMLElement {
  panel.render(host);
  return panel.getBodyEl() as HTMLElement;
}

/** Shorthand: a Panel carrying a region config key. */
function regionPanel(
  region: string,
  extra: Record<string, unknown> = {},
): Panel {
  return new Panel({ region, ...extra });
}

/**
 * Build and render a Border-layout container.
 * Returns { body, items } where body is the container's grid body element.
 */
function makeBorder(
  layoutOverrides: Record<string, unknown>,
  items: Panel[],
  host: HTMLElement,
): { body: HTMLElement; items: Panel[] } {
  const panel = new Panel({
    layout: { type: 'border', ...layoutOverrides },
    items,
  });
  const body = renderPanel(panel, host);
  return { body, items };
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
    const app = new Application({ name: 'BorderLayoutDemo' });
    expect(app.getName()).toBe('BorderLayoutDemo');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'BorderLayoutDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'BorderLayoutDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'BorderLayoutDemo',
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
    class BorderApp extends Application {
      constructor() { super({ name: 'BorderLayoutDemo' }); }
      override launch(): void { launched = true; }
    }
    new BorderApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Layout assignment
// ════════════════════════════════════════════════════════════════════════════

describe('Layout assignment', () => {
  it('string alias "border" resolves to a BorderLayout instance', () => {
    const panel = new Panel({ layout: 'border', items: [regionPanel('center')] });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(BorderLayout);
  });

  it('object form { type: "border" } resolves to a BorderLayout instance', () => {
    const panel = new Panel({ layout: { type: 'border' }, items: [regionPanel('center')] });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(BorderLayout);
  });

  it('layout.type is "border"', () => {
    const panel = new Panel({ layout: { type: 'border' }, items: [regionPanel('center')] });
    panel.render(host);
    expect(panel.getLayout().type).toBe('border');
  });

  it('container body has display: grid after render', () => {
    const { body } = makeBorder({}, [regionPanel('center')], host);
    expect(body.style.display).toBe('grid');
  });

  it('container body has 100% width and height', () => {
    const { body } = makeBorder({}, [regionPanel('center')], host);
    expect(body.style.width).toBe('100%');
    expect(body.style.height).toBe('100%');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Grid template structure
// ════════════════════════════════════════════════════════════════════════════

describe('Grid template structure', () => {
  it('5-region layout produces gridTemplateAreas with north, west, center, east, south', () => {
    const { body } = makeBorder({}, [
      regionPanel('north', { height: 60 }),
      regionPanel('south', { height: 40 }),
      regionPanel('west',  { width: 220 }),
      regionPanel('east',  { width: 200 }),
      regionPanel('center'),
    ], host);
    const areas = body.style.gridTemplateAreas;
    expect(areas).toContain('north');
    expect(areas).toContain('west');
    expect(areas).toContain('center');
    expect(areas).toContain('east');
    expect(areas).toContain('south');
  });

  it('north + center + south produces 3 rows in gridTemplateRows', () => {
    const { body } = makeBorder({}, [
      regionPanel('north', { height: 48 }),
      regionPanel('center'),
      regionPanel('south', { height: 32 }),
    ], host);
    const rows = body.style.gridTemplateRows.split(' ');
    expect(rows).toHaveLength(3);
  });

  it('west + center + east produces 3 columns in gridTemplateColumns', () => {
    const { body } = makeBorder({}, [
      regionPanel('west',   { width: 220 }),
      regionPanel('center'),
      regionPanel('east',   { width: 200 }),
    ], host);
    const cols = body.style.gridTemplateColumns.split(' ');
    expect(cols).toHaveLength(3);
  });

  it('center-only layout has gridTemplateAreas containing just "center"', () => {
    const { body } = makeBorder({}, [regionPanel('center')], host);
    expect(body.style.gridTemplateAreas).toBe('"center"');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Region grid-area assignment
// ════════════════════════════════════════════════════════════════════════════

describe('Region grid-area assignment', () => {
  function allRegions() {
    return [
      regionPanel('north',  { height: 48 }),
      regionPanel('south',  { height: 32 }),
      regionPanel('west',   { width: 220 }),
      regionPanel('east',   { width: 200 }),
      regionPanel('center'),
    ];
  }

  it('north panel gets gridArea: "north"', () => {
    const items = allRegions();
    makeBorder({}, items, host);
    expect(items[0].el!.style.gridArea).toBe('north');
  });

  it('south panel gets gridArea: "south"', () => {
    const items = allRegions();
    makeBorder({}, items, host);
    expect(items[1].el!.style.gridArea).toBe('south');
  });

  it('west panel gets gridArea: "west"', () => {
    const items = allRegions();
    makeBorder({}, items, host);
    expect(items[2].el!.style.gridArea).toBe('west');
  });

  it('east panel gets gridArea: "east"', () => {
    const items = allRegions();
    makeBorder({}, items, host);
    expect(items[3].el!.style.gridArea).toBe('east');
  });

  it('center panel gets gridArea: "center"', () => {
    const items = allRegions();
    makeBorder({}, items, host);
    expect(items[4].el!.style.gridArea).toBe('center');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Region sizing
// ════════════════════════════════════════════════════════════════════════════

describe('Region sizing', () => {
  it('north height (48px) appears in gridTemplateRows', () => {
    const { body } = makeBorder({}, [
      regionPanel('north', { height: 48 }),
      regionPanel('center'),
    ], host);
    expect(body.style.gridTemplateRows).toContain('48px');
  });

  it('south height (32px) appears in gridTemplateRows', () => {
    const { body } = makeBorder({}, [
      regionPanel('center'),
      regionPanel('south', { height: 32 }),
    ], host);
    expect(body.style.gridTemplateRows).toContain('32px');
  });

  it('west width (220px) appears in gridTemplateColumns', () => {
    const { body } = makeBorder({}, [
      regionPanel('west', { width: 220 }),
      regionPanel('center'),
    ], host);
    expect(body.style.gridTemplateColumns).toContain('220px');
  });

  it('east width (200px) appears in gridTemplateColumns', () => {
    const { body } = makeBorder({}, [
      regionPanel('center'),
      regionPanel('east', { width: 200 }),
    ], host);
    expect(body.style.gridTemplateColumns).toContain('200px');
  });

  it('center region is always sized to 1fr in gridTemplateColumns', () => {
    const { body } = makeBorder({}, [
      regionPanel('west', { width: 220 }),
      regionPanel('center'),
      regionPanel('east', { width: 200 }),
    ], host);
    const cols = body.style.gridTemplateColumns.split(' ');
    expect(cols).toContain('1fr');
  });

  it('west falls back to 200px default when no width configured', () => {
    const { body } = makeBorder({}, [
      regionPanel('west'),
      regionPanel('center'),
    ], host);
    expect(body.style.gridTemplateColumns).toContain('200px');
  });

  it('east falls back to 200px default when no width configured', () => {
    const { body } = makeBorder({}, [
      regionPanel('center'),
      regionPanel('east'),
    ], host);
    expect(body.style.gridTemplateColumns).toContain('200px');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Center region fill
// ════════════════════════════════════════════════════════════════════════════

describe('Center region fill', () => {
  it('center alone: gridTemplateColumns is "1fr"', () => {
    const { body } = makeBorder({}, [regionPanel('center')], host);
    expect(body.style.gridTemplateColumns).toBe('1fr');
  });

  it('center alone: gridTemplateRows is "1fr"', () => {
    const { body } = makeBorder({}, [regionPanel('center')], host);
    expect(body.style.gridTemplateRows).toBe('1fr');
  });

  it('center is the only column that uses 1fr (others are fixed px)', () => {
    const { body } = makeBorder({}, [
      regionPanel('west',   { width: 220 }),
      regionPanel('center'),
      regionPanel('east',   { width: 200 }),
    ], host);
    const cols = body.style.gridTemplateColumns.split(' ');
    const frCols = cols.filter((c) => c.endsWith('fr'));
    expect(frCols).toHaveLength(1);
    expect(frCols[0]).toBe('1fr');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Splitter / Resizable
// ════════════════════════════════════════════════════════════════════════════

describe('Splitter / Resizable', () => {
  it('attaching Resizable "e" handle to west panel adds x-resizable-handle-e to its el', () => {
    const west   = regionPanel('west',   { width: 220 });
    const center = regionPanel('center');
    makeBorder({}, [west, center], host);

    new Resizable({ el: west.el!, handles: 'e', minWidth: 120, maxWidth: 400 });

    expect(west.el!.querySelector('.x-resizable-handle-e')).not.toBeNull();
  });

  it('attaching Resizable "w" handle to east panel adds x-resizable-handle-w to its el', () => {
    const center = regionPanel('center');
    const east   = regionPanel('east',   { width: 200 });
    makeBorder({}, [center, east], host);

    new Resizable({ el: east.el!, handles: 'w', minWidth: 120, maxWidth: 400 });

    expect(east.el!.querySelector('.x-resizable-handle-w')).not.toBeNull();
  });

  it('onResize callback for west panel updates gridTemplateColumns first column', () => {
    const west   = regionPanel('west',   { width: 220 });
    const center = regionPanel('center');
    const { body } = makeBorder({}, [west, center], host);

    // Mirror the wiring used in app.ts
    const updateWest = (w: number): void => {
      const cols = body.style.gridTemplateColumns.split(' ');
      cols[0] = `${w}px`;
      body.style.gridTemplateColumns = cols.join(' ');
    };

    updateWest(350);
    expect(body.style.gridTemplateColumns).toBe('350px 1fr');
  });

  it('onResize callback for east panel updates gridTemplateColumns last column', () => {
    const center = regionPanel('center');
    const east   = regionPanel('east',   { width: 200 });
    const { body } = makeBorder({}, [center, east], host);

    const updateEast = (w: number): void => {
      const cols = body.style.gridTemplateColumns.split(' ');
      cols[cols.length - 1] = `${w}px`;
      body.style.gridTemplateColumns = cols.join(' ');
    };

    updateEast(300);
    expect(body.style.gridTemplateColumns).toBe('1fr 300px');
  });

  it('west panel el gets position: relative after Resizable attaches (required for absolute handles)', () => {
    const west   = regionPanel('west', { width: 220 });
    const center = regionPanel('center');
    makeBorder({}, [west, center], host);

    new Resizable({ el: west.el!, handles: 'e', minWidth: 120, maxWidth: 400 });

    expect(west.el!.style.position).toBe('relative');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Child component presence
// ════════════════════════════════════════════════════════════════════════════

describe('Child component presence', () => {
  it('container reports the correct number of children via getItems()', () => {
    const panel = new Panel({
      layout: 'border',
      items: [
        regionPanel('north',  { height: 48 }),
        regionPanel('south',  { height: 32 }),
        regionPanel('west',   { width: 220 }),
        regionPanel('east',   { width: 200 }),
        regionPanel('center'),
      ],
    });
    panel.render(host);
    expect(panel.getItems().length).toBe(5);
  });

  it('all region children are rendered into the DOM after container renders', () => {
    const items = [
      regionPanel('north',  { height: 48 }),
      regionPanel('south',  { height: 32 }),
      regionPanel('west',   { width: 220 }),
      regionPanel('east',   { width: 200 }),
      regionPanel('center'),
    ];
    makeBorder({}, items, host);
    for (const item of items) {
      expect(item.rendered).toBe(true);
      expect(item.el).not.toBeNull();
    }
  });

  it('getAt() returns the panel at the given index', () => {
    const north  = regionPanel('north',  { height: 48 });
    const center = regionPanel('center');
    const south  = regionPanel('south',  { height: 32 });
    const container = new Panel({
      layout: 'border',
      items: [north, center, south],
    });
    container.render(host);

    expect(container.getAt(0)).toBe(north);
    expect(container.getAt(1)).toBe(center);
    expect(container.getAt(2)).toBe(south);
  });

  it('west and east panels retain their configured widths in _config', () => {
    const west = regionPanel('west', { width: 220 });
    const east = regionPanel('east', { width: 200 });
    makeBorder({}, [west, regionPanel('center'), east], host);

    expect((west as any)._config.width).toBe(220);
    expect((east as any)._config.width).toBe(200);
  });

  it('north and south panels retain their configured heights in _config', () => {
    const north = regionPanel('north', { height: 48 });
    const south = regionPanel('south', { height: 32 });
    makeBorder({}, [north, regionPanel('center'), south], host);

    expect((north as any)._config.height).toBe(48);
    expect((south as any)._config.height).toBe(32);
  });
});
