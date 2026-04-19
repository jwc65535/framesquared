/**
 * app.test.ts
 *
 * TDD suite for the Table Layout Demo.
 *
 * Tests are ordered from the smallest observable unit outward:
 *   1.  Application lifecycle    — name, singleton, start() order
 *   2.  Layout assignment        — 'table' alias, CSS grid container
 *   3.  colspan                  — item spans multiple grid columns
 *   4.  rowspan                  — item spans multiple grid rows
 *   5.  cellPadding              — layout-level padding applied to all cells
 *   6.  cellAlign / cellVAlign   — justifySelf / alignSelf per cell
 *   7.  Component types          — Panel, TextField, Button all render
 *   8.  Framework integrity      — no raw HTML outside component elements
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@framesquared/app';
import { Panel } from '@framesquared/ui';
import { Button } from '@framesquared/ui';
import { TextField } from '@framesquared/form';
import { TableLayout } from '@framesquared/layout';

// Side-effect import registers all layout aliases, including 'table'.
import '@framesquared/layout';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPanel(panel: Panel, host: HTMLElement): HTMLElement {
  panel.render(host);
  return panel.getBodyEl() as HTMLElement;
}

/**
 * Build the standard 3-column table container used across most tests.
 * Row layout:
 *   [header   colspan=3                  ]
 *   [label]   [text field]   [button     ]
 *   [sidebar  rowspan=2] [main] [extra   ]
 *                         [detailA][detailB]
 */
