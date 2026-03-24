# Getting Started with ext-ts

A modern, clean-room reimplementation of the Sencha ExtJS framework in TypeScript with native ESM modules.

## Installation

```bash
# Install the umbrella package (includes everything)
npm install ext-ts

# Or install individual packages
npm install @ext-ts/core @ext-ts/component @ext-ts/ui @ext-ts/data
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.5 (for development)
- Modern browser (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+)
- No Internet Explorer support

## Your First Application

### 1. Create a Panel

```typescript
import { Panel } from '@ext-ts/ui';

const panel = new Panel({
  title: 'Hello ext-ts',
  html: '<p>Welcome to ext-ts!</p>',
  width: 400,
  height: 300,
  renderTo: document.body,
});
```

### 2. Add a Grid with Data

```typescript
import { Model, Store } from '@ext-ts/data';
import { Grid } from '@ext-ts/grid';

// Define a model
class User extends Model {
  static fields = [
    { name: 'id', type: 'int' },
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string' },
  ];
}

// Create a store
const store = new Store({
  model: User,
  data: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ],
});

// Render a grid
const grid = new Grid({
  title: 'Users',
  store,
  columns: [
    { text: 'ID', dataIndex: 'id', width: 60 },
    { text: 'Name', dataIndex: 'name', width: 200 },
    { text: 'Email', dataIndex: 'email', flex: 1 },
  ],
  renderTo: document.body,
});
```

### 3. Create a Form

```typescript
import { FormPanel, TextField, NumberField } from '@ext-ts/form';

const form = new FormPanel({
  title: 'Edit User',
  renderTo: document.body,
  items: [
    new TextField({ name: 'name', fieldLabel: 'Name', allowBlank: false }),
    new TextField({ name: 'email', fieldLabel: 'Email', vtype: 'email' }),
    new NumberField({ name: 'age', fieldLabel: 'Age', minValue: 0 }),
  ],
});

// Set values
form.setValues({ name: 'Alice', email: 'alice@example.com', age: 30 });

// Validate
if (form.isValid()) {
  const values = form.getValues();
  console.log(values);
}
```

### 4. Full Application with MVC

```typescript
import { Application, ViewController, ViewModel, Router } from '@ext-ts/app';

const vm = new ViewModel({
  data: { userName: 'Guest', loggedIn: false },
  formulas: {
    greeting: (get) => `Hello, ${get('userName')}!`,
  },
});

const app = new Application({
  name: 'MyApp',
  launch() {
    console.log(vm.get('greeting')); // "Hello, Guest!"
    vm.set('userName', 'Alice');
    console.log(vm.get('greeting')); // "Hello, Alice!"
  },
});

app.start();
```

## Package Overview

| Package | Import | Purpose |
|---------|--------|---------|
| `@ext-ts/core` | `import { Base, Observable } from '@ext-ts/core'` | Class system, events, utilities, i18n |
| `@ext-ts/data` | `import { Model, Store } from '@ext-ts/data'` | Models, stores, proxies |
| `@ext-ts/component` | `import { Component, Container } from '@ext-ts/component'` | Component lifecycle, rendering |
| `@ext-ts/layout` | `import { HBoxLayout, BorderLayout } from '@ext-ts/layout'` | Layout managers |
| `@ext-ts/ui` | `import { Panel, Button, TabPanel } from '@ext-ts/ui'` | UI widgets |
| `@ext-ts/form` | `import { FormPanel, TextField } from '@ext-ts/form'` | Form fields, validation |
| `@ext-ts/grid` | `import { Grid, TreePanel } from '@ext-ts/grid'` | Grid, tree components |
| `@ext-ts/dd` | `import { Draggable, Droppable } from '@ext-ts/dd'` | Drag and drop |
| `@ext-ts/fx` | `import { Anim, Animation } from '@ext-ts/fx'` | Animations (WAAPI) |
| `@ext-ts/app` | `import { Application, ViewModel } from '@ext-ts/app'` | MVC/MVVM architecture |
| `@ext-ts/theme` | `import { ThemeManager, ModernTheme } from '@ext-ts/theme'` | Theming, CSS tokens |

## Tree Shaking

ext-ts is fully tree-shakeable. Import only what you need:

```typescript
// Only Button code is included in your bundle
import { Button } from '@ext-ts/ui';

// Deep imports for maximum control
import { Button } from 'ext-ts/ui';
```

## TypeScript Support

All packages include full TypeScript declarations. Configure your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"]
  }
}
```

## Next Steps

- [Class System Guide](./class-system.md)
- [Components Guide](./components.md)
- [Data Layer Guide](./data-layer.md)
- [Migration from ExtJS](./migration-from-extjs.md)
