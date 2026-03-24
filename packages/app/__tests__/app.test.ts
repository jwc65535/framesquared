import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Application } from '../src/Application.js';
import { ViewController } from '../src/ViewController.js';
import { ViewModel } from '../src/ViewModel.js';
import { Binding } from '../src/Binding.js';
import { Router } from '../src/Router.js';

afterEach(() => {
  Application.clearInstance();
  Router.stop();
  window.location.hash = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// Application
// ═══════════════════════════════════════════════════════════════════════════

describe('Application — lifecycle', () => {
  it('creates with name', () => {
    const app = new Application({ name: 'MyApp' });
    expect(app.getName()).toBe('MyApp');
  });

  it('getInstance returns singleton after creation', () => {
    const app = new Application({ name: 'TestApp' });
    expect(Application.getInstance()).toBe(app);
  });

  it('launch callback is called', () => {
    const spy = vi.fn();
    const app = new Application({ name: 'App', launch: spy });
    app.start();
    expect(spy).toHaveBeenCalled();
  });

  it('lifecycle order: init → onBeforeLaunch → launch → onLaunch', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'App',
      launch: () => order.push('launch'),
    });
    // Override lifecycle hooks
    app.onInit = () => order.push('init');
    app.onBeforeLaunch = () => order.push('beforeLaunch');
    app.onLaunch = () => order.push('onLaunch');
    app.start();
    expect(order).toEqual(['init', 'beforeLaunch', 'launch', 'onLaunch']);
  });
});

