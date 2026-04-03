import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Component } from '../src/Component.js';
import { Container } from '../src/Container.js';
import { ComponentQuery } from '../src/ComponentQuery.js';

// ResizeObserver mock
class MockResizeObserver {
  callback: ResizeObserverCallback;
  static instances: MockResizeObserver[] = [];
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    MockResizeObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  MockResizeObserver.instances = [];
  (globalThis as any).ResizeObserver = MockResizeObserver;
});

afterEach(() => {
  document.body.innerHTML = '';
});

// Helpers
function cmp(config: Record<string, unknown> = {}): Component {
  return new Component(config);
}

function ct(config: Record<string, unknown> = {}): Container {
  return new Container({ renderTo: document.body, ...config });
}

// ═══════════════════════════════════════════════════════════════════════════
// Child management
// ═══════════════════════════════════════════════════════════════════════════

describe('Container child management', () => {
  it('starts with empty items', () => {
    const c = ct();
    expect(c.getCount()).toBe(0);
    expect(c.getItems()).toEqual([]);
  });

  it('items config adds children on construction', () => {
    const c = ct({
      items: [new Component({ html: 'A' }), new Component({ html: 'B' })],
    });
    expect(c.getCount()).toBe(2);
  });

  it('add() adds Component instances', () => {
    const c = ct();
    const child = cmp({ html: 'child' });
    const added = c.add(child);
    expect(added.length).toBe(1);
    expect(c.getCount()).toBe(1);
    expect(c.getAt(0)).toBe(child);
  });

  it('add() accepts config objects and creates Components', () => {
    const c = ct();
    const added = c.add({ html: 'from config' });
    expect(added.length).toBe(1);
    expect(added[0]).toBeInstanceOf(Component);
    expect(c.getCount()).toBe(1);
  });

  it('add() applies defaults to config objects', () => {
    const c = ct({ defaults: { cls: 'default-cls' } });
    const added = c.add({ html: 'test' });
    expect(added[0].el!.classList.contains('default-cls')).toBe(true);
  });

  it('add() multiple items at once', () => {
    const c = ct();
    c.add(cmp({ html: 'A' }), cmp({ html: 'B' }), cmp({ html: 'C' }));
    expect(c.getCount()).toBe(3);
  });

  it('insert() inserts at specific index', () => {
    const c = ct();
    const a = cmp({ html: 'A' });
    const b = cmp({ html: 'B' });
    const mid = cmp({ html: 'mid' });
    c.add(a, b);
    c.insert(1, mid);
    expect(c.getAt(1)).toBe(mid);
    expect(c.getCount()).toBe(3);
  });

  it('insert() with config object', () => {
    const c = ct();
    c.add(cmp({ html: 'A' }));
    const inserted = c.insert(0, { html: 'first' });
    expect(inserted).toBeInstanceOf(Component);
    expect(c.getAt(0)).toBe(inserted);
  });

  it('remove() removes a child', () => {
    const c = ct();
    const child = cmp({ html: 'child' });
    c.add(child);
    const removed = c.remove(child);
    expect(removed).toBe(child);
    expect(c.getCount()).toBe(0);
  });

  it('remove() with destroy=true destroys the child', () => {
    const c = ct();
    const child = cmp({ html: 'child' });
    c.add(child);
    c.remove(child, true);
    expect(child.isDestroyed).toBe(true);
  });

  it('remove() with destroy=false does NOT destroy the child', () => {
    const c = ct();
    const child = cmp({ html: 'child' });
    c.add(child);
    c.remove(child, false);
    expect(child.isDestroyed).toBe(false);
  });

  it('removeAll() removes all children', () => {
    const c = ct();
    c.add(cmp(), cmp(), cmp());
    const removed = c.removeAll();
    expect(removed.length).toBe(3);
    expect(c.getCount()).toBe(0);
  });

  it('removeAll(true) destroys all children', () => {
    const c = ct();
    const a = cmp();
    const b = cmp();
    c.add(a, b);
    c.removeAll(true);
    expect(a.isDestroyed).toBe(true);
    expect(b.isDestroyed).toBe(true);
  });

  it('removeAt() removes by index', () => {
    const c = ct();
    const a = cmp({ html: 'A' });
    const b = cmp({ html: 'B' });
    c.add(a, b);
    const removed = c.removeAt(0);
    expect(removed).toBe(a);
    expect(c.getCount()).toBe(1);
    expect(c.getAt(0)).toBe(b);
  });

  it('indexOf() returns correct index', () => {
    const c = ct();
    const a = cmp();
    const b = cmp();
    c.add(a, b);
    expect(c.indexOf(a)).toBe(0);
    expect(c.indexOf(b)).toBe(1);
  });

  it('contains() checks direct children', () => {
    const c = ct();
    const child = cmp();
    const other = cmp();
    c.add(child);
    expect(c.contains(child)).toBe(true);
    expect(c.contains(other)).toBe(false);
  });

  it('contains(deep=true) checks nested containers', () => {
    const outer = ct();
    const inner = new Container();
    const deep = cmp();
    inner.add(deep);
    outer.add(inner);
    expect(outer.contains(deep, true)).toBe(true);
    expect(outer.contains(deep, false)).toBe(false);
  });

  it('getComponent() finds by componentId', () => {
    const c = ct();
    const child = cmp();
    c.add(child);
    expect(c.getComponent(child.componentId)).toBe(child);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DOM rendering of children
// ═══════════════════════════════════════════════════════════════════════════

describe('Container DOM rendering', () => {
  it('children are rendered into the container body element', () => {
    const c = ct();
    const child = cmp({ html: 'Hello' });
    c.add(child);
    expect(child.rendered).toBe(true);
    expect(child.el!.parentElement).toBe(c.getBodyEl());
  });

  it('child is rendered at correct DOM position on insert', () => {
    const c = ct();
    const a = cmp({ html: 'A' });
    const b = cmp({ html: 'B' });
    c.add(a, b);
    const mid = cmp({ html: 'mid' });
    c.insert(1, mid);
    const bodyChildren = Array.from(c.getBodyEl().children);
    expect(bodyChildren[0]).toBe(a.el);
    expect(bodyChildren[1]).toBe(mid.el);
    expect(bodyChildren[2]).toBe(b.el);
  });

  it('onAdded is called on child when added', () => {
    const c = ct();
    const child = cmp();
    const spy = vi.fn();
    child.onAdded = spy;
    c.add(child);
    expect(spy).toHaveBeenCalledWith(c, 0);
  });

  it('removed child is detached from DOM', () => {
    const c = ct();
    const child = cmp({ html: 'child' });
    c.add(child);
    const el = child.el!;
    c.remove(child);
    expect(c.getBodyEl().contains(el)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════════════════════════════════

describe('Container events', () => {
  it('fires "beforeadd" and "add" on add()', () => {
    const beforeSpy = vi.fn();
    const addSpy = vi.fn();
    const c = ct({ listeners: { beforeadd: beforeSpy, add: addSpy } });
    c.add(cmp());
    expect(beforeSpy).toHaveBeenCalledOnce();
    expect(addSpy).toHaveBeenCalledOnce();
  });

  it('fires "beforeremove" and "remove" on remove()', () => {
    const beforeSpy = vi.fn();
    const removeSpy = vi.fn();
    const c = ct({ listeners: { beforeremove: beforeSpy, remove: removeSpy } });
    const child = cmp();
    c.add(child);
    c.remove(child);
    expect(beforeSpy).toHaveBeenCalledOnce();
    expect(removeSpy).toHaveBeenCalledOnce();
  });

  it('"beforeadd" returning false cancels the add', () => {
    const c = ct();
    (c as any).on('beforeadd', () => false);
    c.add(cmp());
    expect(c.getCount()).toBe(0);
  });

  it('"beforeremove" returning false cancels the remove', () => {
    const c = ct();
    const child = cmp();
    c.add(child);
    (c as any).on('beforeremove', () => false);
    c.remove(child);
    expect(c.getCount()).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Destroy cascade
// ═══════════════════════════════════════════════════════════════════════════

describe('Destroy cascade', () => {
  it('destroying container destroys all children', () => {
    const c = ct();
    const a = cmp();
    const b = cmp();
    c.add(a, b);
    c.destroy();
    expect(a.isDestroyed).toBe(true);
    expect(b.isDestroyed).toBe(true);
  });

  it('destroying nested containers cascades fully', () => {
    const outer = ct();
    const inner = new Container();
    const deep = cmp();
    inner.add(deep);
    outer.add(inner);
    outer.destroy();
    expect(inner.isDestroyed).toBe(true);
    expect(deep.isDestroyed).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Component Query
// ═══════════════════════════════════════════════════════════════════════════

describe('Component Query', () => {
  // Register xtype on Component for query testing
  function typedCmp(xtype: string, extra: Record<string, unknown> = {}): Component {
    return new Component({ xtype, ...extra });
  }

  it('query by xtype', () => {
    const c = ct();
    c.add(typedCmp('button'), typedCmp('textfield'), typedCmp('button'));
    const results = c.query('button');
    expect(results.length).toBe(2);
  });

  it('query by #id', () => {
    const c = ct();
    const child = cmp();
    c.add(child);
    const results = c.query(`#${child.componentId}`);
    expect(results.length).toBe(1);
    expect(results[0]).toBe(child);
  });

  it('query by .cls', () => {
    const c = ct();
    c.add(cmp({ cls: 'special' }), cmp({ cls: 'other' }), cmp({ cls: 'special' }));
    const results = c.query('.special');
    expect(results.length).toBe(2);
  });

  it('query by [property=value]', () => {
    const c = ct();
    c.add(cmp({ hidden: true }), cmp({ hidden: false }));
    const results = c.query('[hidden=true]');
    expect(results.length).toBe(1);
  });

  it('deep descendant query', () => {
    const outer = ct();
    const inner = new Container();
    inner.add(typedCmp('button'));
    outer.add(inner);
    const results = outer.query('button');
    expect(results.length).toBe(1);
  });

  it('down() returns first match depth-first', () => {
    const c = ct();
    c.add(typedCmp('panel'), typedCmp('button'));
    const found = c.down('button');
    expect(found).toBeDefined();
    expect((found as any)._config.xtype).toBe('button');
  });

  it('down() returns undefined when no match', () => {
    const c = ct();
    c.add(typedCmp('button'));
    expect(c.down('grid')).toBeUndefined();
  });

  it('child() only searches direct children', () => {
    const outer = ct();
    const inner = new Container();
    inner.add(typedCmp('button'));
    outer.add(inner);
    expect(outer.child('button')).toBeUndefined();
    expect(inner.child('button')).toBeDefined();
  });

  it('queryById searches deep', () => {
    const outer = ct();
    const inner = new Container();
    const target = cmp();
    inner.add(target);
    outer.add(inner);
    expect(outer.queryById(target.componentId)).toBe(target);
  });

  it('queryBy with custom function', () => {
    const c = ct();
    c.add(cmp({ width: 100 }), cmp({ width: 200 }), cmp({ width: 300 }));
    const big = c.queryBy((item) => {
      const w = (item as any)._config.width;
      return typeof w === 'number' && w >= 200;
    });
    expect(big.length).toBe(2);
  });

  it('up() walks ancestors', () => {
    const outer = ct({ xtype: 'viewport' });
    const inner = new Container({ xtype: 'panel' });
    const leaf = cmp({ xtype: 'button' });
    inner.add(leaf);
    outer.add(inner);
    const found = leaf.up!('viewport');
    expect(found).toBe(outer);
  });

  it('query direct child combinator ">"', () => {
    const c = ct({ xtype: 'container' });
    const inner = new Container({ xtype: 'panel' });
    inner.add(typedCmp('button', { cls: 'deep' }));
    c.add(inner);
    c.add(typedCmp('button', { cls: 'direct' }));

    // Only direct children
    const direct = c.query('> button');
    expect(direct.length).toBe(1);
    expect(direct[0].hasCls('direct')).toBe(true);
  });

  it('query :not(selector)', () => {
    const c = ct();
    c.add(typedCmp('button'), typedCmp('panel'), typedCmp('button'));
    const results = c.query(':not(button)');
    expect(results.length).toBe(1);
  });

  it('query :first and :last', () => {
    const c = ct();
    const a = typedCmp('button');
    const b = typedCmp('button');
    const p = typedCmp('panel');
    c.add(a, p, b);
    expect(c.query('button:first').length).toBe(1);
    expect(c.query('button:first')[0]).toBe(a);
    expect(c.query('button:last').length).toBe(1);
    expect(c.query('button:last')[0]).toBe(b);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Reference handling
// ═══════════════════════════════════════════════════════════════════════════

describe('Reference handling', () => {
  it('lookupReference finds child by reference config', () => {
    const c = ct();
    const child = cmp({ reference: 'myButton' });
    c.add(child);
    expect(c.lookupReference('myButton')).toBe(child);
  });

  it('lookupReference searches deep', () => {
    const outer = ct();
    const inner = new Container();
    const target = cmp({ reference: 'deepRef' });
    inner.add(target);
    outer.add(inner);
    expect(outer.lookupReference('deepRef')).toBe(target);
  });

  it('lookupReference returns undefined for unknown ref', () => {
    const c = ct();
    expect(c.lookupReference('nope')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Layout placeholder
// ═══════════════════════════════════════════════════════════════════════════

describe('Layout integration', () => {
  it('getLayout returns a layout instance', () => {
    const c = ct({ layout: 'auto' });
    const layout = c.getLayout();
    expect(layout).toBeDefined();
    expect(typeof layout.doLayout).toBe('function');
  });

  it('doLayout calls layout.doLayout', () => {
    const c = ct();
    const layout = c.getLayout();
    const spy = vi.spyOn(layout, 'doLayout');
    c.doLayout();
    expect(spy).toHaveBeenCalled();
  });

  it('layout with object config', () => {
    const c = ct({ layout: { type: 'hbox' } });
    expect(c.getLayout().type).toBe('hbox');
  });

  it('layout defaults to auto when undefined', () => {
    const c = ct();
    expect(c.getLayout().type).toBe('auto');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional branch coverage
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge cases and branch coverage', () => {
  it('remove returns item even if not found', () => {
    const c = ct();
    const orphan = cmp();
    const result = c.remove(orphan);
    expect(result).toBe(orphan);
  });

  it('insert with config applies defaults', () => {
    const c = ct({ defaults: { cls: 'dflt' } });
    const inserted = c.insert(0, { html: 'X' });
    expect(inserted.el!.classList.contains('dflt')).toBe(true);
  });

  it('insert clamps index to bounds', () => {
    const c = ct();
    c.add(cmp());
    const inserted = c.insert(999, cmp());
    expect(c.indexOf(inserted)).toBe(1);
  });

  it('removeAt throws for invalid index', () => {
    const c = ct();
    expect(() => c.removeAt(5)).toThrow();
  });

  it('queryBy works on empty container', () => {
    const c = ct();
    expect(c.queryBy(() => true)).toEqual([]);
  });

  it('query with [prop=value] matches string values', () => {
    const c = ct();
    c.add(cmp({ xtype: 'mytype' }));
    expect(c.query('[xtype=mytype]').length).toBe(1);
  });

  it('query with [prop=false]', () => {
    const c = ct();
    c.add(cmp({ hidden: false }), cmp({ hidden: true }));
    expect(c.query('[hidden=false]').length).toBe(1);
  });

  it('CQ :not works with #id', () => {
    const c = ct();
    const a = cmp();
    const b = cmp();
    c.add(a, b);
    const results = c.query(`:not(#${a.componentId})`);
    expect(results.length).toBe(1);
    expect(results[0]).toBe(b);
  });

  it('Container without renderTo can still manage items', () => {
    const c = new Container();
    c.add(cmp());
    expect(c.getCount()).toBe(1);
    expect(c.rendered).toBe(false);
  });

  it('getBodyEl falls back to el when bodyEl not created', () => {
    const c = new Container();
    c.render(document.body);
    // bodyEl should exist after render
    expect(c.getBodyEl()).toBeDefined();
  });
});
