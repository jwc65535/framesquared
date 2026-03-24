# Application Architecture

ext-ts supports MVC and MVVM patterns through Application, ViewController, ViewModel, and Router.

## Application

```typescript
import { Application } from '@ext-ts/app';

const app = new Application({
  name: 'MyApp',
  launch() {
    // Build your UI here
    new Panel({ title: 'My App', renderTo: document.body });
  },
});

app.start(); // Calls init → beforeLaunch → launch → afterLaunch
```

### Controller Registry

```typescript
const ctrl = new ViewController({ id: 'users' });
app.registerController('users', ctrl);
app.getController('users'); // Returns the controller

app.registerStore('products', productStore);
app.getStore('products');
```

## ViewModel

ViewModels manage data and derived formulas:

```typescript
import { ViewModel } from '@ext-ts/app';

const vm = new ViewModel({
  data: {
    firstName: 'John',
    lastName: 'Doe',
    price: 100,
    quantity: 3,
  },
  formulas: {
    fullName: (get) => `${get('firstName')} ${get('lastName')}`,
    total: (get) => (get('price') as number) * (get('quantity') as number),
  },
});

vm.get('fullName'); // 'John Doe'
vm.get('total');    // 300

vm.set('quantity', 5);
vm.get('total');    // 500 — auto-recalculated
```

### Deep Paths

```typescript
vm.set('user.address.city', 'New York');
vm.get('user.address.city'); // 'New York'
```

### ViewModel Hierarchy

Child ViewModels inherit from parents:

```typescript
const parent = new ViewModel({ data: { theme: 'dark', company: 'Acme' } });
const child = new ViewModel({
  data: { page: 'dashboard' },
  formulas: {
    title: (get) => `${get('company')} — ${get('page')}`,
  },
  parent,
});

child.get('theme');  // 'dark' (inherited)
child.get('title');  // 'Acme — dashboard'

parent.set('company', 'Globex');
child.get('title');  // 'Globex — dashboard' (auto-updates)
```

### Events

```typescript
vm.on('datachange', (vm, data) => {
  console.log('Data changed:', data);
});
```

## Data Binding

```typescript
import { Binding } from '@ext-ts/app';

// One-way: ViewModel → callback
const cleanup = Binding.twoWay(vm, 'fullName', (value) => {
  document.title = value;
});

// Multi-bind: watch multiple paths
Binding.multiBind(vm, ['price', 'quantity'], ([price, qty]) => {
  console.log(`${qty} × $${price}`);
});

// Template expressions
const template = Binding.parse('{firstName} {lastName}');
const result = Binding.evaluate(template, vm); // 'John Doe'

// Negated bindings
const neg = Binding.parse('{!isLoading}');
Binding.evaluate(neg, vm); // true when isLoading is false
```

## ViewController

Controllers wire UI events to business logic:

```typescript
import { ViewController } from '@ext-ts/app';

class UsersController extends ViewController {
  constructor() {
    super({
      id: 'users',
      control: {
        'button[action=save]': { click: 'onSave' },
        'grid': { selectionchange: 'onSelect' },
      },
    });
  }

  onSave() { /* save logic */ }
  onSelect(selected: any[]) { /* handle selection */ }
}
```

## Router

Hash-based routing:

```typescript
import { Router } from '@ext-ts/app';

Router.addRoute('users', () => showUserList());
Router.addRoute('users/:id', (params) => showUser(params.id));
Router.addRoute('users/:id/edit', (params) => editUser(params.id));

Router.start(); // Begin listening to hashchange

Router.navigateTo('users/42');  // Sets window.location.hash
Router.getCurrentPath();        // 'users/42'
```

## Scheduler (Batched Updates)

The Scheduler batches ViewModel updates via microtasks:

```typescript
import { Scheduler } from '@ext-ts/app';

// Multiple rapid changes batch into one notification cycle
vm.set('a', 1);
vm.set('b', 2);
vm.set('c', 3);
// Formulas recalculate once after all three sets complete
```
