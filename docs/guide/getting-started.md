# Getting Started with framesquared

A modern, clean-room reimplementation of the Sencha ExtJS framework in TypeScript with native ESM modules.

## Installation

```bash
# Install the umbrella package (includes everything)
npm install framesquared

# Or install individual packages
npm install @framesquared/core @framesquared/component @framesquared/ui @framesquared/data
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.5 (for development)
- Modern browser (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+)
- No Internet Explorer support

## Your First Application

### 1. Create a Panel

```typescript
import { Panel } from '@framesquared/ui';

const panel = new Panel({
  title: 'Hello framesquared',
  html: '<p>Welcome to framesquared!</p>',
  width: 400,
  height: 300,
  renderTo: document.body,
});
```

### 2. Add a Grid with Data

```typescript
import { Model, Store } from '@framesquared/data';
import { Grid } from '@framesquared/grid';

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
import { FormPanel, TextField, NumberField } from '@framesquared/form';

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
import { Application, ViewController, ViewModel, Router } from '@framesquared/app';

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
| `@framesquared/core` | `import { Base, Observable } from '@framesquared/core'` | Class system, events, utilities, i18n |
| `@framesquared/data` | `import { Model, Store } from '@framesquared/data'` | Models, stores, proxies |
| `@framesquared/component` | `import { Component, Container } from '@framesquared/component'` | Component lifecycle, rendering |
| `@framesquared/layout` | `import { HBoxLayout, BorderLayout } from '@framesquared/layout'` | Layout managers |
| `@framesquared/ui` | `import { Panel, Button, TabPanel } from '@framesquared/ui'` | UI widgets |
| `@framesquared/form` | `import { FormPanel, TextField } from '@framesquared/form'` | Form fields, validation |
| `@framesquared/grid` | `import { Grid, TreePanel } from '@framesquared/grid'` | Grid, tree components |
| `@framesquared/dd` | `import { Draggable, Droppable } from '@framesquared/dd'` | Drag and drop |
| `@framesquared/fx` | `import { Anim, Animation } from '@framesquared/fx'` | Animations (WAAPI) |
| `@framesquared/app` | `import { Application, ViewModel } from '@framesquared/app'` | MVC/MVVM architecture |
| `@framesquared/theme` | `import { ThemeManager, ModernTheme } from '@framesquared/theme'` | Theming, CSS tokens |

## Tree Shaking

framesquared is fully tree-shakeable. Import only what you need:

```typescript
// Only Button code is included in your bundle
import { Button } from '@framesquared/ui';

// Deep imports for maximum control
import { Button } from 'framesquared/ui';
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
