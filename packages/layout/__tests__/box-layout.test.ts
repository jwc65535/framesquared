import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Component, Container } from '@framesquared/component';
import { HBoxLayout } from '../src/box/HBoxLayout.js';
import { VBoxLayout } from '../src/box/VBoxLayout.js';
import { LayoutContext } from '../src/LayoutContext.js';

// ResizeObserver mock
class MockRO {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => { (globalThis as any).ResizeObserver = MockRO; });
afterEach(() => { document.body.innerHTML = ''; });

// Helpers
function cmp(cfg: Record<string, unknown> = {}): Component {
  return new Component(cfg);
}

function hboxContainer(layoutCfg: Record<string, unknown> = {}, items: Component[] = []): Container {
  const c = new Container({ renderTo: document.body });
  const layout = new HBoxLayout(layoutCfg);
  layout.setOwner(c);
  (c as any)._layoutInstance = layout;
  // Apply flex layout to body element
  layout.configureContainer(c.getBodyEl());
  for (const item of items) {
    c.add(item);
  }
  layout.applyItemStyles(c.getItems(), c.getBodyEl());
  return c;
}

function vboxContainer(layoutCfg: Record<string, unknown> = {}, items: Component[] = []): Container {
  const c = new Container({ renderTo: document.body });
  const layout = new VBoxLayout(layoutCfg);
  layout.setOwner(c);
  (c as any)._layoutInstance = layout;
  layout.configureContainer(c.getBodyEl());
  for (const item of items) {
    c.add(item);
  }
  layout.applyItemStyles(c.getItems(), c.getBodyEl());
  return c;
}

// ═══════════════════════════════════════════════════════════════════════════
// HBoxLayout — basics
// ═══════════════════════════════════════════════════════════════════════════

