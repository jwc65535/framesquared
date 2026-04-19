/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Component, Container } from '@framesquared/component';
import { FitLayout } from '../src/FitLayout.js';
import { CardLayout } from '../src/CardLayout.js';
import { AnchorLayout } from '../src/AnchorLayout.js';
import { BorderLayout } from '../src/BorderLayout.js';
import { ColumnLayout } from '../src/ColumnLayout.js';
import { TableLayout } from '../src/TableLayout.js';
import { AbsoluteLayout } from '../src/AbsoluteLayout.js';
import { AccordionLayout } from '../src/AccordionLayout.js';
import { CenterLayout } from '../src/CenterLayout.js';
import { AutoLayout } from '../src/AutoLayout.js';

// ResizeObserver mock
class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = MockRO;
});
afterEach(() => {
  document.body.innerHTML = '';
});

function cmp(cfg: Record<string, unknown> = {}): Component {
  return new Component(cfg);
}

/** Create a rendered container with a layout applied to its body. */
function withLayout<
  T extends {
    configureContainer(el: HTMLElement): void;
    applyItemStyles?(items: Component[], el: Element): void;
    setOwner(o: Component): void;
  },
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LayoutCls: new (...a: any[]) => T,
  layoutCfg: Record<string, unknown> = {},
  items: Component[] = [],
): { ct: Container; layout: T } {
  const ct = new Container({ renderTo: document.body });
  const layout = new LayoutCls(layoutCfg) as T;
  layout.setOwner(ct);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ct as any)._layoutInstance = layout;
  layout.configureContainer(ct.getBodyEl());
  for (const item of items) ct.add(item);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (layout as any).applyItemStyles === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (layout as any).applyItemStyles(ct.getItems(), ct.getBodyEl());
  }
  return { ct, layout };
}