function makeTableContainer(
  host: HTMLElement,
  overrides: Record<string, unknown> = {},
): {
  container: Panel;
  body: HTMLElement;
  header: Panel;
  label: Panel;
  field: TextField;
  btn: Button;
  sidebar: Panel;
  main: Panel;
  extra: Panel;
  detailA: Panel;
  detailB: Panel;
} {
  const header  = new Panel({ title: 'Page Header',   colspan: 3 });
  const label   = new Panel({ title: 'Label' });
  const field   = new TextField({ fieldLabel: 'Name', name: 'name' });
  const btn     = new Button({ text: 'Submit' });
  const sidebar = new Panel({ title: 'Sidebar',       rowspan: 2 });
  const main    = new Panel({ title: 'Main Content' });
  const extra   = new Panel({ title: 'Extra' });
  const detailA = new Panel({ title: 'Detail A' });
  const detailB = new Panel({ title: 'Detail B' });

  const container = new Panel({
    layout: {
      type: 'table',
      columns: 3,
      cellPadding: 8,
      cellAlign: 'left',
      cellVAlign: 'top',
      ...overrides,
    },
    items: [header, label, field, btn, sidebar, main, extra, detailA, detailB],
  });

  const body = renderPanel(container, host);
  return { container, body, header, label, field, btn, sidebar, main, extra, detailA, detailB };
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
    const app = new Application({ name: 'TableLayoutDemo' });
    expect(app.getName()).toBe('TableLayoutDemo');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'TableLayoutDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'TableLayoutDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'TableLayoutDemo',
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
    class TableApp extends Application {
      constructor() { super({ name: 'TableLayoutDemo' }); }
      override launch(): void { launched = true; }
    }
    new TableApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Layout assignment
// ════════════════════════════════════════════════════════════════════════════

describe('Layout assignment', () => {
  it('string alias "table" resolves to a TableLayout instance', () => {
    const panel = new Panel({ layout: 'table' });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(TableLayout);
  });

  it('object form { type: "table" } resolves to a TableLayout instance', () => {
    const panel = new Panel({ layout: { type: 'table' } });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(TableLayout);
  });

  it('layout.type is "table"', () => {
    const panel = new Panel({ layout: { type: 'table', columns: 3 } });
    panel.render(host);
    expect(panel.getLayout().type).toBe('table');
  });

  it('container body has display: grid', () => {
    const { body } = makeTableContainer(host);
    expect(body.style.display).toBe('grid');
  });

  it('container body has gridTemplateColumns repeat(3, 1fr)', () => {
    const { body } = makeTableContainer(host);
    expect(body.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  it('container reports 9 children via getItems()', () => {
    const { container } = makeTableContainer(host);
    expect(container.getItems().length).toBe(9);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. colspan
// ════════════════════════════════════════════════════════════════════════════

describe('colspan', () => {
  it('header (colspan: 3) has gridColumn "span 3"', () => {
    const { header } = makeTableContainer(host);
    expect(header.el!.style.gridColumn).toBe('span 3');
  });

  it('items without colspan have no gridColumn style', () => {
    const { label, main } = makeTableContainer(host);
    expect(label.el!.style.gridColumn).toBe('');
    expect(main.el!.style.gridColumn).toBe('');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. rowspan
// ════════════════════════════════════════════════════════════════════════════

describe('rowspan', () => {
  it('sidebar (rowspan: 2) has gridRow "span 2"', () => {
    const { sidebar } = makeTableContainer(host);
    expect(sidebar.el!.style.gridRow).toBe('span 2');
  });

  it('items without rowspan have no gridRow style', () => {
    const { header, label } = makeTableContainer(host);
    expect(header.el!.style.gridRow).toBe('');
    expect(label.el!.style.gridRow).toBe('');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. cellPadding
// ════════════════════════════════════════════════════════════════════════════

describe('cellPadding', () => {
  it('all grid children have padding "8px" from cellPadding: 8', () => {
    const { container } = makeTableContainer(host);
    for (const item of container.getItems()) {
      expect(item.el!.style.padding).toBe('8px');
    }
  });

  it('cellPadding as string "1rem" is passed through verbatim', () => {
    const container = new Panel({
      layout: { type: 'table', columns: 2, cellPadding: '1rem' },
      items: [new Panel({}), new Panel({})],
    });
    container.render(host);
    for (const item of container.getItems()) {
      expect(item.el!.style.padding).toBe('1rem');
    }
  });

  it('items have no padding when cellPadding is not configured', () => {
    const container = new Panel({
      layout: { type: 'table', columns: 2 },
      items: [new Panel({}), new Panel({})],
    });
    container.render(host);
    for (const item of container.getItems()) {
      expect(item.el!.style.padding).toBe('');
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. cellAlign / cellVAlign
// ════════════════════════════════════════════════════════════════════════════

describe('cellAlign and cellVAlign', () => {
  it('cellAlign: "left" sets justifySelf to "start" on all cells', () => {
    const { container } = makeTableContainer(host);
    for (const item of container.getItems()) {
      expect(item.el!.style.justifySelf).toBe('start');
    }
  });

  it('cellAlign: "center" sets justifySelf to "center"', () => {
    const container = new Panel({
      layout: { type: 'table', columns: 2, cellAlign: 'center' },
      items: [new Panel({}), new Panel({})],
    });
    container.render(host);
    for (const item of container.getItems()) {
      expect(item.el!.style.justifySelf).toBe('center');
    }
  });

  it('cellAlign: "right" sets justifySelf to "end"', () => {
    const container = new Panel({
      layout: { type: 'table', columns: 2, cellAlign: 'right' },
      items: [new Panel({}), new Panel({})],
    });
    container.render(host);
    for (const item of container.getItems()) {
      expect(item.el!.style.justifySelf).toBe('end');
    }
  });

  it('cellVAlign: "top" sets alignSelf to "start" on all cells', () => {
    const { container } = makeTableContainer(host);
    for (const item of container.getItems()) {
      expect(item.el!.style.alignSelf).toBe('start');
    }
  });

  it('cellVAlign: "middle" sets alignSelf to "center"', () => {
    const container = new Panel({
      layout: { type: 'table', columns: 2, cellVAlign: 'middle' },
      items: [new Panel({}), new Panel({})],
    });
    container.render(host);
    for (const item of container.getItems()) {
      expect(item.el!.style.alignSelf).toBe('center');
    }
  });

  it('cellVAlign: "bottom" sets alignSelf to "end"', () => {
    const container = new Panel({
      layout: { type: 'table', columns: 2, cellVAlign: 'bottom' },
      items: [new Panel({}), new Panel({})],
    });
    container.render(host);
    for (const item of container.getItems()) {
      expect(item.el!.style.alignSelf).toBe('end');
    }
  });

  it('no justifySelf when cellAlign is omitted', () => {
    const container = new Panel({
      layout: { type: 'table', columns: 2 },
      items: [new Panel({}), new Panel({})],
    });
    container.render(host);
    for (const item of container.getItems()) {
      expect(item.el!.style.justifySelf).toBe('');
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Component types — Panel, TextField, Button all render
// ════════════════════════════════════════════════════════════════════════════

describe('Component types', () => {
  it('all 9 items are rendered with live elements', () => {
    const { container } = makeTableContainer(host);
    for (const item of container.getItems()) {
      expect(item.rendered).toBe(true);
      expect(item.el).not.toBeNull();
    }
  });

  it('Panel items are rendered', () => {
    const { header, label, sidebar, main, extra, detailA, detailB } = makeTableContainer(host);
    for (const p of [header, label, sidebar, main, extra, detailA, detailB]) {
      expect(p.rendered).toBe(true);
    }
  });

  it('TextField is rendered and has an element', () => {
    const { field } = makeTableContainer(host);
    expect(field.rendered).toBe(true);
    expect(field.el).not.toBeNull();
  });

  it('Button is rendered and has an element', () => {
    const { btn } = makeTableContainer(host);
    expect(btn.rendered).toBe(true);
    expect(btn.el).not.toBeNull();
  });

  it('getAt() returns items in insertion order', () => {
    const { container, header, label, field, btn, sidebar } = makeTableContainer(host);
    expect(container.getAt(0)).toBe(header);
    expect(container.getAt(1)).toBe(label);
    expect(container.getAt(2)).toBe(field);
    expect(container.getAt(3)).toBe(btn);
    expect(container.getAt(4)).toBe(sidebar);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Framework integrity — no raw HTML injection
// ════════════════════════════════════════════════════════════════════════════

describe('Framework integrity — no raw HTML injection', () => {
  it('all direct children of the host are framework component elements', () => {
    makeTableContainer(host);
    for (const child of Array.from(host.children)) {
      expect(child.classList.contains('x-component')).toBe(true);
    }
  });

  it('contains no raw block-level semantic elements (p, h1–h6, ul, ol, li, table)', () => {
    makeTableContainer(host);
    const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th'];
    for (const tag of blockTags) {
      expect(
        host.querySelectorAll(tag).length,
        `unexpected <${tag}> element — raw HTML may have been injected`,
      ).toBe(0);
    }
  });

  it('every <span> in the subtree carries an x-* framework class', () => {
    makeTableContainer(host);
    for (const span of Array.from(host.querySelectorAll('span'))) {
      const hasXClass = Array.from(span.classList).some(c => c.startsWith('x-'));
      expect(hasXClass, `<span class="${span.className}"> has no x-* class`).toBe(true);
    }
  });
});