describe('Application — controllers and stores', () => {
  it('registers and retrieves controllers', () => {
    const app = new Application({ name: 'App' });
    const ctrl = new ViewController({ id: 'main' });
    app.registerController('main', ctrl);
    expect(app.getController('main')).toBe(ctrl);
  });

  it('registers and retrieves stores', () => {
    const app = new Application({ name: 'App' });
    const mockStore = { type: 'store' };
    app.registerStore('users', mockStore);
    expect(app.getStore('users')).toBe(mockStore);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ViewController
// ═══════════════════════════════════════════════════════════════════════════

describe('ViewController', () => {
  it('creates with id', () => {
    const vc = new ViewController({ id: 'myCtrl' });
    expect(vc.getId()).toBe('myCtrl');
  });

  it('init sets the view', () => {
    const vc = new ViewController({ id: 'c1' });
    const mockView = { el: document.createElement('div'), lookupReference: vi.fn() };
    vc.init(mockView as any);
    expect(vc.getView()).toBe(mockView);
  });

  it('lookupReference delegates to view', () => {
    const vc = new ViewController({ id: 'c1' });
    const ref = { el: document.createElement('span') };
    const mockView = {
      el: document.createElement('div'),
      lookupReference: vi.fn(() => ref),
    };
    vc.init(mockView as any);
    expect(vc.lookupReference('myRef')).toBe(ref);
  });

  it('fireViewEvent fires on the view', () => {
    const vc = new ViewController({ id: 'c1' });
    const fireSpy = vi.fn();
    const mockView = {
      el: document.createElement('div'),
      lookupReference: vi.fn(),
      fire: fireSpy,
      fireEvent: fireSpy,
    };
    vc.init(mockView as any);
    vc.fireViewEvent('myevent', 'data');
    expect(fireSpy).toHaveBeenCalledWith('myevent', 'data');
  });

  it('control config wires event handlers by method name', () => {
    const spy = vi.fn();
    const vc = new ViewController({
      id: 'c1',
      control: {
        '#saveBtn': { click: 'onSave' },
      },
    });
    (vc as any).onSave = spy;

    // Mock view with query
    const btn = document.createElement('button');
    btn.id = 'saveBtn';
    const viewEl = document.createElement('div');
    viewEl.appendChild(btn);

    const mockView: any = {
      el: viewEl,
      lookupReference: vi.fn(),
      query: (sel: string) => viewEl.querySelectorAll(sel.replace('#', '[id="') + '"]'),
    };
    vc.init(mockView);
    vc.applyControl();

    btn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('destroy cleans up', () => {
    const vc = new ViewController({ id: 'c1' });
    vc.init({ el: document.createElement('div'), lookupReference: vi.fn() } as any);
    vc.destroy();
    expect(vc.getView()).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ViewModel — data
// ═══════════════════════════════════════════════════════════════════════════

describe('ViewModel — data', () => {
  it('get returns initial data', () => {
    const vm = new ViewModel({ data: { name: 'Alice', age: 30 } });
    expect(vm.get('name')).toBe('Alice');
    expect(vm.get('age')).toBe(30);
  });

  it('set updates data', () => {
    const vm = new ViewModel({ data: { x: 1 } });
    vm.set('x', 2);
    expect(vm.get('x')).toBe(2);
  });

  it('set with object updates multiple', () => {
    const vm = new ViewModel({ data: { a: 1, b: 2 } });
    vm.set({ a: 10, b: 20 });
    expect(vm.get('a')).toBe(10);
    expect(vm.get('b')).toBe(20);
  });

  it('get with nested path', () => {
    const vm = new ViewModel({ data: { user: { name: 'Bob', address: { city: 'NYC' } } } });
    expect(vm.get('user.name')).toBe('Bob');
    expect(vm.get('user.address.city')).toBe('NYC');
  });

  it('set with nested path', () => {
    const vm = new ViewModel({ data: { user: { name: 'Old' } } });
    vm.set('user.name', 'New');
    expect(vm.get('user.name')).toBe('New');
  });

  it('fires datachange event on set', () => {
    const vm = new ViewModel({ data: { x: 1 } });
    const spy = vi.fn();
    vm.on('datachange', spy);
    vm.set('x', 2);
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ViewModel — formulas
// ═══════════════════════════════════════════════════════════════════════════

describe('ViewModel — formulas', () => {
  it('formula computes from data', () => {
    const vm = new ViewModel({
      data: { firstName: 'John', lastName: 'Doe' },
      formulas: {
        fullName: (get: (p: string) => unknown) => `${get('firstName')} ${get('lastName')}`,
      },
    });
    expect(vm.get('fullName')).toBe('John Doe');
  });

  it('formula recomputes when dependency changes', () => {
    const vm = new ViewModel({
      data: { firstName: 'John', lastName: 'Doe' },
      formulas: {
        fullName: (get: (p: string) => unknown) => `${get('firstName')} ${get('lastName')}`,
      },
    });
    vm.set('firstName', 'Jane');
    expect(vm.get('fullName')).toBe('Jane Doe');
  });

  it('multiple formulas with different dependencies', () => {
    const vm = new ViewModel({
      data: { price: 100, quantity: 3, taxRate: 0.1 },
      formulas: {
        subtotal: (get: (p: string) => unknown) => (get('price') as number) * (get('quantity') as number),
        tax: (get: (p: string) => unknown) => (get('price') as number) * (get('quantity') as number) * (get('taxRate') as number),
        total: (get: (p: string) => unknown) => {
          const p = get('price') as number;
          const q = get('quantity') as number;
          const t = get('taxRate') as number;
          return p * q * (1 + t);
        },
      },
    });
    expect(vm.get('subtotal')).toBe(300);
    expect(vm.get('tax')).toBe(30);
    expect(vm.get('total')).toBe(330);
    vm.set('quantity', 5);
    expect(vm.get('subtotal')).toBe(500);
    expect(vm.get('total')).toBe(550);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ViewModel — stores
// ═══════════════════════════════════════════════════════════════════════════

describe('ViewModel — stores', () => {
  it('creates named stores from config', () => {
    const vm = new ViewModel({
      stores: {
        users: { data: [{ name: 'Alice' }] },
        products: { data: [{ title: 'Widget' }] },
      },
    });
    expect(vm.getStore('users')).toBeDefined();
    expect(vm.getStore('products')).toBeDefined();
  });

  it('store data is accessible', () => {
    const vm = new ViewModel({
      stores: {
        items: { data: [{ id: 1 }, { id: 2 }] },
      },
    });
    const store = vm.getStore('items');
    expect(store.data.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Binding
// ═══════════════════════════════════════════════════════════════════════════

describe('Binding — parser', () => {
  it('parses simple path: {name}', () => {
    const b = Binding.parse('{name}');
    expect(b.paths).toEqual(['name']);
    expect(b.negated).toBe(false);
  });

  it('parses negated path: {!isAdmin}', () => {
    const b = Binding.parse('{!isAdmin}');
    expect(b.paths).toEqual(['isAdmin']);
    expect(b.negated).toBe(true);
  });

  it('parses expression: {firstName} {lastName}', () => {
    const b = Binding.parse('{firstName} {lastName}');
    expect(b.paths).toContain('firstName');
    expect(b.paths).toContain('lastName');
    expect(b.expression).toBe(true);
  });

  it('parses nested path: {user.name}', () => {
    const b = Binding.parse('{user.name}');
    expect(b.paths).toEqual(['user.name']);
  });
});

describe('Binding — evaluation', () => {
  it('evaluates simple path from ViewModel', () => {
    const vm = new ViewModel({ data: { name: 'Alice' } });
    const b = Binding.parse('{name}');
    expect(Binding.evaluate(b, vm)).toBe('Alice');
  });

  it('evaluates negated path', () => {
    const vm = new ViewModel({ data: { isAdmin: true } });
    const b = Binding.parse('{!isAdmin}');
    expect(Binding.evaluate(b, vm)).toBe(false);
  });

  it('evaluates expression template', () => {
    const vm = new ViewModel({ data: { firstName: 'John', lastName: 'Doe' } });
    const b = Binding.parse('{firstName} {lastName}');
    expect(Binding.evaluate(b, vm)).toBe('John Doe');
  });

  it('evaluates nested path', () => {
    const vm = new ViewModel({ data: { user: { email: 'a@b.com' } } });
    const b = Binding.parse('{user.email}');
    expect(Binding.evaluate(b, vm)).toBe('a@b.com');
  });
});

describe('Binding — two-way', () => {
  it('creates a two-way binding link', () => {
    const vm = new ViewModel({ data: { name: 'Alice' } });
    const spy = vi.fn();
    const cleanup = Binding.twoWay(vm, 'name', spy);
    vm.set('name', 'Bob');
    expect(spy).toHaveBeenCalledWith('Bob');
    cleanup();
  });

  it('cleanup stops receiving updates', () => {
    const vm = new ViewModel({ data: { name: 'Alice' } });
    const spy = vi.fn();
    const cleanup = Binding.twoWay(vm, 'name', spy);
    cleanup();
    vm.set('name', 'Charlie');
    expect(spy).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Router
// ═══════════════════════════════════════════════════════════════════════════

describe('Router', () => {
  it('registers routes', () => {
    Router.addRoute('user/:id', vi.fn());
    expect(Router.getRoutes().length).toBeGreaterThan(0);
    Router.stop();
  });

  it('matches route with params', () => {
    const handler = vi.fn();
    Router.addRoute('user/:id', handler);
    Router.start();
    window.location.hash = '#user/42';
    window.dispatchEvent(new Event('hashchange'));
    expect(handler).toHaveBeenCalledWith({ id: '42' });
    Router.stop();
  });

  it('matches route without params', () => {
    const handler = vi.fn();
    Router.addRoute('about', handler);
    Router.start();
    window.location.hash = '#about';
    window.dispatchEvent(new Event('hashchange'));
    expect(handler).toHaveBeenCalledWith({});
    Router.stop();
  });

  it('multiple params', () => {
    const handler = vi.fn();
    Router.addRoute('search/:query/page/:num', handler);
    Router.start();
    window.location.hash = '#search/hello/page/3';
    window.dispatchEvent(new Event('hashchange'));
    expect(handler).toHaveBeenCalledWith({ query: 'hello', num: '3' });
    Router.stop();
  });

  it('before route guard can prevent navigation', () => {
    const handler = vi.fn();
    Router.addRoute('protected', handler);
    Router.setBeforeRoute(() => false); // block all
    Router.start();
    window.location.hash = '#protected';
    window.dispatchEvent(new Event('hashchange'));
    expect(handler).not.toHaveBeenCalled();
    Router.setBeforeRoute(null);
    Router.stop();
  });

  it('before route guard allows navigation when returning true', () => {
    const handler = vi.fn();
    Router.addRoute('allowed', handler);
    Router.setBeforeRoute(() => true);
    Router.start();
    window.location.hash = '#allowed';
    window.dispatchEvent(new Event('hashchange'));
    expect(handler).toHaveBeenCalled();
    Router.setBeforeRoute(null);
    Router.stop();
  });

  it('wildcard route matches any suffix', () => {
    const handler = vi.fn();
    Router.addRoute('docs/*path', handler);
    Router.start();
    window.location.hash = '#docs/api/models/user';
    window.dispatchEvent(new Event('hashchange'));
    expect(handler).toHaveBeenCalledWith({ path: 'api/models/user' });
    Router.stop();
  });

  it('navigateTo changes hash', () => {
    Router.start();
    Router.navigateTo('dashboard');
    expect(window.location.hash).toBe('#dashboard');
    Router.stop();
  });

  it('getCurrentHash returns current hash without #', () => {
    window.location.hash = '#test/path';
    expect(Router.getCurrentHash()).toBe('test/path');
  });
});