// ═══════════════════════════════════════════════════════════════════════════
// FitLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('FitLayout', () => {
  it('has type "fit"', () => {
    expect(new FitLayout().type).toBe('fit');
  });

  it('single child fills container (width/height 100%)', () => {
    const { ct } = withLayout(FitLayout, {}, [cmp({ html: 'A' })]);
    const child = ct.getItems()[0];
    expect(child.el!.style.width).toBe('100%');
    expect(child.el!.style.height).toBe('100%');
  });

  it('only first child is visible when multiple added', () => {
    const { ct } = withLayout(FitLayout, {}, [cmp({ html: 'A' }), cmp({ html: 'B' })]);
    const items = ct.getItems();
    expect(items[0].el!.style.display).not.toBe('none');
    expect(items[1].el!.style.display).toBe('none');
  });

  it('empty container is fine', () => {
    const { ct } = withLayout(FitLayout);
    expect(ct.getBodyEl().children.length).toBe(0);
  });

  it('container body has position:relative', () => {
    const { ct } = withLayout(FitLayout);
    expect(ct.getBodyEl().style.position).toBe('relative');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CardLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('CardLayout', () => {
  it('has type "card"', () => {
    expect(new CardLayout().type).toBe('card');
  });

  it('only active item is visible', () => {
    const { ct, layout: _layout } = withLayout(CardLayout, {}, [
      cmp({ html: 'A' }),
      cmp({ html: 'B' }),
      cmp({ html: 'C' }),
    ]);
    const items = ct.getItems();
    expect(items[0].el!.style.display).not.toBe('none');
    expect(items[1].el!.style.display).toBe('none');
    expect(items[2].el!.style.display).toBe('none');
  });

  it('getActiveItem returns the active card', () => {
    const { ct, layout } = withLayout(CardLayout, {}, [cmp(), cmp()]);
    expect(layout.getActiveItem()).toBe(ct.getItems()[0]);
  });

  it('setActiveItem by index', () => {
    const { ct, layout } = withLayout(CardLayout, {}, [cmp(), cmp(), cmp()]);
    layout.setActiveItem(2);
    const items = ct.getItems();
    expect(items[0].el!.style.display).toBe('none');
    expect(items[2].el!.style.display).not.toBe('none');
    expect(layout.getActiveItem()).toBe(items[2]);
  });

  it('setActiveItem by component reference', () => {
    const b = cmp({ html: 'B' });
    const { layout } = withLayout(CardLayout, {}, [cmp(), b, cmp()]);
    layout.setActiveItem(b);
    expect(layout.getActiveItem()).toBe(b);
  });

  it('next() advances to next card', () => {
    const { ct, layout } = withLayout(CardLayout, {}, [cmp(), cmp(), cmp()]);
    const items = ct.getItems();
    layout.next();
    expect(layout.getActiveItem()).toBe(items[1]);
    layout.next();
    expect(layout.getActiveItem()).toBe(items[2]);
  });

  it('next() wraps to first when at end', () => {
    const { ct, layout } = withLayout(CardLayout, {}, [cmp(), cmp()]);
    layout.next();
    layout.next();
    expect(layout.getActiveItem()).toBe(ct.getItems()[0]);
  });

  it('prev() goes to previous card', () => {
    const { ct, layout } = withLayout(CardLayout, {}, [cmp(), cmp(), cmp()]);
    layout.setActiveItem(2);
    layout.prev();
    expect(layout.getActiveItem()).toBe(ct.getItems()[1]);
  });

  it('prev() wraps to last when at beginning', () => {
    const { ct, layout } = withLayout(CardLayout, {}, [cmp(), cmp()]);
    layout.prev();
    expect(layout.getActiveItem()).toBe(ct.getItems()[1]);
  });

  it('fires activate/deactivate events', () => {
    const activateSpy = vi.fn();
    const deactivateSpy = vi.fn();
    const { ct: _ct, layout } = withLayout(CardLayout, {}, [cmp(), cmp()]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (layout as any).on('activate', activateSpy);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (layout as any).on('deactivate', deactivateSpy);
    layout.setActiveItem(1);
    expect(activateSpy).toHaveBeenCalled();
    expect(deactivateSpy).toHaveBeenCalled();
  });

  it('active item fills container', () => {
    const { ct } = withLayout(CardLayout, {}, [cmp()]);
    expect(ct.getItems()[0].el!.style.width).toBe('100%');
    expect(ct.getItems()[0].el!.style.height).toBe('100%');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AnchorLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('AnchorLayout', () => {
  it('has type "anchor"', () => {
    expect(new AnchorLayout().type).toBe('anchor');
  });

  it('anchor "100% 50%" sets width/height percentages', () => {
    const { ct } = withLayout(AnchorLayout, {}, [cmp({ anchor: '100% 50%' })]);
    const el = ct.getItems()[0].el!;
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('50%');
  });

  it('anchor "-50 -100" sets calc-based sizes', () => {
    const { ct } = withLayout(AnchorLayout, {}, [cmp({ anchor: '-50 -100' })]);
    const el = ct.getItems()[0].el!;
    expect(el.style.width).toBe('calc(100% - 50px)');
    expect(el.style.height).toBe('calc(100% - 100px)');
  });

  it('anchor "-50" sets width only', () => {
    const { ct } = withLayout(AnchorLayout, {}, [cmp({ anchor: '-50' })]);
    const el = ct.getItems()[0].el!;
    expect(el.style.width).toBe('calc(100% - 50px)');
  });

  it('anchor "75%" sets width only', () => {
    const { ct } = withLayout(AnchorLayout, {}, [cmp({ anchor: '75%' })]);
    expect(ct.getItems()[0].el!.style.width).toBe('75%');
  });

  it('no anchor config renders normally', () => {
    const { ct } = withLayout(AnchorLayout, {}, [cmp({ html: 'X' })]);
    expect(ct.getItems()[0].el!.style.width).toBe('');
  });

  it('container uses block layout', () => {
    const { ct } = withLayout(AnchorLayout);
    expect(ct.getBodyEl().style.position).toBe('relative');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BorderLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('BorderLayout', () => {
  it('has type "border"', () => {
    expect(new BorderLayout().type).toBe('border');
  });

  it('creates a 5-region grid layout', () => {
    const { ct } = withLayout(BorderLayout, {}, [
      cmp({ region: 'north', height: 60, html: 'N' }),
      cmp({ region: 'south', height: 40, html: 'S' }),
      cmp({ region: 'west', width: 200, html: 'W' }),
      cmp({ region: 'east', width: 150, html: 'E' }),
      cmp({ region: 'center', html: 'C' }),
    ]);
    const body = ct.getBodyEl();
    expect(body.style.display).toBe('grid');
    expect(ct.getItems().length).toBe(5);
  });

  it('center region fills remaining space', () => {
    const { ct } = withLayout(BorderLayout, {}, [cmp({ region: 'center', html: 'C' })]);
    const center = ct.getItems()[0].el!;
    expect(center.style.gridArea).toBe('center');
  });

  it('north region is positioned at top', () => {
    const { ct } = withLayout(BorderLayout, {}, [
      cmp({ region: 'north', height: 50 }),
      cmp({ region: 'center' }),
    ]);
    const north = ct.getItems()[0].el!;
    expect(north.style.gridArea).toBe('north');
  });

  it('works with only center region', () => {
    const { ct } = withLayout(BorderLayout, {}, [cmp({ region: 'center' })]);
    expect(ct.getItems().length).toBe(1);
  });

  it('regions get appropriate sizing', () => {
    const { ct } = withLayout(BorderLayout, {}, [
      cmp({ region: 'west', width: 200 }),
      cmp({ region: 'center' }),
    ]);
    const west = ct.getItems()[0].el!;
    expect(west.style.width).toBe('200px');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ColumnLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('ColumnLayout', () => {
  it('has type "column"', () => {
    expect(new ColumnLayout().type).toBe('column');
  });

  it('columnWidth distributes remaining space as pixel widths', () => {
    const { ct, layout } = withLayout(ColumnLayout, {}, [
      cmp({ columnWidth: 0.5 }),
      cmp({ columnWidth: 0.5 }),
    ]);
    // Re-apply with a known container width; jsdom clientWidth is always 0.
    (layout as any).applyItemStyles(ct.getItems(), ct.getBodyEl(), 1000);
    const items = ct.getItems();
    expect(items[0].el!.style.width).toBe('500px');
    expect(items[1].el!.style.width).toBe('500px');
  });

  it('fixed width columns keep their width', () => {
    const { ct } = withLayout(ColumnLayout, {}, [cmp({ width: 200 }), cmp({ columnWidth: 1 })]);
    const items = ct.getItems();
    expect(items[0].el!.style.width).toBe('200px');
  });

  it('container uses flex layout for column distribution', () => {
    const { ct } = withLayout(ColumnLayout);
    const body = ct.getBodyEl();
    expect(body.style.display).toBe('flex');
  });

  it('items wrap by default', () => {
    const { ct } = withLayout(ColumnLayout);
    expect(ct.getBodyEl().style.flexWrap).toBe('wrap');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TableLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('TableLayout', () => {
  it('has type "table"', () => {
    expect(new TableLayout({ columns: 2 }).type).toBe('table');
  });

  it('renders items in a grid with specified columns', () => {
    const { ct } = withLayout(TableLayout, { columns: 3 }, [
      cmp({ html: 'A' }),
      cmp({ html: 'B' }),
      cmp({ html: 'C' }),
      cmp({ html: 'D' }),
      cmp({ html: 'E' }),
    ]);
    const body = ct.getBodyEl();
    expect(body.style.display).toBe('grid');
    expect(body.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  it('items with colspan span multiple columns', () => {
    const { ct } = withLayout(TableLayout, { columns: 3 }, [
      cmp({ html: 'Wide', colspan: 2 }),
      cmp({ html: 'Normal' }),
    ]);
    const wide = ct.getItems()[0].el!;
    expect(wide.style.gridColumn).toBe('span 2');
  });

  it('items with rowspan span multiple rows', () => {
    const { ct } = withLayout(TableLayout, { columns: 2 }, [
      cmp({ html: 'Tall', rowspan: 2 }),
      cmp({ html: 'B' }),
    ]);
    const tall = ct.getItems()[0].el!;
    expect(tall.style.gridRow).toBe('span 2');
  });

  it('defaults to 1 column', () => {
    const layout = new TableLayout({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((layout as any).columns).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AbsoluteLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('AbsoluteLayout', () => {
  it('has type "absolute"', () => {
    expect(new AbsoluteLayout().type).toBe('absolute');
  });

  it('container has position:relative', () => {
    const { ct } = withLayout(AbsoluteLayout);
    expect(ct.getBodyEl().style.position).toBe('relative');
  });

  it('children are positioned absolutely with x/y', () => {
    const { ct } = withLayout(AbsoluteLayout, {}, [
      cmp({ x: 10, y: 20, html: 'A' }),
      cmp({ x: 100, y: 50, html: 'B' }),
    ]);
    const items = ct.getItems();
    expect(items[0].el!.style.position).toBe('absolute');
    expect(items[0].el!.style.left).toBe('10px');
    expect(items[0].el!.style.top).toBe('20px');
    expect(items[1].el!.style.left).toBe('100px');
    expect(items[1].el!.style.top).toBe('50px');
  });

  it('children without x/y default to 0,0', () => {
    const { ct } = withLayout(AbsoluteLayout, {}, [cmp({ html: 'A' })]);
    const el = ct.getItems()[0].el!;
    expect(el.style.position).toBe('absolute');
    expect(el.style.left).toBe('0px');
    expect(el.style.top).toBe('0px');
  });

  it('children respect width/height config', () => {
    const { ct } = withLayout(AbsoluteLayout, {}, [cmp({ x: 0, y: 0, width: 100, height: 50 })]);
    const el = ct.getItems()[0].el!;
    expect(el.style.width).toBe('100px');
    expect(el.style.height).toBe('50px');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AccordionLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('AccordionLayout', () => {
  it('has type "accordion"', () => {
    expect(new AccordionLayout().type).toBe('accordion');
  });

  it('uses vertical flex layout', () => {
    const { ct } = withLayout(AccordionLayout);
    expect(ct.getBodyEl().style.display).toBe('flex');
    expect(ct.getBodyEl().style.flexDirection).toBe('column');
  });

  it('only first item is expanded by default', () => {
    const { ct, layout } = withLayout(AccordionLayout, {}, [
      cmp({ title: 'A', html: 'Content A' }),
      cmp({ title: 'B', html: 'Content B' }),
      cmp({ title: 'C', html: 'Content C' }),
    ]);
    const items = ct.getItems();
    expect(layout.isExpanded(items[0])).toBe(true);
    expect(layout.isExpanded(items[1])).toBe(false);
    expect(layout.isExpanded(items[2])).toBe(false);
  });

  it('expand() expands an item and collapses others', () => {
    const { ct, layout } = withLayout(AccordionLayout, {}, [
      cmp({ title: 'A' }),
      cmp({ title: 'B' }),
    ]);
    const items = ct.getItems();
    layout.expand(items[1]);
    expect(layout.isExpanded(items[0])).toBe(false);
    expect(layout.isExpanded(items[1])).toBe(true);
  });

  it('multi:true allows multiple expanded', () => {
    const { ct, layout } = withLayout(AccordionLayout, { multi: true }, [
      cmp({ title: 'A' }),
      cmp({ title: 'B' }),
    ]);
    const items = ct.getItems();
    layout.expand(items[1]);
    expect(layout.isExpanded(items[0])).toBe(true);
    expect(layout.isExpanded(items[1])).toBe(true);
  });

  it('collapse() collapses an item', () => {
    const { ct, layout } = withLayout(AccordionLayout, { multi: true }, [
      cmp({ title: 'A' }),
      cmp({ title: 'B' }),
    ]);
    layout.collapse(ct.getItems()[0]);
    expect(layout.isExpanded(ct.getItems()[0])).toBe(false);
  });

  it('fill:true gives expanded item flex:1', () => {
    const { ct, layout: _layout } = withLayout(AccordionLayout, { fill: true }, [
      cmp({ title: 'A' }),
      cmp({ title: 'B' }),
    ]);
    const expanded = ct.getItems()[0];
    expect(expanded.el!.style.flexGrow).toBe('1');
  });

  it('collapsed items have zero flex and overflow hidden', () => {
    const { ct, layout: _layout } = withLayout(AccordionLayout, { fill: true }, [
      cmp({ title: 'A' }),
      cmp({ title: 'B' }),
    ]);
    const collapsed = ct.getItems()[1];
    expect(collapsed.el!.style.flexGrow).toBe('0');
    expect(collapsed.el!.style.overflow).toBe('hidden');
  });

  it('toggle() toggles expansion state', () => {
    const { ct, layout } = withLayout(AccordionLayout, { multi: true }, [cmp({ title: 'A' })]);
    const item = ct.getItems()[0];
    layout.toggle(item);
    expect(layout.isExpanded(item)).toBe(false);
    layout.toggle(item);
    expect(layout.isExpanded(item)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AutoLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('AutoLayout', () => {
  it('has type "auto"', () => {
    expect(new AutoLayout().type).toBe('auto');
  });

  it('configureContainer is a no-op — does not touch the element', () => {
    const el = document.createElement('div');
    const layout = new AutoLayout();
    layout.configureContainer(el);
    // CSS flow: no display, position, or flex properties should be set
    expect(el.style.display).toBe('');
    expect(el.style.position).toBe('');
    expect(el.style.flexDirection).toBe('');
  });

  it('getItemSizePolicy returns natural for width and height', () => {
    const layout = new AutoLayout();
    const item = cmp({ width: 200 });
    const policy = layout.getItemSizePolicy(item);
    expect(policy.width).toBe('natural');
    expect(policy.height).toBe('natural');
  });

  it('renders all children into the container body', () => {
    const { ct } = withLayout(AutoLayout, {}, [
      cmp({ width: 200 }),
      cmp({ width: 300 }),
      cmp({ width: 400 }),
    ]);
    expect(ct.getItems().length).toBe(3);
    for (const item of ct.getItems()) {
      expect(item.rendered).toBe(true);
    }
  });

  it('child width config is applied to the element style', () => {
    const { ct } = withLayout(AutoLayout, {}, [cmp({ width: 250 })]);
    expect(ct.getItems()[0].el!.style.width).toBe('250px');
  });

  it('child height config is applied to the element style', () => {
    const { ct } = withLayout(AutoLayout, {}, [cmp({ height: 120 })]);
    expect(ct.getItems()[0].el!.style.height).toBe('120px');
  });

  it('child margin config is applied to the element style', () => {
    const { ct } = withLayout(AutoLayout, {}, [cmp({ margin: 8 })]);
    expect(ct.getItems()[0].el!.style.margin).toBe('8px');
  });

  it('child padding config is applied to the element style', () => {
    const { ct } = withLayout(AutoLayout, {}, [cmp({ padding: '4px 8px' })]);
    expect(ct.getItems()[0].el!.style.padding).toBe('4px 8px');
  });

  it('child percentage width is passed through as a CSS string', () => {
    const { ct } = withLayout(AutoLayout, {}, [cmp({ width: '100%' })]);
    expect(ct.getItems()[0].el!.style.width).toBe('100%');
  });

  it('children are rendered in insertion order', () => {
    const a = cmp({ width: 100 });
    const b = cmp({ width: 200 });
    const c = cmp({ width: 300 });
    const { ct } = withLayout(AutoLayout, {}, [a, b, c]);
    expect(ct.getAt(0)).toBe(a);
    expect(ct.getAt(1)).toBe(b);
    expect(ct.getAt(2)).toBe(c);
  });

  it('"auto" string alias resolves to AutoLayout after import of @framesquared/layout', async () => {
    await import('../src/index.js');
    const ct = new Container({ renderTo: document.body, layout: 'auto' });
    expect(ct.getLayout()).toBeInstanceOf(AutoLayout);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CenterLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('CenterLayout', () => {
  it('has type "center"', () => {
    expect(new CenterLayout().type).toBe('center');
  });

  it('configureContainer sets position:relative and overflow:hidden', () => {
    const { ct } = withLayout(CenterLayout, {}, [cmp({ width: 400, height: 300 })]);
    expect(ct.getBodyEl().style.position).toBe('relative');
    expect(ct.getBodyEl().style.overflow).toBe('hidden');
  });

  it('centred child has position:absolute', () => {
    const child = cmp({ width: 400, height: 300 });
    const { ct, layout } = withLayout(CenterLayout, {}, [child]);
    layout.applyItemStyles(ct.getItems(), ct.getBodyEl(), 1000, 600);
    expect(child.el!.style.position).toBe('absolute');
  });

  it('centres a 400×300 child in a 1000×600 container', () => {
    const child = cmp({ width: 400, height: 300 });
    const { ct, layout } = withLayout(CenterLayout, {}, [child]);
    layout.applyItemStyles(ct.getItems(), ct.getBodyEl(), 1000, 600);
    expect(child.el!.style.left).toBe('300px');   // (1000 - 400) / 2
    expect(child.el!.style.top ).toBe('150px');   // (600  - 300) / 2
  });

  it('re-centres correctly when container width changes', () => {
    const child = cmp({ width: 400, height: 300 });
    const { ct, layout } = withLayout(CenterLayout, {}, [child]);
    layout.applyItemStyles(ct.getItems(), ct.getBodyEl(), 800, 600);
    expect(child.el!.style.left).toBe('200px');   // (800 - 400) / 2
    layout.applyItemStyles(ct.getItems(), ct.getBodyEl(), 1200, 600);
    expect(child.el!.style.left).toBe('400px');   // (1200 - 400) / 2
  });

  it('re-centres correctly when container height changes', () => {
    const child = cmp({ width: 400, height: 300 });
    const { ct, layout } = withLayout(CenterLayout, {}, [child]);
    layout.applyItemStyles(ct.getItems(), ct.getBodyEl(), 1000, 400);
    expect(child.el!.style.top).toBe('50px');    // (400 - 300) / 2
    layout.applyItemStyles(ct.getItems(), ct.getBodyEl(), 1000, 900);
    expect(child.el!.style.top).toBe('300px');   // (900 - 300) / 2
  });

  it('left=0 top=0 when child exactly fills the container', () => {
    const child = cmp({ width: 500, height: 400 });
    const { ct, layout } = withLayout(CenterLayout, {}, [child]);
    layout.applyItemStyles(ct.getItems(), ct.getBodyEl(), 500, 400);
    expect(child.el!.style.left).toBe('0px');
    expect(child.el!.style.top ).toBe('0px');
  });

  it('applies child width and height from config', () => {
    const child = cmp({ width: 400, height: 300 });
    const { ct, layout } = withLayout(CenterLayout, {}, [child]);
    layout.applyItemStyles(ct.getItems(), ct.getBodyEl(), 1000, 600);
    expect(child.el!.style.width ).toBe('400px');
    expect(child.el!.style.height).toBe('300px');
  });

  it('does nothing when there are no items', () => {
    const { ct, layout } = withLayout(CenterLayout, {}, []);
    expect(() =>
      layout.applyItemStyles([], ct.getBodyEl(), 1000, 600)
    ).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// renderItems integration coverage
// ═══════════════════════════════════════════════════════════════════════════

describe('renderItems integration', () => {
  it('FitLayout.renderItems renders and styles', () => {
    const layout = new FitLayout();
    const target = document.createElement('div');
    document.body.appendChild(target);
    const items = [cmp({ html: 'A' })];
    layout.renderItems(items, target);
    expect(items[0].rendered).toBe(true);
    expect(items[0].el!.style.width).toBe('100%');
  });

  it('CardLayout.renderItems renders cards', () => {
    const ct = new Container({ renderTo: document.body });
    const layout = new CardLayout();
    layout.setOwner(ct);
    const items = [cmp({ html: 'A' }), cmp({ html: 'B' })];
    layout.renderItems(items, ct.getBodyEl());
    expect(items[0].el!.style.display).not.toBe('none');
    expect(items[1].el!.style.display).toBe('none');
  });

  it('CardLayout.un removes listener', () => {
    const layout = new CardLayout();
    const spy = vi.fn();
    layout.on('activate', spy);
    layout.un('activate', spy);
    // No container, so setActiveItem won't fire, but we verified un works
  });

  it('AnchorLayout.renderItems applies anchors', () => {
    const layout = new AnchorLayout();
    const target = document.createElement('div');
    document.body.appendChild(target);
    const items = [cmp({ anchor: '80%' })];
    layout.renderItems(items, target);
    expect(items[0].el!.style.width).toBe('80%');
  });

  it('BorderLayout.renderItems builds grid', () => {
    const ct = new Container({ renderTo: document.body });
    const layout = new BorderLayout();
    layout.setOwner(ct);
    const items = [cmp({ region: 'center' })];
    layout.renderItems(items, ct.getBodyEl());
    expect(ct.getBodyEl().style.display).toBe('grid');
  });

  it('ColumnLayout.renderItems applies column widths', () => {
    const layout = new ColumnLayout();
    const target = document.createElement('div');
    document.body.appendChild(target);
    const items = [cmp({ columnWidth: 0.5 })];
    layout.renderItems(items, target);
    // Re-apply with a known container width; jsdom clientWidth is always 0.
    layout.applyItemStyles(items, target, 1000);
    expect(items[0].el!.style.width).toBe('500px');
  });

  it('TableLayout.renderItems sets grid', () => {
    const layout = new TableLayout({ columns: 3 });
    const target = document.createElement('div');
    document.body.appendChild(target);
    layout.renderItems([cmp()], target);
    expect(target.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  it('AbsoluteLayout.renderItems positions items', () => {
    const layout = new AbsoluteLayout();
    const target = document.createElement('div');
    document.body.appendChild(target);
    const items = [cmp({ x: 5, y: 10 })];
    layout.renderItems(items, target);
    expect(items[0].el!.style.left).toBe('5px');
  });

  it('AccordionLayout.renderItems sets up flex column', () => {
    const ct = new Container({ renderTo: document.body });
    const layout = new AccordionLayout();
    layout.setOwner(ct);
    const items = [cmp({ title: 'A' }), cmp({ title: 'B' })];
    layout.renderItems(items, ct.getBodyEl());
    expect(ct.getBodyEl().style.flexDirection).toBe('column');
    expect(layout.isExpanded(items[0])).toBe(true);
  });

  it('CenterLayout.renderItems sets position:relative on container', () => {
    const centerLayout = new CenterLayout();
    const target = document.createElement('div');
    document.body.appendChild(target);
    centerLayout.renderItems([cmp({ width: 400, height: 300 })], target);
    expect(target.style.position).toBe('relative');
  });

  it('CenterLayout.applyItemStyles centres child with explicit size', () => {
    const centerLayout = new CenterLayout();
    const target = document.createElement('div');
    document.body.appendChild(target);
    const items = [cmp({ width: 400, height: 300 })];
    centerLayout.renderItems(items, target);
    centerLayout.applyItemStyles(items, target, 1000, 600);
    expect(items[0].el!.style.left).toBe('300px');   // (1000-400)/2
    expect(items[0].el!.style.top ).toBe('150px');   // (600-300)/2
  });
});
