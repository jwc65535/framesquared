import { describe, it, expect, vi, afterEach } from 'vitest';
import { ViewModel, Binding } from '@ext-ts/app';

afterEach(() => { document.body.innerHTML = ''; });

describe('Data binding integration', () => {
  it('ViewModel formula chain: data → subtotal → tax → total', () => {
    const vm = new ViewModel({
      data: { price: 100, quantity: 3, taxRate: 0.08 },
      formulas: {
        subtotal: (get) => (get('price') as number) * (get('quantity') as number),
        tax: (get) => (get('subtotal') as number) * (get('taxRate') as number),
        total: (get) => (get('subtotal') as number) + (get('tax') as number),
      },
    });

    expect(vm.get('subtotal')).toBe(300);
    expect(vm.get('tax')).toBe(24);
    expect(vm.get('total')).toBe(324);

    vm.set('quantity', 5);
    expect(vm.get('subtotal')).toBe(500);
    expect(vm.get('tax')).toBe(40);
    expect(vm.get('total')).toBe(540);

    vm.set('taxRate', 0.1);
    expect(vm.get('total')).toBe(550);
  });

  it('two-way binding updates ViewModel from external source', () => {
    const vm = new ViewModel({ data: { name: 'Alice', age: 30 } });
    const nameSpy = vi.fn();
    const ageSpy = vi.fn();

    const cleanup1 = Binding.twoWay(vm, 'name', nameSpy);
    const cleanup2 = Binding.twoWay(vm, 'age', ageSpy);

    vm.set('name', 'Bob');
    expect(nameSpy).toHaveBeenCalledWith('Bob');
    expect(ageSpy).toHaveBeenCalledWith(30); // age didn't change but datachange fires

    vm.set('age', 25);
    expect(ageSpy).toHaveBeenCalledWith(25);

    cleanup1();
    cleanup2();
    vm.set('name', 'Charlie');
    // nameSpy was called once for set('name','Bob') and once for set('age',25)
    // After cleanup, no more calls
    expect(nameSpy).toHaveBeenCalledTimes(2);
  });

  it('multiBind receives all bound values', () => {
    const vm = new ViewModel({
      data: { firstName: 'John', lastName: 'Doe', role: 'Admin' },
    });
    const spy = vi.fn();
    const cleanup = Binding.multiBind(vm, ['firstName', 'lastName', 'role'], spy);

    vm.set('lastName', 'Smith');
    expect(spy).toHaveBeenCalledWith(['John', 'Smith', 'Admin']);

    cleanup();
  });

  it('Binding.parse + evaluate with template expressions', () => {
    const vm = new ViewModel({
      data: { user: { first: 'Jane', last: 'Doe' }, role: 'Manager' },
    });

    const b = Binding.parse('{user.first} {user.last} ({role})');
    expect(Binding.evaluate(b, vm)).toBe('Jane Doe (Manager)');

    vm.set('user.first', 'John');
    expect(Binding.evaluate(b, vm)).toBe('John Doe (Manager)');
  });

  it('ViewModel hierarchy: child reads parent, parent updates propagate', () => {
    const parent = new ViewModel({
      data: { theme: 'dark', company: 'Acme' },
    });
    const child = new ViewModel({
      data: { page: 'dashboard' },
      formulas: {
        title: (get) => `${get('company')} - ${get('page')}`,
      },
      parent,
    });

    expect(child.get('title')).toBe('Acme - dashboard');
    expect(child.get('theme')).toBe('dark');

    parent.set('company', 'Globex');
    expect(child.get('title')).toBe('Globex - dashboard');

    // Child datachange event fires when parent changes
    const spy = vi.fn();
    child.on('datachange', spy);
    parent.set('theme', 'light');
    expect(spy).toHaveBeenCalled();
  });

  it('negated binding evaluates correctly', () => {
    const vm = new ViewModel({ data: { isAdmin: false, isLoading: true } });

    const b1 = Binding.parse('{!isAdmin}');
    expect(Binding.evaluate(b1, vm)).toBe(true);

    const b2 = Binding.parse('{!isLoading}');
    expect(Binding.evaluate(b2, vm)).toBe(false);

    vm.set('isAdmin', true);
    expect(Binding.evaluate(b1, vm)).toBe(false);
  });
});
