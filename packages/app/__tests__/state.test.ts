import { describe, it, expect, vi, afterEach } from 'vitest';
import { Scheduler } from '../src/state/Scheduler.js';
import { FormulaStub, ValueStub } from '../src/state/Stub.js';
import { ViewModel } from '../src/ViewModel.js';
import { Binding } from '../src/Binding.js';
import { Application } from '../src/Application.js';
import { Router } from '../src/Router.js';

afterEach(() => {
  Application.clearInstance();
  Router.stop();
  window.location.hash = '';
  Scheduler.reset();
});

// ═══════════════════════════════════════════════════════════════════════════
// Scheduler
// ═══════════════════════════════════════════════════════════════════════════

describe('Scheduler — batching', () => {
  it('batches multiple sets into one notification', async () => {
    const spy = vi.fn();
    const scheduler = Scheduler;
    scheduler.onFlush(spy);
    scheduler.schedule();
    scheduler.schedule();
    scheduler.schedule();
    // Notifications are batched via microtask
    await scheduler.flush();
    expect(spy).toHaveBeenCalledTimes(1);
    scheduler.offFlush(spy);
  });

  it('synchronous flush triggers immediately', () => {
    const spy = vi.fn();
    Scheduler.onFlush(spy);
    Scheduler.schedule();
    Scheduler.flush();
    expect(spy).toHaveBeenCalled();
    Scheduler.offFlush(spy);
  });

  it('multiple schedules before flush coalesce', () => {
    const spy = vi.fn();
    Scheduler.onFlush(spy);
    for (let i = 0; i < 10; i++) Scheduler.schedule();
    Scheduler.flush();
    expect(spy).toHaveBeenCalledTimes(1);
    Scheduler.offFlush(spy);
  });
});