describe('HBoxLayout — basics', () => {
  it('has type "hbox"', () => {
    const layout = new HBoxLayout();
    expect(layout.type).toBe('hbox');
  });

  it('sets display:flex and flex-direction:row on container', () => {
    const c = hboxContainer();
    const body = c.getBodyEl();
    expect(body.style.display).toBe('flex');
    expect(body.style.flexDirection).toBe('row');
  });

  it('renders items into the container', () => {
    const c = hboxContainer({}, [
      cmp({ html: 'A' }),
      cmp({ html: 'B' }),
      cmp({ html: 'C' }),
    ]);
    expect(c.getBodyEl().children.length).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HBoxLayout — flex distribution
// ═══════════════════════════════════════════════════════════════════════════

describe('HBoxLayout — flex', () => {
  it('items with flex get flex-grow set', () => {
    const c = hboxContainer({}, [
      cmp({ flex: 1 }),
      cmp({ flex: 2 }),
      cmp({ flex: 1 }),
    ]);
    const items = c.getItems();
    expect(items[0].el!.style.flexGrow).toBe('1');
    expect(items[1].el!.style.flexGrow).toBe('2');
    expect(items[2].el!.style.flexGrow).toBe('1');
  });

  it('flex items get flex-basis:0 for proportional sizing', () => {
    const c = hboxContainer({}, [
      cmp({ flex: 1 }),
    ]);
    expect(c.getItems()[0].el!.style.flexBasis).toBe('0px');
  });

  it('items without flex keep their configured width', () => {
    const c = hboxContainer({}, [
      cmp({ width: 100 }),
      cmp({ flex: 1 }),
    ]);
    const items = c.getItems();
    expect(items[0].el!.style.width).toBe('100px');
    expect(items[0].el!.style.flexGrow).not.toBe('1');
    expect(items[1].el!.style.flexGrow).toBe('1');
  });

  it('mixed fixed + flex: fixed items have flex-shrink:0', () => {
    const c = hboxContainer({}, [
      cmp({ width: 200 }),
      cmp({ flex: 1 }),
    ]);
    expect(c.getItems()[0].el!.style.flexShrink).toBe('0');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HBoxLayout — min/max constraints
// ═══════════════════════════════════════════════════════════════════════════

describe('HBoxLayout — min/max constraints', () => {
  it('minWidth is applied to flex items', () => {
    const c = hboxContainer({}, [
      cmp({ flex: 1, minWidth: 50 }),
    ]);
    expect(c.getItems()[0].el!.style.minWidth).toBe('50px');
  });

  it('maxWidth is applied to flex items', () => {
    const c = hboxContainer({}, [
      cmp({ flex: 1, maxWidth: 300 }),
    ]);
    expect(c.getItems()[0].el!.style.maxWidth).toBe('300px');
  });

  it('minHeight is applied', () => {
    const c = hboxContainer({}, [
      cmp({ flex: 1, minHeight: 40 }),
    ]);
    expect(c.getItems()[0].el!.style.minHeight).toBe('40px');
  });

  it('maxHeight is applied', () => {
    const c = hboxContainer({}, [
      cmp({ flex: 1, maxHeight: 200 }),
    ]);
    expect(c.getItems()[0].el!.style.maxHeight).toBe('200px');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HBoxLayout — align (cross-axis)
// ═══════════════════════════════════════════════════════════════════════════

describe('HBoxLayout — align', () => {
  it('align: "stretch" sets align-items:stretch', () => {
    const c = hboxContainer({ align: 'stretch' });
    expect(c.getBodyEl().style.alignItems).toBe('stretch');
  });

  it('align: "center" sets align-items:center', () => {
    const c = hboxContainer({ align: 'center' });
    expect(c.getBodyEl().style.alignItems).toBe('center');
  });

  it('align: "start" sets align-items:flex-start', () => {
    const c = hboxContainer({ align: 'start' });
    expect(c.getBodyEl().style.alignItems).toBe('flex-start');
  });

  it('align: "end" sets align-items:flex-end', () => {
    const c = hboxContainer({ align: 'end' });
    expect(c.getBodyEl().style.alignItems).toBe('flex-end');
  });

  it('align: "stretchmax" sets align-items:stretch', () => {
    const c = hboxContainer({ align: 'stretchmax' });
    expect(c.getBodyEl().style.alignItems).toBe('stretch');
  });

  it('default align is stretch', () => {
    const c = hboxContainer({});
    expect(c.getBodyEl().style.alignItems).toBe('stretch');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HBoxLayout — pack (main-axis)
// ═══════════════════════════════════════════════════════════════════════════

describe('HBoxLayout — pack', () => {
  it('pack: "start" sets justify-content:flex-start', () => {
    const c = hboxContainer({ pack: 'start' });
    expect(c.getBodyEl().style.justifyContent).toBe('flex-start');
  });

  it('pack: "center" sets justify-content:center', () => {
    const c = hboxContainer({ pack: 'center' });
    expect(c.getBodyEl().style.justifyContent).toBe('center');
  });

  it('pack: "end" sets justify-content:flex-end', () => {
    const c = hboxContainer({ pack: 'end' });
    expect(c.getBodyEl().style.justifyContent).toBe('flex-end');
  });

  it('pack: "space-between"', () => {
    const c = hboxContainer({ pack: 'space-between' });
    expect(c.getBodyEl().style.justifyContent).toBe('space-between');
  });

  it('pack: "space-around"', () => {
    const c = hboxContainer({ pack: 'space-around' });
    expect(c.getBodyEl().style.justifyContent).toBe('space-around');
  });

  it('pack: "space-evenly"', () => {
    const c = hboxContainer({ pack: 'space-evenly' });
    expect(c.getBodyEl().style.justifyContent).toBe('space-evenly');
  });

  it('default pack is start', () => {
    const c = hboxContainer({});
    expect(c.getBodyEl().style.justifyContent).toBe('flex-start');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HBoxLayout — gap
// ═══════════════════════════════════════════════════════════════════════════

describe('HBoxLayout — gap', () => {
  it('gap sets CSS gap property', () => {
    const c = hboxContainer({ gap: 10 });
    expect(c.getBodyEl().style.gap).toBe('10px');
  });

  it('gap defaults to 0 (no gap property set)', () => {
    const c = hboxContainer({});
    expect(c.getBodyEl().style.gap).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HBoxLayout — reverse
// ═══════════════════════════════════════════════════════════════════════════

describe('HBoxLayout — reverse', () => {
  it('reverse:true sets flex-direction:row-reverse', () => {
    const c = hboxContainer({ reverse: true });
    expect(c.getBodyEl().style.flexDirection).toBe('row-reverse');
  });

  it('reverse:false keeps flex-direction:row', () => {
    const c = hboxContainer({ reverse: false });
    expect(c.getBodyEl().style.flexDirection).toBe('row');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HBoxLayout — overflow
// ═══════════════════════════════════════════════════════════════════════════

describe('HBoxLayout — overflow', () => {
  it('overflow: "wrap" sets flex-wrap:wrap', () => {
    const c = hboxContainer({ overflow: 'wrap' });
    expect(c.getBodyEl().style.flexWrap).toBe('wrap');
  });

  it('overflow: "hidden" sets overflow:hidden', () => {
    const c = hboxContainer({ overflow: 'hidden' });
    expect(c.getBodyEl().style.overflow).toBe('hidden');
  });

  it('overflow: "scroll" sets overflow:auto', () => {
    const c = hboxContainer({ overflow: 'scroll' });
    expect(c.getBodyEl().style.overflow).toBe('auto');
  });

  it('overflow: "visible" (default)', () => {
    const c = hboxContainer({});
    // No overflow set
    expect(c.getBodyEl().style.flexWrap).not.toBe('wrap');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VBoxLayout
// ═══════════════════════════════════════════════════════════════════════════

describe('VBoxLayout — basics', () => {
  it('has type "vbox"', () => {
    const layout = new VBoxLayout();
    expect(layout.type).toBe('vbox');
  });

  it('sets flex-direction:column', () => {
    const c = vboxContainer();
    expect(c.getBodyEl().style.flexDirection).toBe('column');
  });

  it('items with flex get flex-grow on vertical axis', () => {
    const c = vboxContainer({}, [
      cmp({ flex: 1 }),
      cmp({ flex: 1 }),
      cmp({ flex: 1 }),
    ]);
    const items = c.getItems();
    expect(items[0].el!.style.flexGrow).toBe('1');
    expect(items[1].el!.style.flexGrow).toBe('1');
    expect(items[2].el!.style.flexGrow).toBe('1');
  });

  it('fixed height items in vbox', () => {
    const c = vboxContainer({}, [
      cmp({ height: 50 }),
      cmp({ flex: 1 }),
    ]);
    const items = c.getItems();
    expect(items[0].el!.style.height).toBe('50px');
    expect(items[0].el!.style.flexShrink).toBe('0');
    expect(items[1].el!.style.flexGrow).toBe('1');
  });

  it('reverse:true sets flex-direction:column-reverse', () => {
    const c = vboxContainer({ reverse: true });
    expect(c.getBodyEl().style.flexDirection).toBe('column-reverse');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// VBoxLayout — align and pack
// ═══════════════════════════════════════════════════════════════════════════

describe('VBoxLayout — align and pack', () => {
  it('align stretches on horizontal axis (cross-axis for vbox)', () => {
    const c = vboxContainer({ align: 'stretch' });
    expect(c.getBodyEl().style.alignItems).toBe('stretch');
  });

  it('pack: "center" centers vertically', () => {
    const c = vboxContainer({ pack: 'center' });
    expect(c.getBodyEl().style.justifyContent).toBe('center');
  });

  it('gap applies between vertical items', () => {
    const c = vboxContainer({ gap: 8 });
    expect(c.getBodyEl().style.gap).toBe('8px');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Layout lifecycle integration
// ═══════════════════════════════════════════════════════════════════════════

describe('Layout lifecycle', () => {
  it('beginLayout / calculate / completeLayout / afterLayout works', () => {
    const layout = new HBoxLayout();
    const ctx = new LayoutContext();
    layout.beginLayout(ctx);
    expect(layout.isRunning).toBe(true);
    layout.calculate(ctx);
    layout.completeLayout(ctx);
    expect(layout.isRunning).toBe(false);
    expect(layout.needsLayout).toBe(false);
    layout.afterLayout();
  });

  it('renderItems renders children into target with flex styles', () => {
    const layout = new HBoxLayout();
    const target = document.createElement('div');
    document.body.appendChild(target);
    layout.configureContainer(target);

    const items = [cmp({ flex: 1, html: 'A' }), cmp({ flex: 2, html: 'B' })];
    layout.renderItems(items, target);
    layout.applyItemStyles(items, target);

    expect(target.style.display).toBe('flex');
    expect(target.children.length).toBe(2);
    expect(items[0].el!.style.flexGrow).toBe('1');
    expect(items[1].el!.style.flexGrow).toBe('2');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SizePolicy for box layouts
// ═══════════════════════════════════════════════════════════════════════════

describe('SizePolicy', () => {
  it('HBox: flex item has shrinkWrap width policy', () => {
    const layout = new HBoxLayout();
    const item = cmp({ flex: 1 });
    const policy = layout.getItemSizePolicy(item);
    expect(policy.width).toBe('shrinkWrap');
  });

  it('HBox: configured-width item has configured width policy', () => {
    const layout = new HBoxLayout();
    const item = cmp({ width: 100 });
    const policy = layout.getItemSizePolicy(item);
    expect(policy.width).toBe('configured');
  });

  it('VBox: flex item has shrinkWrap height policy', () => {
    const layout = new VBoxLayout();
    const item = cmp({ flex: 1 });
    const policy = layout.getItemSizePolicy(item);
    expect(policy.height).toBe('shrinkWrap');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Nested box layouts
// ═══════════════════════════════════════════════════════════════════════════

describe('Nested box layouts', () => {
  it('VBox inside HBox', () => {
    // Outer: HBox
    const outer = new Container({ renderTo: document.body });
    const hLayout = new HBoxLayout();
    hLayout.setOwner(outer);
    hLayout.configureContainer(outer.getBodyEl());

    // Inner: VBox container
    const inner = new Container({ flex: 1 });
    const vLayout = new VBoxLayout();
    vLayout.setOwner(inner);

    outer.add(inner);
    hLayout.applyItemStyles(outer.getItems(), outer.getBodyEl());

    // Inner should be flex:1 in horizontal direction
    expect(inner.el!.style.flexGrow).toBe('1');

    // Configure inner as vbox
    vLayout.configureContainer(inner.getBodyEl?.() ?? inner.el!);

    // Add children to inner
    inner.add(cmp({ flex: 1, html: 'Top' }));
    inner.add(cmp({ flex: 1, html: 'Bottom' }));

    const innerBody = inner.getBodyEl?.() ?? inner.el!;
    vLayout.applyItemStyles(inner.getItems(), innerBody);

    expect(innerBody.style.flexDirection).toBe('column');
    expect(inner.getItems()[0].el!.style.flexGrow).toBe('1');
  });
});
