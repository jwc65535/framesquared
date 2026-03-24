import { describe, it, expect, vi, afterEach } from 'vitest';
import { Application, ViewController, ViewModel, Router } from '@ext-ts/app';
import { Model, Store } from '@ext-ts/data';

class UserModel extends Model {
  static override fields = [
    { name: 'id', type: 'int' as const },
    { name: 'name', type: 'string' as const },
    { name: 'email', type: 'string' as const },
  ];
}

afterEach(() => {
  Application.clearInstance();
  Router.stop();
  document.body.innerHTML = '';
  window.location.hash = '';
});

describe('Application lifecycle', () => {
  it('creates Application, registers controller and store, launches', () => {
    const launchSpy = vi.fn();
    const app = new Application({ name: 'TestApp', launch: launchSpy });

    const store = new Store({
      model: UserModel,
      data: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ],
    });

    const ctrl = new ViewController({ id: 'main' });
    app.registerController('main', ctrl);
    app.registerStore('users', store);

    app.start();
    expect(launchSpy).toHaveBeenCalled();
    expect(app.getController('main')).toBe(ctrl);
    expect(app.getStore('users')).toBe(store);
    expect(Application.getInstance()).toBe(app);
  });

  it('ViewModel binds to Store data and formulas update', () => {
    const store = new Store({
      model: UserModel,
      data: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ],
    });

    const vm = new ViewModel({
      data: { selectedUser: null, userCount: 0 },
      formulas: {
        statusText: (get) => {
          const count = get('userCount') as number;
          return count === 0 ? 'No users' : `${count} user(s)`;
        },
      },
    });

    // Sync store count to ViewModel
    vm.set('userCount', store.getCount());
    expect(vm.get('statusText')).toBe('2 user(s)');

    // Add a user
    store.add(UserModel.create({ id: 3, name: 'Charlie', email: 'c@example.com' }));
    vm.set('userCount', store.getCount());
    expect(vm.get('statusText')).toBe('3 user(s)');
  });

  it('full lifecycle: init → launch → use → destroy', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'LifecycleApp',
      launch: () => order.push('launched'),
    });
    app.onInit = () => order.push('init');
    app.onBeforeLaunch = () => order.push('beforeLaunch');
    app.onLaunch = () => order.push('afterLaunch');

    app.start();

    expect(order).toEqual(['init', 'beforeLaunch', 'launched', 'afterLaunch']);
  });

  it('Router integrates with Application', () => {
    const handler = vi.fn();
    Router.addRoute('users/:id', handler);
    Router.start();

    const app = new Application({ name: 'RouterApp' });
    app.start();

    Router.navigateTo('users/42');
    window.dispatchEvent(new Event('hashchange'));
    expect(handler).toHaveBeenCalledWith({ id: '42' });
  });
});