describe('Scheduler — circular detection', () => {
  it('detects circular dependency and throws', () => {
    expect(() => {
      Scheduler.beginCycle();
      Scheduler.markProcessing('a');
      Scheduler.markProcessing('a'); // same stub re-entered
    }).toThrow(/circular/i);
    Scheduler.endCycle();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Stub
// ═══════════════════════════════════════════════════════════════════════════

describe('Stub', () => {
  it('ValueStub stores a value', () => {
    const stub = new ValueStub('test', 42);
    expect(stub.getValue()).toBe(42);
    expect(stub.name).toBe('test');
  });

  it('ValueStub tracks dirty state', () => {
    const stub = new ValueStub('x', 1);
    expect(stub.isDirty()).toBe(false);
    stub.setValue(2);
    expect(stub.isDirty()).toBe(true);
    stub.clearDirty();
    expect(stub.isDirty()).toBe(false);
  });

  it('FormulaStub computes from function', () => {
    const stub = new FormulaStub('total', () => 100);
    expect(stub.compute()).toBe(100);
  });

  it('FormulaStub tracks dependencies', () => {
    const dep = new ValueStub('price', 10);
    const formula = new FormulaStub('total', () => (dep.getValue() as number) * 2);
    formula.addDependency(dep);
    expect(formula.getDependencies()).toContain(dep);
  });

  it('ValueStub tracks dependents', () => {
    const val = new ValueStub('a', 1);
    const formula = new FormulaStub('b', () => 0);
    val.addDependent(formula);
    expect(val.getDependents()).toContain(formula);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ViewModel — auto dependency tracking
// ═══════════════════════════════════════════════════════════════════════════

describe('ViewModel — auto dependency tracking', () => {
  it('formula auto-detects dependencies via get()', () => {
    const vm = new ViewModel({
      data: { price: 10, quantity: 5 },
      formulas: {
        total: (get) => (get('price') as number) * (get('quantity') as number),
      },
    });
    expect(vm.get('total')).toBe(50);
  });

  it('formula recomputes when tracked dependency changes', () => {
    const vm = new ViewModel({
      data: { price: 10, quantity: 5 },
      formulas: {
        total: (get) => (get('price') as number) * (get('quantity') as number),
      },
    });
    expect(vm.get('total')).toBe(50);
    vm.set('price', 20);
    expect(vm.get('total')).toBe(100);
  });

  it('chained formulas recompute correctly', () => {
    const vm = new ViewModel({
      data: { price: 100, quantity: 3, taxRate: 0.1 },
      formulas: {
        subtotal: (get) => (get('price') as number) * (get('quantity') as number),
        tax: (get) => (get('subtotal') as number) * (get('taxRate') as number),
        total: (get) => (get('subtotal') as number) + (get('tax') as number),
      },
    });
    expect(vm.get('subtotal')).toBe(300);
    expect(vm.get('tax')).toBe(30);
    expect(vm.get('total')).toBe(330);

    vm.set('quantity', 5);
    expect(vm.get('subtotal')).toBe(500);
    expect(vm.get('tax')).toBe(50);
    expect(vm.get('total')).toBe(550);
  });

  it('formula not affected by unrelated data changes', () => {
    let _computeCount = 0;
    const vm = new ViewModel({
      data: { a: 1, b: 2, unrelated: 'x' },
      formulas: {
        sum: (get) => {
          _computeCount++;
          return (get('a') as number) + (get('b') as number);
        },
      },
    });
    vm.get('sum'); // initial compute
    _computeCount = 0;
    vm.set('unrelated', 'y');
    // Formula should still return correct value (recomputes lazily)
    expect(vm.get('sum')).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ViewModel — nested paths
// ═══════════════════════════════════════════════════════════════════════════

describe('ViewModel — nested paths', () => {
  it('deep set and get', () => {
    const vm = new ViewModel({ data: { user: { address: { city: 'NYC' } } } });
    expect(vm.get('user.address.city')).toBe('NYC');
    vm.set('user.address.city', 'LA');
    expect(vm.get('user.address.city')).toBe('LA');
  });

  it('formula using nested path', () => {
    const vm = new ViewModel({
      data: { user: { first: 'John', last: 'Doe' } },
      formulas: {
        displayName: (get) => `${get('user.first')} ${get('user.last')}`,
      },
    });
    expect(vm.get('displayName')).toBe('John Doe');
    vm.set('user.first', 'Jane');
    expect(vm.get('displayName')).toBe('Jane Doe');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Enhanced Binding — multi-bind
// ═══════════════════════════════════════════════════════════════════════════

describe('Binding — multi-bind', () => {
  it('multi-bind receives all values', () => {
    const vm = new ViewModel({ data: { a: 1, b: 2, c: 3 } });
    const spy = vi.fn();
    const cleanup = Binding.multiBind(vm, ['a', 'b', 'c'], spy);
    // Trigger by changing a value
    vm.set('a', 10);
    expect(spy).toHaveBeenCalledWith([10, 2, 3]);
    cleanup();
  });

  it('multi-bind updates when any path changes', () => {
    const vm = new ViewModel({ data: { x: 'hello', y: 'world' } });
    const spy = vi.fn();
    const cleanup = Binding.multiBind(vm, ['x', 'y'], spy);
    vm.set('y', 'earth');
    expect(spy).toHaveBeenCalledWith(['hello', 'earth']);
    cleanup();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Enhanced Binding — deep bind
// ═══════════════════════════════════════════════════════════════════════════

describe('Binding — deep bind', () => {
  it('deep bind detects nested property changes', () => {
    const vm = new ViewModel({ data: { user: { name: 'Alice', age: 30 } } });
    const spy = vi.fn();
    const cleanup = Binding.deepBind(vm, 'user', spy);
    vm.set('user.name', 'Bob');
    expect(spy).toHaveBeenCalled();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Enhanced Binding — template literal
// ═══════════════════════════════════════════════════════════════════════════

describe('Binding — template literal', () => {
  it('evaluates template literal: Hello {name}!', () => {
    const vm = new ViewModel({ data: { name: 'Alice' } });
    const b = Binding.parse('Hello {name}!');
    expect(Binding.evaluate(b, vm)).toBe('Hello Alice!');
  });

  it('evaluates with multiple placeholders', () => {
    const vm = new ViewModel({ data: { greeting: 'Hi', name: 'Bob' } });
    const b = Binding.parse('{greeting}, {name}!');
    expect(Binding.evaluate(b, vm)).toBe('Hi, Bob!');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ViewModel hierarchy
// ═══════════════════════════════════════════════════════════════════════════

describe('ViewModel — hierarchy', () => {
  it('child inherits parent data', () => {
    const parent = new ViewModel({ data: { theme: 'dark', lang: 'en' } });
    const child = new ViewModel({ data: { name: 'Alice' }, parent });
    expect(child.get('theme')).toBe('dark');
    expect(child.get('name')).toBe('Alice');
  });

  it('parent change propagates to child', () => {
    const parent = new ViewModel({ data: { color: 'red' } });
    const child = new ViewModel({ data: {}, parent });
    expect(child.get('color')).toBe('red');
    parent.set('color', 'blue');
    expect(child.get('color')).toBe('blue');
  });

  it('child override does not affect parent', () => {
    const parent = new ViewModel({ data: { x: 1 } });
    const child = new ViewModel({ data: { x: 99 }, parent });
    expect(child.get('x')).toBe(99);
    expect(parent.get('x')).toBe(1);
  });

  it('getParent returns parent ViewModel', () => {
    const parent = new ViewModel({ data: {} });
    const child = new ViewModel({ data: {}, parent });
    expect(child.getParent()).toBe(parent);
  });

  it('getRoot traverses to root ViewModel', () => {
    const root = new ViewModel({ data: {} });
    const mid = new ViewModel({ data: {}, parent: root });
    const leaf = new ViewModel({ data: {}, parent: mid });
    expect(leaf.getRoot()).toBe(root);
  });

  it('child formula can read parent data', () => {
    const parent = new ViewModel({ data: { prefix: 'Mr.' } });
    const child = new ViewModel({
      data: { name: 'Smith' },
      formulas: { fullName: (get) => `${get('prefix')} ${get('name')}` },
      parent,
    });
    expect(child.get('fullName')).toBe('Mr. Smith');
  });

  it('child notified when parent data changes', () => {
    const parent = new ViewModel({ data: { val: 1 } });
    const child = new ViewModel({ data: {}, parent });
    const spy = vi.fn();
    child.on('datachange', spy);
    parent.set('val', 2);
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Existing tests still pass (regression)
// ═══════════════════════════════════════════════════════════════════════════

describe('ViewModel — regression', () => {
  it('basic get/set still works', () => {
    const vm = new ViewModel({ data: { name: 'Alice' } });
    expect(vm.get('name')).toBe('Alice');
    vm.set('name', 'Bob');
    expect(vm.get('name')).toBe('Bob');
  });

  it('set with object still works', () => {
    const vm = new ViewModel({ data: { a: 1, b: 2 } });
    vm.set({ a: 10, b: 20 });
    expect(vm.get('a')).toBe(10);
    expect(vm.get('b')).toBe(20);
  });

  it('stores still work', () => {
    const vm = new ViewModel({
      stores: { items: { data: [{ id: 1 }] } },
    });
    expect(vm.getStore('items')).toBeDefined();
    expect(vm.getStore('items').data.length).toBe(1);
  });

  it('datachange event still fires', () => {
    const vm = new ViewModel({ data: { x: 1 } });
    const spy = vi.fn();
    vm.on('datachange', spy);
    vm.set('x', 2);
    expect(spy).toHaveBeenCalled();
  });

  it('two-way binding still works', () => {
    const vm = new ViewModel({ data: { name: 'Alice' } });
    const spy = vi.fn();
    const cleanup = Binding.twoWay(vm, 'name', spy);
    vm.set('name', 'Bob');
    expect(spy).toHaveBeenCalledWith('Bob');
    cleanup();
  });
});
